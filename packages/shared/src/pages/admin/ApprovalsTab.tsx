import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Bus, MapPin, Tag, Loader2, Navigation2, Calendar } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { RouteTemplate, RouteStatus } from '../../busnet/types';
import { busnetService } from '../../services/busnetService';
import { toast } from 'react-hot-toast';

const ApprovalsTab: React.FC = () => {
  const [templates, setTemplates] = useState<RouteTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('routes')
          .select('*');
        
        if (!error && data) {
          setTemplates(data as any[]);
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();

    const channel = supabase.channel(`routes_approvals_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, fetchTemplates)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onHandle = async (template: RouteTemplate, status: RouteStatus) => {
    setProcessing(template.id || null);
    try {
      const { error } = await supabase
        .from('routes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', template.id);
      
      if (error) throw error;
      
      if (status === RouteStatus.APPROVED) {
        toast.promise(
          busnetService.generateTripsFromTemplate(template),
          {
            loading: 'Генерація рейсів на 30 днів...',
            success: 'Маршрут схвалено та рейси створено!',
            error: 'Помилка при генерації рейсів',
          }
        );
      } else {
        toast.success(`Статус змінено на ${status}`);
      }
    } catch (error) {
      toast.error('Помилка при оновленні статусу');
    } finally {
      setProcessing(null);
    }
  };

  const pendingTemplates = templates.filter(a => a.status === RouteStatus.PENDING);
  const processedTemplates = templates.filter(a => a.status !== RouteStatus.PENDING);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_#00fbff]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">Модерація маршрутів</h2>
          </div>
          <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">
            {pendingTemplates.length} нових шаблонів очікують на перевірку
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 size={48} className="animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-[#7a9ab5] text-xs font-black uppercase tracking-widest">Завантаження шаблонів...</p>
          </div>
        ) : pendingTemplates.length === 0 ? (
          <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Вся черга розібрана!</h3>
            <p className="text-[#7a9ab5] text-sm mt-2">Немає нових маршрутів для модерації.</p>
          </div>
        ) : (
          pendingTemplates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0f1520] border border-[#1c2e48] rounded-[40px] p-6 flex flex-col md:flex-row items-center justify-between group hover:border-cyan-500/30 transition-all shadow-xl shadow-black/40"
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-[#070912] border border-[#1c2e48] flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Navigation2 size={28} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#3d5670] mb-1 tracking-widest">Шаблон</p>
                    <p className="text-sm font-bold text-white tracking-tight">{tpl.name}</p>
                    <p className="text-[9px] font-bold text-cyan-500 uppercase mt-1 italic tracking-widest">ID: {tpl.id?.substring(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#3d5670] mb-1 tracking-widest">Маршрут</p>
                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="text-cyan-400" />
                       <p className="text-sm font-bold text-white tracking-tight">
                         {tpl.stopsThere[0]?.city} → {tpl.stopsThere[tpl.stopsThere.length - 1]?.city}
                       </p>
                    </div>
                    <p className="text-[10px] font-bold text-[#7a9ab5] uppercase mt-1 italic flex items-center gap-1">
                      <Clock size={10} /> {tpl.stopsThere[0]?.time} · {tpl.stopsThere.length} зупинок
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#3d5670] mb-1 tracking-widest">Графік</p>
                    <div className="flex gap-1">
                       {[0,1,2,3,4,5,6].map(d => (
                         <div key={d} className={`w-5 h-5 rounded flex items-center justify-center text-[7px] font-bold ${
                           tpl.activeDays.includes(d) ? 'bg-cyan-500 text-black' : 'bg-white/5 text-[#3d5670]'
                         }`}>
                           {['Н','П','В','С','Ч','П','С'][d]}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 md:mt-0">
                <button
                  onClick={() => onHandle(tpl, RouteStatus.BLOCKED)}
                  disabled={processing === tpl.id}
                  className="px-6 py-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={14} /> Блокувати
                </button>
                <button
                  onClick={() => onHandle(tpl, RouteStatus.APPROVED)}
                  disabled={processing === tpl.id}
                  className="px-8 py-3 rounded-2xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 shadow-[0_5px_20px_rgba(0,251,255,0.2)] disabled:opacity-50"
                >
                  {processing === tpl.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} 
                  Схвалити
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {processedTemplates.length > 0 && (
        <div className="mt-12 space-y-4">
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3d5670] italic px-5">Архів рішень</h3>
           <div className="bg-[#0f1520]/50 border border-[#1c2e48] rounded-[40px] overflow-hidden backdrop-blur-xl">
              <table className="min-w-[800px] w-full text-left">
                 <thead className="bg-[#151e2e]/50 border-b border-[#1c2e48]">
                    <tr>
                       <th className="py-4 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">ID</th>
                       <th className="py-4 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Маршрут</th>
                       <th className="py-4 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest">Статус</th>
                       <th className="py-4 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-widest text-right">Дія</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#1c2e48]/50">
                    {processedTemplates.map(tpl => (
                       <tr key={tpl.id} className="text-xs group hover:bg-white/5 transition-colors">
                          <td className="py-4 px-8 font-bold text-[#7a9ab5]">{tpl.id?.substring(0, 8)}</td>
                          <td className="py-4 px-8">
                             <div className="font-bold text-white uppercase italic">{tpl.name}</div>
                             <div className="text-[9px] text-[#5a6a85] mt-0.5">{tpl.stopsThere[0]?.city} → {tpl.stopsThere[tpl.stopsThere.length - 1]?.city}</div>
                          </td>
                          <td className="py-4 px-8">
                             <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                               tpl.status === RouteStatus.APPROVED 
                               ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                               : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                             }`}>
                                {tpl.status === RouteStatus.APPROVED ? '✓ Схвалено' : '✕ Блоковано'}
                             </span>
                          </td>
                          <td className="py-4 px-8 text-right">
                             <button 
                               onClick={() => onHandle(tpl, RouteStatus.PENDING)}
                               className="text-cyan-400 hover:text-white transition-colors uppercase font-black text-[9px] tracking-widest"
                             >
                                Переглянути
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTab;

