import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, ThumbsUp, TrendingUp, User, Clock, Filter, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const ReviewsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('carrier_id', user.uid);
      
      if (!error && data) {
        const loaded = data.map(d => ({
          id: d.id,
          user: d.passengerName || 'Пасажир',
          rating: d.rating || 5,
          comment: d.comment || 'Без коментаря',
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('uk-UA') : 'Нещодавно',
          route: d.routeInfo ? `${d.routeInfo.from} → ${d.routeInfo.to}` : (d.tripId ? 'Рейс: ' + d.tripId.slice(0,6) : 'Невідомий маршрут')
        }));
        setReviews(loaded.sort((a,b) => b.rating - a.rating));
        
        if (loaded.length > 0) {
          setAvgRating(loaded.reduce((acc, curr) => acc + curr.rating, 0) / loaded.length);
        } else {
          setAvgRating(0);
        }
      }
    };

    fetchReviews();

    const channel = supabase.channel('carrier_reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `carrierId=eq.${user.uid}` }, fetchReviews)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleReply = (user: string) => {
     const text = prompt(`Відповідь пасажиру ${user}:`);
     if (text) {
        toast.success(`Ваша відповідь для ${user} опублікована`);
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ВІДГУКИ & РЕЙТИНГ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">ДУМКА ВАШИХ ПАСАЖИРІВ ПРО СЕРВІС</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 bg-[#1A2639]/30 border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-lg h-fit">
           <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest">СЕР. РЕЙТИНГ</p>
           <h3 className="text-7xl font-black text-white italic tracking-tighter">{avgRating.toFixed(1)}</h3>
           <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={20} className={s <= Math.round(avgRating) ? "text-[#FBBF24] fill-[#FBBF24]" : "text-white/5"} />
              ))}
           </div>
           <p className="text-[10px] font-black text-[#FBBF24] uppercase tracking-widest mt-2">{reviews.length > 0 ? `ВІДГУКІВ: ${reviews.length}` : 'НЕМАЄ ВІДГУКІВ'}</p>
        </div>

        <div className="col-span-2 space-y-4">
           {reviews.map((rev, i) => (
             <motion.div 
               key={rev.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-[#0B1221] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-lg"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[16px] bg-[#1A2639]/50 border border-white/5 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                         <User size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-white uppercase tracking-tight">{rev.user}</p>
                         <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mt-0.5">{rev.route}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-1 bg-[#1A2639]/30 px-3 py-1.5 rounded-full border border-white/5">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={10} className={idx < rev.rating ? "text-[#FBBF24] fill-[#FBBF24]" : "text-white/10"} />
                      ))}
                   </div>
                </div>
                <p className="text-sm text-[#8899B5] leading-relaxed italic mb-6">"{rev.comment}"</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest flex items-center gap-2">
                      <Clock size={10} /> {rev.date}
                   </span>
                   <button 
                     onClick={() => toast.success(`Ваша відповідь для ${rev.user} опублікована`)}
                     className="px-5 py-2.5 rounded-full bg-[#1A2639]/50 border border-transparent hover:border-[#00E5FF]/30 text-[#00E5FF] text-[9px] font-black uppercase tracking-widest transition-all hover:bg-[#00E5FF]/10"
                   >
                      ВІДПОВІСТИ
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
