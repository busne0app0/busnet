import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';

const ConflictsTab: React.FC = () => {
  const { conflicts, resolveConflict, addLog, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const onResolve = (id: string, status: 'resolved' | 'ignored') => {
    resolveConflict(id, status);
    addLog({
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: 'Admin',
      role: 'owner',
      action: status === 'resolved' ? 'RESOLVE' : 'IGNORE',
      obj: `Конфлікт ${id} → ${status}`,
      icon: status === 'resolved' ? '✅' : '👁️'
    });
  };

  const activeConflicts = conflicts.filter(c => c.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-[#ff9800] rounded-full shadow-[0_0_10px_#ff9800]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-sans">AI Конфлікти</h2>
          </div>
          <p className="text-[#7a9ab5] text-sm font-medium tracking-wide ml-5">
            {activeConflicts.length} аномалій виявлено AI-модулем
          </p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="p-2.5 bg-[#151e2e] border border-[#1c2e48] rounded-xl text-[#00c8ff] hover:bg-[#00c8ff] hover:text-black transition-all group"
        >
          <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeConflicts.length === 0 ? (
          <div className="bg-[#0f1520] border border-[#1c2e48] rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[#00e676]/10 rounded-full flex items-center justify-center text-[#00e676] mb-6">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-xl font-black text-white uppercase italic">Система в безпеці</h3>
            <p className="text-[#7a9ab5] text-sm mt-2">Жодних конфліктів або аномалій не виявлено.</p>
          </div>
        ) : (
          activeConflicts.map((conf, i) => (
            <motion.div
              key={conf.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-[#0f1520] border ${conf.priority === 'high' ? 'border-rose-500/30' : 'border-[#1c2e48]'} rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between group hover:shadow-2xl transition-all relative overflow-hidden`}
            >
              {conf.priority === 'high' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,67,54,0.5)]" />
              )}

              <div className="flex items-center gap-6 flex-1">
                <div className={`w-14 h-14 rounded-2xl ${conf.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-[#ff9800]/10 text-[#ff9800]'} border border-current opacity-70 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${conf.priority === 'high' ? 'bg-rose-500 text-white' : 'bg-[#ff9800] text-black'}`}>
                      {conf.priority === 'high' ? 'Критично' : 'Середній'}
                    </p>
                    <span className="text-[10px] font-black text-[#3d5670] uppercase tracking-widest">{conf.type}</span>
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed">{conf.description}</p>
                  <p className="text-[9px] font-bold text-[#3d5670] uppercase mt-2 italic">ID: {conf.id}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 md:mt-0">
                <button
                  onClick={() => onResolve(conf.id, 'ignored')}
                  className="w-10 h-10 rounded-xl border border-[#1c2e48] bg-[#151e2e] text-[#7a9ab5] hover:text-white hover:border-white/20 transition-all flex items-center justify-center group"
                  title="Ігнорувати"
                >
                  <EyeOff size={18} />
                </button>
                <button
                  onClick={() => onResolve(conf.id, 'resolved')}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#00e676] hover:text-black hover:border-[#00e676] transition-all flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Вирішено
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConflictsTab;