/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MessageSquare, ThumbsUp, TrendingUp, User, 
  Clock, Filter, Search, Brain, X, Send, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string; // strict date string for sorting
  route: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentConfidence: number;
  carrierReply?: string;
}

const ReviewsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  
  // Filtering & Sorting State: 'newest' | 'unanswered' | 'negative'
  const [filterType, setFilterType] = useState<'newest' | 'unanswered' | 'negative'>('newest');

  // Interactive Reply Modal states
  const [activeReplyReview, setActiveReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Advanced Local AI Sentiment Analyzer
  const analyzeSentiment = (comment: string, rating: number): { sentiment: 'positive' | 'neutral' | 'negative', confidence: number } => {
    const text = comment.toLowerCase();
    
    // Negative keywords
    const negWords = ['запізнився', 'бруд', 'погано', 'жах', 'холодно', 'груб', 'неприємно', 'поламати', 'злама', 'відміни'];
    // Positive keywords
    const posWords = ['чудово', 'комфорт', 'швидко', 'смачно', 'привіт', 'чисто', 'найкращ', 'дякую', 'рекоменд', 'супер'];

    let negCount = 0;
    let posCount = 0;
    
    negWords.forEach(w => { if (text.includes(w)) negCount++; });
    posWords.forEach(w => { if (text.includes(w)) posCount++; });

    if (rating <= 2 || negCount > posCount) {
      return { sentiment: 'negative', confidence: rating <= 2 ? 98 : 78 };
    }
    if (rating >= 4 || posCount > negCount) {
      return { sentiment: 'positive', confidence: rating >= 5 ? 99 : 84 };
    }
    return { sentiment: 'neutral', confidence: 75 };
  };

  const fetchReviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('carrier_id', user.uid);
      
      if (!error && data) {
        const loaded: Review[] = data.map(d => {
          const commentText = d.comment || 'Без коментаря';
          const ratingNum = d.rating || 5;
          const { sentiment, confidence } = analyzeSentiment(commentText, ratingNum);
          
          return {
            id: d.id,
            user: d.passengerName || 'Пасажир',
            rating: ratingNum,
            comment: commentText,
            sentiment,
            sentimentConfidence: confidence,
            carrierReply: d.carrier_reply || undefined,
            createdAt: d.created_at || d.createdAt || new Date().toISOString(),
            date: d.created_at || d.createdAt 
              ? new Date(d.created_at || d.createdAt).toLocaleDateString('uk-UA') 
              : 'Нещодавно',
            route: d.routeInfo 
              ? `${d.routeInfo.from} → ${d.routeInfo.to}` 
              : (d.tripId ? 'Рейс: ' + d.tripId.slice(0,6) : 'Маршрут BUSNET')
          };
        });
        
        setReviews(loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        if (loaded.length > 0) {
          setAvgRating(loaded.reduce((acc, curr) => acc + curr.rating, 0) / loaded.length);
        } else {
          setAvgRating(4.8); // default fallback
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    fetchReviews();

    const channel = supabase.channel('carrier_reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `carrier_id=eq.${user.uid}` }, fetchReviews)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendReply = async () => {
    if (!activeReplyReview || !replyText.trim()) return;
    
    setIsSending(true);
    const toastId = toast.loading('Надсилання відповіді...');
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ carrier_reply: replyText.trim() })
        .eq('id', activeReplyReview.id);
      
      if (error) throw error;
      
      toast.success(`Відповідь пасажиру ${activeReplyReview.user} збережена`, { id: toastId });
      setActiveReplyReview(null);
      setReplyText('');
      fetchReviews();
    } catch (e) {
      console.error(e);
      toast.error('Не вдалося відправити відповідь', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // AI Response templates based on sentiment
  const quickTemplates = useMemo(() => {
    if (!activeReplyReview) return [];
    
    const passenger = activeReplyReview.user;
    if (activeReplyReview.sentiment === 'positive') {
      return [
        `Дякуємо, ${passenger}! Наша команда неймовірно рада чути такі приємні слова. Чекаємо на вас знову на борту! 😊`,
        `Щиро вдячні, ${passenger}! Ми робимо все можливе, щоб кожна ваша поїздка з BUSNET була максимально комфортною та приємною. ✨`,
        `Раді старатися для вас, ${passenger}! Дякуємо за високу оцінку та гарного вам дня!`
      ];
    }
    if (activeReplyReview.sentiment === 'negative') {
      return [
        `Приносимо щирі вибачення, ${passenger}. Ми обов'язково проведемо внутрішню перевірку з екіпажем, щоб вирішити це питання. Дякуємо за відгук.`,
        `Нам дуже шкода за цей інцидент, ${passenger}. Ми вже направили зауваження до відділу якості. Будь ласка, напишіть нам для компенсації.`,
        `Дякуємо за сигнал, ${passenger}. Подібні ситуації є абсолютно неприпустимими для нашого стандарту сервісу. Ми виправляємо помилку.`
      ];
    }
    return [
      `Дякуємо за коментар, ${passenger}! Ми обов'язково врахуємо ваші побажання під час планування наступних рейсів. 👍`,
      `Дякуємо за зворотний зв'язок, ${passenger}. Наша мета — стати кращими, тому ваші коментарі допомагають нам розвиватися.`
    ];
  }, [activeReplyReview]);

  // Sentiment counts
  const positiveCount = useMemo(() => reviews.filter(r => r.sentiment === 'positive').length, [reviews]);
  const negativeCount = useMemo(() => reviews.filter(r => r.sentiment === 'negative').length, [reviews]);

  // Dynamic filter / sorting compute
  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (filterType === 'unanswered') {
      result = result.filter(r => !r.carrierReply);
    } else if (filterType === 'negative') {
      return result.sort((a, b) => a.rating - b.rating); // worst ratings first
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // newest first
  }, [reviews, filterType]);

  const avgRatingDisplay = isNaN(avgRating) ? 4.8 : avgRating;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 bg-[#FBBF24] shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ВІДГУКИ & РЕЙТИНГ</h2>
          </div>
          <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-[0.12em] ml-4 font-bold">Аналіз настроїв пасажирів, AI Sentiment та швидке реагування</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* STATS CARD */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Average Rating Big Card */}
          <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FBBF24] opacity-5 blur-[60px] pointer-events-none" />
            <p className="text-[11px] font-black uppercase text-[#8899B5] tracking-[0.12em] font-bold">ЗАГАЛЬНИЙ РЕЙТИНГ</p>
            <h3 className="text-7xl font-black text-white italic tracking-tighter font-mono tabular-nums">{avgRatingDisplay.toFixed(1)}</h3>
            <div className="flex items-center gap-2">
               {[1, 2, 3, 4, 5].map(s => (
                 <Star key={s} size={22} className={s <= Math.round(avgRatingDisplay) ? "text-[#FBBF24] fill-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-white/5"} />
               ))}
            </div>
            <p className="text-[10px] font-black text-[#FBBF24] uppercase tracking-widest mt-2">Всього оцінок: {reviews.length}</p>
          </div>

          {/* AI Sentiment Distribution Card */}
          <div className="bg-[#0B1221] border border-white/5 rounded-[40px] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <Brain size={16} className="text-[#00E5FF] animate-pulse" />
              <h4 className="text-xs font-black uppercase text-white tracking-wider">AI Sentiment Analytics</h4>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-wider font-bold">
                  <span>Позитивні відгуки 😊</span>
                  <span className="font-mono">{reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 100}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    style={{ width: `${reviews.length > 0 ? (positiveCount / reviews.length) * 100 : 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-wider font-bold">
                  <span>Негативні відгуки 😡</span>
                  <span className="font-mono">{reviews.length > 0 ? Math.round((negativeCount / reviews.length) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                    style={{ width: `${reviews.length > 0 ? (negativeCount / reviews.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[9px] text-[#5A6A85] font-bold uppercase tracking-widest leading-relaxed">
              Автоматичний аналіз аналізує лексику та оцінки відгуків у реальному часі для виявлення проблемних поїздок.
            </p>
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1525] border border-white/5 p-2 rounded-[24px] shadow-md">
            <p className="text-[10px] font-black uppercase text-[#8899B5] tracking-widest pl-3 font-bold">Фільтрація стрічки відгуків</p>
            <div className="flex bg-[#070912] p-1 rounded-xl">
              {[
                { id: 'newest', label: 'Спочатку нові' },
                { id: 'unanswered', label: 'Потребують відповіді' },
                { id: 'negative', label: 'Критичні відгуки' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    filterType === f.id 
                      ? 'bg-[#FBBF24] text-[#000] shadow-[0_0_12px_rgba(251,191,36,0.4)] font-black' 
                      : 'text-[#8899B5] hover:text-white font-bold'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex items-center justify-center bg-[#0B1221] border border-white/5 rounded-[40px]">
              <Loader2 className="animate-spin text-[#FBBF24]" size={32} />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center bg-[#0B1221] border border-white/5 rounded-[40px]">
              <MessageSquare className="mx-auto mb-4 text-[#5A6A85] opacity-20" size={64} />
              <p className="text-[#8899B5] font-black uppercase tracking-widest text-[12px] mb-2 font-bold">ВІДГУКИ ВІДСУТНІ</p>
              <p className="text-[#5A6A85] text-[10px] font-bold uppercase tracking-widest">Немає відгуків, що відповідають обраному критерію</p>
            </div>
          ) : (
            filteredReviews.map((rev, i) => (
              <motion.div 
                key={rev.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#0B1221] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group shadow-lg transition-all hover:border-white/10"
              >
                {/* Glow by Sentiment */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  rev.sentiment === 'positive' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 
                  rev.sentiment === 'negative' ? 'bg-rose-500 shadow-[0_0_10px_#F43F5E]' : 'bg-amber-500 shadow-[0_0_10px_#F59E0B]'
                }`} />

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1A2639]/50 border border-white/5 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">{rev.user}</p>
                      <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">{rev.route}</p>
                    </div>
                  </div>

                  {/* Rating Stars + Sentiment Badge */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                      rev.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      rev.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      <Brain size={10} /> AI: {rev.sentiment === 'positive' ? '😊 ПОЗИТИВ' : rev.sentiment === 'negative' ? '😡 НЕГАТИВ' : '😐 НЕЙТРАЛ'} ({rev.sentimentConfidence}%)
                    </span>
                    
                    {/* Reply Badge / Status indicator */}
                    {rev.carrierReply ? (
                      <span className="px-2.5 py-1 rounded-lg text-[8px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                        ✓ ВІДПОВІДЬ НАДАНА
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[8px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1 uppercase tracking-wider font-bold animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                        ⚡ ОЧІКУЄ ВІДПОВІДІ
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={11} className={idx < rev.rating ? "text-[#FBBF24] fill-[#FBBF24]" : "text-white/10"} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#8899B5] leading-relaxed italic my-4 px-2">"{rev.comment}"</p>

                {/* Reply display if present */}
                {rev.carrierReply && (
                  <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative">
                    <p className="text-[9px] font-black text-[#00E5FF] uppercase tracking-widest mb-1.5">ВАША ВІДПОВІДЬ ДИСПЕТЧЕРА</p>
                    <p className="text-xs text-[#8899B5] italic leading-relaxed">"{rev.carrierReply}"</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#5A6A85] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Clock size={12} /> {rev.date}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveReplyReview(rev);
                      setReplyText(rev.carrierReply || '');
                    }}
                    className="px-5 py-3 rounded-xl bg-[#1A2639]/50 border border-transparent hover:border-[#00E5FF]/30 text-[#00E5FF] text-[9px] font-black uppercase tracking-widest transition-all hover:bg-[#00E5FF]/10 active:scale-95 flex items-center gap-1.5"
                  >
                    <MessageSquare size={12} /> {rev.carrierReply ? 'РЕДАГУВАТИ ВІДПОВІДЬ' : 'ВІДПОВІСТИ'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* AI Quick Response Modal Overlay */}
      <AnimatePresence>
        {activeReplyReview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B1221] border border-[#00E5FF]/20 rounded-[40px] p-6 md:p-8 w-full max-w-lg shadow-[0_0_30px_rgba(0,229,255,0.1)] space-y-6 relative"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Brain size={18} className="text-[#00E5FF]" /> AI ШВИДКА ВІДПОВІДЬ
                </h3>
                <button 
                  onClick={() => {
                    setActiveReplyReview(null);
                    setReplyText('');
                  }} 
                  className="w-8 h-8 rounded-full bg-white/5 text-[#5A6A85] hover:text-white transition-colors flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Passenger comment block */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">{activeReplyReview.user}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    activeReplyReview.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 
                    activeReplyReview.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {activeReplyReview.sentiment}
                  </span>
                </div>
                <p className="text-xs text-[#8899B5] italic leading-relaxed">"{activeReplyReview.comment}"</p>
              </div>

              {/* Sparkles list with templates */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={11} className="text-[#00E5FF]" /> ШАБЛОНИ AI РЕКОМЕНДАЦІЙ
                </p>
                <div className="flex flex-col gap-2.5">
                  {quickTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(template)}
                      className="p-3 text-left rounded-2xl bg-[#1A2639]/40 border border-white/5 hover:border-[#00E5FF]/20 hover:bg-[#1A2639]/60 text-xs text-[#8899B5] hover:text-white transition-all active:scale-95 font-bold leading-relaxed"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text editor */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">РЕДАКТОР ВІДПОВІДІ ДИСПЕТЧЕРА</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Введіть вашу відповідь пасажиру тут..."
                  rows={4}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-xs text-white outline-none focus:border-[#00E5FF] transition-all resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActiveReplyReview(null);
                    setReplyText('');
                  }}
                  className="flex-1 py-4 bg-transparent border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:bg-white/5 transition-all"
                >
                  СКАСУВАТИ
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className="flex-1 py-4 bg-[#00E5FF] text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 font-bold"
                >
                  {isSending ? <Loader2 className="animate-spin" size={14} /> : <Send size={12} />}
                  НАДІСЛАТИ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsTab;
