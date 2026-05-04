import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Download, Calendar, Users, DollarSign, Filter } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';

interface InvoiceMock {
  id: string;
  partnerName: string;
  type: string;
  period: string;
  amount: number;
  status: string;
  date: string;
}

const InvoicesTab: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      let resultsList: InvoiceMock[] = [];

      // 1. Fetch carrier balances
      const { data: balanceData } = await supabase.from('balances').select('*');
      if (balanceData) {
        const carrierInvs = balanceData.map((d, i) => ({
          id: `INV-C-${String(i+1).padStart(3,'0')}`,
          partnerName: d.companyName || d.id.substring(0,8),
          type: 'Виплата Перевізнику',
          period: 'Квітень 2026',
          amount: d.total_debt_to_admin || 0,
          status: 'PENDING',
          date: new Date().toLocaleDateString('uk-UA')
        }));
        resultsList = [...resultsList, ...carrierInvs];
      }

      // 2. Fetch agent balances
      const { data: agentData } = await supabase.from('agent_balances').select('*');
      if (agentData) {
        const agentInvs = agentData.map((d, i) => ({
          id: `INV-A-${String(i+1).padStart(3,'0')}`,
          partnerName: d.agentName || d.id.substring(0,8),
          type: 'Агентська Комісія',
          period: 'Квітень 2026',
          amount: d.unpaidCommissions || 0,
          status: 'PENDING',
          date: new Date().toLocaleDateString('uk-UA')
        }));
        resultsList = [...resultsList, ...agentInvs];
      }

      setInvoices(resultsList);
      setLoading(false);
    };

    fetchData();

    const suffix = Math.random().toString(36).substring(7);
    const channels = [
      supabase.channel(`inv_bal_${suffix}`).on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, fetchData).subscribe(),
      supabase.channel(`inv_agent_${suffix}`).on('postgres_changes', { event: '*', schema: 'public', table: 'agent_balances' }, fetchData).subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  const filtered = invoices.filter(i => 
    i.id.toLowerCase().includes(search.toLowerCase()) || 
    i.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerateReport = () => {
    window.alert("Функція генерації загального звіту буде доступна у наступному релізі.");
  };

  const handleDownloadPdf = (id: string) => {
    window.alert(`Завантаження PDF документа: ${id}`);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 bg-[#ff9800] rounded-full shadow-[0_0_10px_#ff9800]" />
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Інвойси та Звіти</h2>
           </div>
           <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">Реєстр розрахункових документів з партнерами</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          className="px-8 py-3 bg-[#ff9800] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(255,152,0,0.2)]">
          + Згенерувати звіт
        </button>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] p-5 rounded-3xl flex gap-4 overflow-x-auto no-scrollbar shadow-xl">
         <div className="relative min-w-[300px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d5670]" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за номером інвойсу або партнером..." 
              className="w-full bg-[#070912] border border-[#1c2e48] rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#ff9800] outline-none transition-all placeholder:text-[#3d5670]"
            />
         </div>
         <div className="flex gap-2">
            <button className="px-6 rounded-2xl bg-[#151e2e] border border-[#1c2e48] text-[#7a9ab5] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
               <Filter size={14} /> Тип
            </button>
            <button className="px-6 rounded-2xl bg-[#151e2e] border border-[#1c2e48] text-[#7a9ab5] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
               <Calendar size={14} /> Период
            </button>
         </div>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[2.5rem] overflow-hidden shadow-2xl">
         {loading ? (
            <div className="py-20 text-center text-[#ff9800]">Loading...</div>
         ) : (
         <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-[#151e2e]/30 border-b border-[#1c2e48]">
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Документ</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Партнер</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Період</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Сума до виплати</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em] text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2e48]/50">
                {filtered.map((inv, idx) => (
                  <motion.tr 
                    key={inv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-5 px-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${inv.status==='PAID'?'bg-[#00e676]/10 border-[#00e676]/20 text-[#00e676]':'bg-[#ff9800]/10 border-[#ff9800]/20 text-[#ff9800]'} group-hover:scale-110 transition-transform`}>
                             <FileText size={16} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white uppercase italic">{inv.id}</p>
                             <p className="text-[9px] text-[#3d5670] font-black uppercase mt-0.5">{inv.type}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                        <span className="text-xs font-bold text-[#7a9ab5]">{inv.partnerName}</span>
                    </td>
                    <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-[#3d5670]" />
                           <span className="text-xs font-bold text-white">{inv.period}</span>
                        </div>
                    </td>
                    <td className="py-5 px-6">
                        <div className="text-lg font-black tracking-tight text-[#ff9800]">
                            €{inv.amount.toLocaleString()}
                        </div>
                    </td>
                    <td className="py-5 px-6">
                       <span className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border
                         ${inv.status === 'PAID' ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 
                           'bg-[#ff9800]/10 text-[#ff9800] border-[#ff9800]/20'}
                       `}>
                          {inv.status === 'PAID' ? 'ОПЛАЧЕНО' : 'ОЧІКУЄ ОПЛАТИ'}
                       </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                       <button 
                         onClick={() => handleDownloadPdf(inv.id)}
                         className="w-8 h-8 rounded-lg bg-[#151e2e] border border-[#1c2e48] inline-flex items-center justify-center text-[#7a9ab5] hover:text-white transition-all hover:border-[#ff9800]/50 hover:bg-[#ff9800]/10"
                       >
                          <Download size={14} />
                       </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
         </div>
         )}
      </div>
    </div>
  );
};

export default InvoicesTab;

