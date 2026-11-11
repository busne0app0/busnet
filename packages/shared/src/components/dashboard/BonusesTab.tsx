import React, { useRef } from 'react';
import { Gift, Star, Zap, TrendingUp, ArrowRight, History, Check, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface BonusesTabProps {
  tickets: any[];
}

const BonusesTab: React.FC<BonusesTabProps> = ({ tickets }) => {
  const { user } = useAuthStore();
  const { language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();
  const perksRef = useRef<HTMLDivElement>(null);

  const loyaltyPoints = user?.loyaltyPoints || 0;
  const nextTierPoints = 2000;
  const isGold = loyaltyPoints >= nextTierPoints;
  const progress = Math.min((loyaltyPoints / nextTierPoints) * 100, 100);
  const remainingForGold = Math.max(nextTierPoints - loyaltyPoints, 0);

  // Словник локалізації
  const l = {
    title: currentLang === 'EN' ? 'Bonus Program' : currentLang === 'IT' ? 'Programma Fedeltà' : 'Бонусна програма',
    subtitle: currentLang === 'EN'
      ? 'Earn points and travel with smart discounts'
      : currentLang === 'IT'
        ? 'Accumula punti e viaggia a prezzi scontati'
        : 'Накопичуйте бали та подорожуйте дешевше',
    balanceLabel: currentLang === 'EN' ? 'Your Balance' : currentLang === 'IT' ? 'Il Tuo Saldo' : 'Ваш баланс',
    points: currentLang === 'EN' ? 'Points' : currentLang === 'IT' ? 'Punti' : 'Балів',
    equivLabel: currentLang === 'EN' ? 'Discount Value' : currentLang === 'IT' ? 'Valore Sconto' : 'Еквівалент',
    statusLabel: currentLang === 'EN' ? 'Status' : currentLang === 'IT' ? 'Stato' : 'Статус',
    nextLevel: currentLang === 'EN' ? 'Next Tier' : currentLang === 'IT' ? 'Prossimo Livello' : 'Наступний рівень',
    toGoldRemaining: (pts: number) =>
      currentLang === 'EN'
        ? `${pts} points left to GOLD status`
        : currentLang === 'IT'
          ? `Mancano ${pts} punti allo status GOLD`
          : `До статусу GOLD залишилось ${pts} балів`,
    maxLevelReached: currentLang === 'EN' ? 'Maximum tier achieved!' : currentLang === 'IT' ? 'Massimo livello raggiunto!' : 'Максимальний статус досягнуто!',
    allPerksBtn: currentLang === 'EN' ? 'View All Perks' : currentLang === 'IT' ? 'Tutti i Vantaggi' : 'Всі привілеї',
    howToUseTitle: currentLang === 'EN' ? 'How to Spend Points' : currentLang === 'IT' ? 'Come Usare i Punti' : 'Як використати бали',
    tierPerksTitle: currentLang === 'EN' ? 'Tier Benefits' : currentLang === 'IT' ? 'Vantaggi dei Livelli' : 'Привілеї рівнів',
    perkCol: currentLang === 'EN' ? 'Benefit' : currentLang === 'IT' ? 'Vantaggio' : 'Привілей',
    historyTitle: currentLang === 'EN' ? 'Points History' : currentLang === 'IT' ? 'Cronologia Punti' : 'Історія нарахувань',
    regBonusDesc: currentLang === 'EN' ? 'Welcome registration bonus' : currentLang === 'IT' ? 'Bonus di benvenuto registrazione' : 'Бонус за реєстрацію',
    tripBonusDesc: (route: string) =>
      currentLang === 'EN' ? `Reward for trip ${route}` : currentLang === 'IT' ? `Punti per il viaggio ${route}` : `Нарахування за рейс ${route}`,
    perkHint: currentLang === 'EN'
      ? 'You can apply your points on the booking checkout step!'
      : currentLang === 'IT'
        ? 'Puoi applicare i tuoi punti al momento della prenotazione!'
        : 'Ви можете списати бонуси на кроці підтвердження бронювання!',
    perks: [
      {
        title: currentLang === 'EN' ? 'Ticket Discount' : currentLang === 'IT' ? 'Sconto Biglietto' : 'Знижка на квиток',
        val: currentLang === 'EN' ? 'From 100 pts' : currentLang === 'IT' ? 'Da 100 punti' : 'від 100 балів',
        icon: '🎫'
      },
      {
        title: currentLang === 'EN' ? 'Seat Upgrade' : currentLang === 'IT' ? 'Upgrade Posto' : 'Апгрейд місця',
        val: currentLang === 'EN' ? 'From 500 pts' : currentLang === 'IT' ? 'Da 500 punti' : 'від 500 балів',
        icon: '💺'
      },
      {
        title: currentLang === 'EN' ? 'Extra Luggage' : currentLang === 'IT' ? 'Bagaglio Extra' : 'Додатковий багаж',
        val: currentLang === 'EN' ? 'From 200 pts' : currentLang === 'IT' ? 'Da 200 punti' : 'від 200 балів',
        icon: '🧳'
      },
      {
        title: currentLang === 'EN' ? 'Flexible Change' : currentLang === 'IT' ? 'Cambio Flessibile' : 'Обмін квитка',
        val: currentLang === 'EN' ? 'From 300 pts' : currentLang === 'IT' ? 'Da 300 punti' : 'від 300 балів',
        icon: '🔄'
      }
    ],
    tableRows: [
      {
        name: currentLang === 'EN' ? 'Points per trip' : currentLang === 'IT' ? 'Punti per viaggio' : 'Бали за поїздки',
        silver: '1.5x',
        gold: '2x'
      },
      {
        name: currentLang === 'EN' ? 'Priority 24/7 support' : currentLang === 'IT' ? 'Supporto prioritario' : 'Пріоритетна підтримка',
        silver: true,
        gold: true
      },
      {
        name: currentLang === 'EN' ? 'Free date reschedule' : currentLang === 'IT' ? 'Cambio data gratuito' : 'Безкоштовна зміна дати',
        silver: false,
        gold: true
      }
    ]
  };

  const transactions = React.useMemo(() => {
    const list: Array<{ id: string; type: string; amount: number; date: string; desc: string }> = [
      { id: 'reg', type: 'earn', amount: 30, date: '10.04.2026', desc: l.regBonusDesc },
    ];

    tickets.forEach((t) => {
      if (t.status === 'completed' || t.status === 'active') {
        list.push({
          id: `earn-${t.id}`,
          type: 'earn',
          amount: Math.max(Math.floor(t.price * 0.05), 5),
          date: t.date,
          desc: l.tripBonusDesc(t.route)
        });
      }
    });

    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [tickets, l]);

  const equivalentFormatted = currentLang === 'UK'
    ? `~ ${(loyaltyPoints * 1).toFixed(0)} ₴`
    : `~ €${(loyaltyPoints * 0.025).toFixed(2)}`;

  const scrollToPerks = () => {
    perksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{l.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{l.subtitle}</p>
      </div>

      {/* Main Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Баланс балів */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">{l.balanceLabel}</p>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-5xl sm:text-6xl font-black text-white tracking-tight">{loyaltyPoints.toLocaleString()}</h3>
                  <p className="text-base sm:text-lg font-extrabold text-cyan-400 uppercase">{l.points}</p>
                </div>
              </div>
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl shadow-lg">
                <Star className="text-amber-400 fill-amber-400" size={26} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{l.equivLabel}</p>
                <p className="text-lg sm:text-xl font-black text-white">{equivalentFormatted}</p>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{l.statusLabel}</p>
                <p className={`text-lg sm:text-xl font-black uppercase tracking-wider ${isGold ? 'text-amber-400' : 'text-cyan-300'}`}>
                  {isGold ? 'Gold' : 'Silver'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Прогрес до Gold */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <TrendingUp size={20} />
              </div>
              <h4 className="text-sm font-bold text-white uppercase">{l.nextLevel}</h4>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              {remainingForGold > 0 ? (
                <>
                  {l.toGoldRemaining(remainingForGold)}
                </>
              ) : (
                <span className="text-emerald-400 font-bold">{l.maxLevelReached}</span>
              )}
            </p>

            {/* Прогрес бар */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.6)]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToPerks}
            className="w-full py-3.5 mt-6 rounded-xl border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {l.allPerksBtn} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Rewards & Perks Grid */}
      <div ref={perksRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

        {/* Як використати бали */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-5 flex items-center gap-2">
            <Gift size={18} className="text-cyan-400" /> {l.howToUseTitle}
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {l.perks.map((item, i) => (
              <div
                key={i}
                onClick={() => toast(l.perkHint, { icon: '💡' })}
                className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center group hover:border-cyan-500/40 hover:bg-slate-950 transition-all cursor-pointer active:scale-95"
              >
                <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{item.icon}</div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">{item.title}</p>
                <p className="text-[10px] text-cyan-400 font-extrabold mt-1 tracking-tight">{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Таблиця привілеїв рівнів (адаптивна без зламаного 800px скролу) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" /> {l.tierPerksTitle}
            </h3>

            <div className="w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-2">
                    <th className="pb-3 font-bold uppercase tracking-wider">{l.perkCol}</th>
                    <th className="pb-3 text-center font-black text-cyan-300">Silver</th>
                    <th className="pb-3 text-center font-black text-amber-400">Gold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {l.tableRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-slate-300 font-medium">{row.name}</td>
                      <td className="py-3 text-center text-cyan-300 font-bold">
                        {typeof row.silver === 'boolean' ? (
                          row.silver ? <Check size={16} className="inline text-cyan-400" /> : <Minus size={16} className="inline text-slate-600" />
                        ) : (
                          row.silver
                        )}
                      </td>
                      <td className="py-3 text-center text-amber-400 font-black">
                        {typeof row.gold === 'boolean' ? (
                          row.gold ? <Check size={16} className="inline text-amber-400" /> : <Minus size={16} className="inline text-slate-600" />
                        ) : (
                          row.gold
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="text-slate-400" size={18} />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">{l.historyTitle}</h4>
          </div>
          <span className="text-xs font-mono text-cyan-400">{transactions.length}</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {transactions.map((t) => (
            <div key={t.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-sm">
                  +
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">{t.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t.date}</p>
                </div>
              </div>
              <p className="text-sm font-black text-emerald-400 tracking-tight">
                +{t.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BonusesTab;