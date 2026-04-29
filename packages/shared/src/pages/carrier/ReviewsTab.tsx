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
        .eq('carrierId', user.uid);
      
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#ffd600] rounded-full shadow-[0_0_10px_rgba(255,214,0,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Відгуки & Рейтинг</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Думка ваших пасажирів про сервіс</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 bg-[#111520] border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-4">
           <p className="text-[10px] font-black uppercase text-[#5a6a85] tracking-widest">Сер. Рейтинг</p>
           <h3 className="text-7xl font-black text-white italic tracking-tighter">{avgRating.toFixed(1)}</h3>
           <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={20} className={s <= Math.round(avgRating) ? "text-[#ffd600] fill-[#ffd600]" : "text-white/10"} />
              ))}
           </div>
           <p className="text-xs font-bold text-[#ffd600] uppercase tracking-widest">{reviews.length > 0 ? `Відгуків: ${reviews.length}` : 'Немає відгуків'}</p>
        </div>

        <div className="col-span-2 space-y-4">
           {reviews.map((rev, i) => (
             <motion.div 
               key={rev.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="bg-[#111520] border border-white/5 rounded-3xl p-6 relative overflow-hidden group"
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/50">
                         <User size={20} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-white">{rev.user}</p>
                         <p className="text-[10px] text-[#5a6a85] font-black uppercase tracking-widest">{rev.route}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={12} className={idx < rev.rating ? "text-[#ffd600] fill-[#ffd600]" : "text-white/10"} />
                      ))}
                   </div>
                </div>
                <p className="text-sm text-[#8899b5] leading-relaxed italic">"{rev.comment}"</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[9px] font-black text-[#3d5670] uppercase tracking-widest flex items-center gap-2">
                      <Clock size={10} /> {rev.date}
                   </span>
                   <button 
                     onClick={() => toast.success(`Ваша відповідь для ${rev.user} опублікована`)}
                     className="text-[9px] font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors"
                   >
                      Відповісти
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
