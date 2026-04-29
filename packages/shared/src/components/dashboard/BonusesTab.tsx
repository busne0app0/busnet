import React from 'react';
import { Gift, Star, Zap, TrendingUp, ArrowRight, History } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface BonusesTabProps {
  tickets: any[];
}

const BonusesTab: React.FC<BonusesTabProps> = ({ tickets }) => {
  const { user } = useAuthStore();
  const loyaltyPoints = user?.loyaltyPoints || 0;
  
  const transactions = React.useMemo(() => {
    const list = [
      { id: 'reg', type: 'earn', amount: 30, date: '10.04.2026', desc: 'Бонус за реєстрацію' },
    ];
    
    tickets.forEach((t, i) => {
      if (t.status === 'completed' || t.status === 'active') {
        list.push({
          id: `earn-${t.id}`,
          type: 'earn',
          amount: Math.floor(t.price * 0.05),
          date: t.date,
          desc: `Нарахування за рейс ${t.route}`
        });
      }
    });

    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [tickets]);

  const equivalentUAH = (loyaltyPoints * 0.1).toFixed(2);
  const nextTierPoints = 2000;
  const progress = Math.min((loyaltyPoints / nextTierPoints) * 100, 100);
  const remainingForGold = nextTierPoints - loyaltyPoints;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Бонусна програма</h2>
        <p className="text-sm text-[#7a9ab5]">Накопичуйте бали та подорожуйте дешевше</p>
      </div>

      {/* Main Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#00c8ff]/20 to-[#0099cc]/10 border border-[#00c8ff]/30 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400 opacity-5 blur-[100px] rounded-full" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00c8ff] mb-2">Ваш баланс</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-6xl font-black text-white italic tracking-tighter">{loyaltyPoints.toLocaleString()}</h3>
                  <p className="text-lg font-bold text-[#00c8ff] mb-2 uppercase">Балів</p>
                </div>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                <Star className="text-[#ffd600] fill-[#ffd600]" size={24} />
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-[#4a6a85] uppercase tracking-widest mb-1">Еквівалент</p>
                <p className="text-xl font-black text-white">~ {equivalentUAH} ₴</p>
              </div>
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-[9px] font-bold text-[#4a6a85] uppercase tracking-widest mb-1">Статус</p>
                <p className="text-xl font-black text-white uppercase italic">{loyaltyPoints > nextTierPoints ? 'Gold' : 'Silver'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h4 className="text-sm font-bold text-white uppercase">Наступний рівень</h4>
            </div>
            <p className="text-xs text-[#7a9ab5] mb-6">До статусу <span className="text-white font-bold italic">GOLD</span> залишилось <span className="text-[#ffd600] font-black italic">{remainingForGold > 0 ? remainingForGold : 0}</span> балів</p>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#ffd600] to-yellow-600 shadow-[0_0_10px_rgba(255,214,0,0.5)]"
              />
            </div>
          </div>
          <button 
            onClick={() => toast.success('Привілеї оновлено!')}
            className="w-full py-4 mt-8 rounded-2xl border border-[#1e3a5f] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white flex items-center justify-center gap-2"
          >
            Всі привілеї <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Rewards & Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 shadow-xl">
           <h3 className="text-[11px] font-black italic uppercase tracking-widest text-[#7a9ab5] mb-6 flex items-center gap-2">
              <Gift size={16} className="text-[#00c8ff]" /> Як використати бали
           </h3>
           <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Знижка на квиток", val: "від 100 балів = 10 ₴", i: "🎫" },
                { title: "Апгрейд місця", val: "від 500 балів", i: "💺" },
                { title: "Додатковий багаж", val: "від 200 балів", i: "🧳" },
                { title: "Обмін квитка", val: "від 300 балів", i: "🔄" }
              ].map((item, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center group hover:border-[#00c8ff]/30 transition-all cursor-pointer">
                   <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.i}</div>
                   <p className="text-[10px] font-bold text-white uppercase italic">{item.title}</p>
                   <p className="text-[9px] text-[#00c8ff] font-black mt-1 uppercase tracking-tighter">{item.val}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-8 shadow-xl">
           <h3 className="text-[11px] font-black italic uppercase tracking-widest text-[#7a9ab5] mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00e676]" /> Привілеї рівнів
           </h3>
           <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-[800px] w-full text-left text-[10px]">
                 <thead>
                    <tr className="text-[#4a6a85] border-b border-[#1e3a5f]">
                       <th className="pb-4 font-black uppercase tracking-widest">Привілей</th>
                       <th className="pb-4 text-center font-black">Silver ✓</th>
                       <th className="pb-4 text-center font-black">Gold</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    <tr>
                       <td className="py-4 text-[#7a9ab5] font-bold">Бали за поїздки</td>
                       <td className="py-4 text-center text-[#00c8ff] font-black">1.5x</td>
                       <td className="py-4 text-center text-white/40 font-black">2x</td>
                    </tr>
                    <tr>
                       <td className="py-4 text-[#7a9ab5] font-bold">Підтримка</td>
                       <td className="py-4 text-center text-[#00c8ff] font-black">✓</td>
                       <td className="py-4 text-center text-white/40 font-black">✓</td>
                    </tr>
                    <tr>
                       <td className="py-4 text-[#7a9ab5] font-bold">Зміна дати</td>
                       <td className="py-4 text-center text-white/20 font-black">—</td>
                       <td className="py-4 text-center text-white/40 font-black">✓</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <History className="text-[#7a9ab5]" size={18} />
             <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">Історія нарахувань</h4>
           </div>
           <button className="text-[9px] font-bold text-[#00c8ff] uppercase hover:underline">Більше</button>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'earn' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {t.type === 'earn' ? '+' : '-'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.desc}</p>
                  <p className="text-[10px] text-[#7a9ab5]">{t.date}</p>
                </div>
              </div>
              <p className={`text-sm font-black italic ${t.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'earn' ? '+' : '-'}{t.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BonusesTab;

