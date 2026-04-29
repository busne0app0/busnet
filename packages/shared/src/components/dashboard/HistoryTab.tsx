import React from 'react';
import { motion } from 'framer-motion';
import { History, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryTabProps {
  tickets: any[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ tickets }) => {
  const history = tickets.filter(t => t.status !== 'active');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Історія поїздок</h2>
        <p className="text-sm text-[#7a9ab5]">Ваші завершені та скасовані поїздки</p>
      </div>

      <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[32px] overflow-hidden">
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-[#151e2e]/50 border-b border-[#1c2e48]">
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Маршрут</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Дата</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#3d5670] uppercase tracking-[0.2em]">Ціна</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2e48]/50">
                {history.map((h, i) => (
                  <tr key={h.id} className="group hover:bg-white/[0.02]">
                    <td className="py-4 px-6 font-bold text-white text-xs italic">{h.route}</td>
                    <td className="py-4 px-6 text-[10px] text-[#ddeeff] tracking-widest">{h.date}</td>
                    <td className="py-4 px-6">
                       <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${h.status === 'completed' ? 'text-[#00e676]' : 'text-rose-500'}`}>
                          {h.status === 'completed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {h.status === 'completed' ? 'Завершено' : 'Скасовано'}
                       </div>
                    </td>
                    <td className="py-4 px-6 text-xs font-mono text-[#00c8ff]">{h.price} ₴</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center opacity-50 flex flex-col items-center gap-4">
             <History size={48} strokeWidth={1} />
             <p className="font-bold text-[#7a9ab5]">Історія поки порожня</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;

