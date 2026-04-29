/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Download, ExternalLink, 
  TrendingUp, History, CreditCard,
  Building2, ArrowUpRight, ArrowDownRight,
  ChevronRight, X, DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BOOKINGS_DATA } from './constants';

export default function Finance() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('04-2026');

  const totalRevenue = BOOKINGS_DATA.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0);
  const totalComm = BOOKINGS_DATA.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const ownComm = BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const busnetComm = BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').reduce((sum, b) => sum + b.comm, 0);
  const ownCount = BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').length;
  const busnetCount = BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').length;
  const ownRevenue = BOOKINGS_DATA.filter(b => b.type === 'own' && b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0);
  const busnetRevenue = BOOKINGS_DATA.filter(b => b.type === 'busnet' && b.status !== 'cancelled').reduce((sum, b) => sum + b.price, 0);

  const [withdrawAmount, setWithdrawAmount] = useState(totalComm.toFixed(2));

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Введіть коректну суму');
      return;
    }
    if (amount > totalComm) {
      toast.error('Сума перевищує доступний баланс');
      return;
    }
    toast.loading('Запит обробляється адміністратором...', { duration: 2000 });
    setTimeout(() => {
      toast.success('Запит на виплату надіслано успішно!');
      setShowWithdrawModal(false);
    }, 1000);
  };

  const STATS = [
    { label: 'Валовий дохід (квіт)', val: `€${totalRevenue.toFixed(0)}`, sub: `${BOOKINGS_DATA.filter(b => b.status !== 'cancelled').length} квитків загалом`, type: 'purple' },
    { label: 'Комісія BUSNET (5%)', val: `€${busnetComm.toFixed(2)}`, sub: `${busnetCount} квитки · BUSNET UA`, type: 'green' },
    { label: 'Комісія власна (10%)', val: `€${ownComm.toFixed(2)}`, sub: `${ownCount} квитки · власні клієнти`, type: 'cyan' },
    { label: 'До виплати 01.05', val: `€${totalComm.toFixed(2)}`, sub: '▲ +18% до березня', type: 'gold', delta: true },
  ];

  return (
    <div className="space-y-8 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0d1119] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-['Syne'] font-black text-sm uppercase italic tracking-tight">Запит на виплату</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#4a5c72]"><X size={18} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-xs text-[#7a8fa8] font-bold uppercase tracking-widest">Доступно до виводу</span>
                  <span className="font-['Syne'] text-xl font-black text-[#00d97e] italic tracking-tighter">€{totalComm.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Сума виплати (€)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00d97e]" size={16} />
                    <input 
                      type="number" 
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-[#121824] border border-white/5 rounded-xl py-4 pl-12 pr-6 text-lg font-black text-white outline-none focus:border-[#7c5cfc]" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-widest ml-1">Метод отримання</label>
                  <div className="flex items-center gap-4 p-4 bg-[#121824] border border-[#7c5cfc33] rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-[#7c5cfc1a] flex items-center justify-center text-[#a28afd] border border-[#7c5cfc22]"><Building2 size={20} /></div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white uppercase italic tracking-tighter">MonoBank UA</div>
                      <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest mt-0.5">**** 4412 · Марія Ковалець</div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-[#7a8fa8] hover:text-white">Скасувати</button>
                    <button 
                      onClick={handleWithdraw}
                      className="flex-[2] py-3 bg-[#00d97e] text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                    >
                      Вивести кошти
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Доходи та виплати
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Фінансова звітність агента
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-[#121824] border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] appearance-none cursor-pointer"
          >
            <option value="04-2026">Квітень 2026</option>
            <option value="03-2026">Березень 2026</option>
            <option value="02-2026">Лютий 2026</option>
          </select>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2 bg-[#00d97e] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Вивести кошти
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#151c28] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg"
          >
            <div className={`absolute top-0 left-0 w-full h-[2px] 
              ${stat.type === 'purple' ? 'bg-[#7c5cfc]' : ''}
              ${stat.type === 'green' ? 'bg-[#00d97e]' : ''}
              ${stat.type === 'cyan' ? 'bg-[#00c4d4]' : ''}
              ${stat.type === 'gold' ? 'bg-[#f5c842]' : ''}
            `} />
            <div className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="font-['Syne'] text-2xl font-black text-white italic tracking-tighter leading-none mb-2">{stat.val}</div>
            <div className="text-[10px] font-bold text-[#455a75]">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Commission Breakdown */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-8 overflow-hidden group">
        <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-wider text-[#a28afd] mb-6">Розбивка комісій за квітень 2026</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#7c5cfc22] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#7c5cfc1a] border border-[#7c5cfc33] flex items-center justify-center text-[#a28afd] font-black text-[10px] uppercase">10%</div>
              <div>
                <div className="text-xs font-bold text-white uppercase italic tracking-tighter">Власні пасажири</div>
                <div className="text-[10px] text-[#4a5c72] font-black uppercase mt-1">{ownCount} квитки · €{ownRevenue.toFixed(0)} валовий</div>
              </div>
            </div>
            <div className="text-lg font-['Syne'] font-black text-[#a28afd] italic tracking-tighter">+€{ownComm.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#00c4d422] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00c4d41a] border border-[#00c4d433] flex items-center justify-center text-[#00c4d4] font-black text-[10px] uppercase">5%</div>
              <div>
                <div className="text-xs font-bold text-white uppercase italic tracking-tighter">Пасажири BUSNET</div>
                <div className="text-[10px] text-[#4a5c72] font-black uppercase mt-1">{busnetCount} квитки · €{busnetRevenue.toFixed(0)} валовий</div>
              </div>
            </div>
            <div className="text-lg font-['Syne'] font-black text-[#00c4d4] italic tracking-tighter">+€{busnetComm.toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="text-sm font-bold text-white uppercase tracking-widest italic opacity-50">Разом нараховано</div>
          <div className="font-['Syne'] text-3xl font-black text-[#00d97e] italic tracking-tighter">€{totalComm.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Chart Overlay */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm tracking-tight">Динаміка комісій по тижнях</h3>
          </div>
          <div className="p-8">
            <div className="h-[130px] flex items-end gap-10 px-6">
              {[240, 310, 380, 344].map((v, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(v/380)*100}%` }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#7c5cfc] to-[#a28afd] opacity-80 group-hover:opacity-100 transition-all shadow-lg"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">€{v}</div>
                  <div className="text-[9px] font-black text-[#4a5c72] uppercase text-center mt-4 tracking-widest italic">Тиж {i+1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payout Schedule */}
        <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="font-['Syne'] font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <History size={16} className="text-[#a28afd]" /> Графік виплат
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { m: 'Лютий 2026', val: '€987.50', s: 'Виплачено', st: 'green' },
              { m: 'Березень 2026', val: '€1,076.00', s: 'Виплачено', st: 'green' },
              { m: 'Квітень 2026', val: '€1,274.50', s: 'Формується', st: 'orange' },
            ].map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <div className="text-[11px] font-bold text-white uppercase tracking-tighter italic">{p.m}</div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-black text-white">{p.val}</div>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${p.st === 'green' ? 'bg-[#00d97e1a] text-[#00d97e] border-[#00d97e33]' : 'bg-[#ff9d001a] text-[#ff9d00] border-[#ff9d0033]'}`}>
                    {p.s}
                  </span>
                </div>
              </div>
            ))}
            <div className="h-px bg-white/5 my-4" />
            <div className="flex justify-between items-center px-2">
              <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">IBAN для виплат</div>
              <div className="text-xs font-bold text-white tracking-widest italic">UA12****7890</div>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">Наступна виплата</div>
              <div className="text-sm font-black text-[#a28afd] tracking-tighter">01.05.2026</div>
            </div>
            <button className="w-full mt-4 py-3 bg-[#7c5cfc]/10 border border-[#7c5cfc33] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#a28afd] hover:bg-[#7c5cfc]/20 transition-all flex items-center justify-center gap-2">
              Змінити реквізити <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h3 className="font-['Syne'] font-bold text-sm tracking-tight text-white flex items-center gap-2">
            Транзакції (квітень 2026)
          </h3>
          <button className="text-[10px] text-[#4a5c72] hover:text-white uppercase font-black transition-all flex items-center gap-2">
            <Download size={14} /> CSV
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[800px] w-full text-left border-collapse">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Дата</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Квиток</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Пасажир</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Маршрут</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Сума</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5">Тип</th>
                <th className="px-6 py-4 text-[9px] font-black text-[#4a5c72] uppercase tracking-widest border-b border-white/5 text-right">Комісія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {BOOKINGS_DATA.slice(0, 6).map((b, i) => (
                <tr key={i} className="group hover:bg-white/[0.015] transition-all">
                  <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-bold">{b.date}.04</td>
                  <td className="px-6 py-4">
                    <span className="font-['Syne'] font-black text-[#a28afd] text-xs tracking-tight">{b.id}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-white">{b.pax}</td>
                  <td className="px-6 py-4 text-[11px] text-[#7a8fa8] font-medium italic">{b.route}</td>
                  <td className="px-6 py-4 font-black text-white text-xs">€{b.price}</td>
                  <td className="px-6 py-4 font-black text-[9px] text-[#4a5c72] uppercase tracking-widest">{b.type}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-['Syne'] font-black text-[#00d97e] text-sm tracking-tighter italic">+€{b.comm.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

