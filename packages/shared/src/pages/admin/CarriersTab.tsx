import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreVertical, Star, Bus, AlertCircle, TrendingUp, Mail, Trash2, Loader2, ShieldCheck, Zap, Globe, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { exportToCSV } from '@busnet/shared/utils/exportToCSV';

import { useAdminStore } from '@busnet/shared/store/useAdminStore';

interface CarrierUser {
  uid: string;
  email: string;
  companyName?: string;
  role: string;
  status?: string;
}

const CarriersTab: React.FC = () => {
  const [carriers, setCarriers] = useState<CarrierUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'email', direction: 'asc' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    const fetchCarriers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'carrier');
        if (!error && data) setCarriers(data);
      } catch (err) {
        console.error('Error fetching carriers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCarriers();
    const channel = supabase.channel(`carriers_list_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'role=eq.carrier' }, fetchCarriers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleStatusChange = async (uid: string) => {
    try {
      const carrier = carriers.find(c => c.uid === uid);
      const nextStatus: Record<string, string> = { 'active': 'review', 'review': 'blocked', 'blocked': 'active' };
      const current = carrier?.status || 'active';
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus[current] })
        .eq('uid', uid);
      if (error) throw error;
    } catch (error) {
      alert('Error updating status');
    }
  };

  const filteredCarriers = carriers.filter(c => {
    const searchString = (c.companyName || c.email || '').toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    const actualStatus = c.status || 'active';
    const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCarriers = [...filteredCarriers].sort((a, b) => {
    // For string sorting
    const aVal = String(a[sortConfig.key as keyof CarrierUser] || '');
    const bVal = String(b[sortConfig.key as keyof CarrierUser] || '');
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCarriers.length / rowsPerPage);
  const paginatedCarriers = sortedCarriers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🚀 Partner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#8B5CF6] rounded-full shadow-[0_0_15px_#8B5CF6]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Carrier <span className="text-[#8B5CF6]">Matrix</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Fleet Asset Verification · Active Protocols
           </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => exportToCSV(sortedCarriers, 'carriers_export')}
            className="px-6 py-3 glass-mission-control rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export Matrix
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-[#8B5CF6] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
          >
            + Deploy New Carrier
          </motion.button>
        </div>
      </div>

      {/* 🔍 Advanced Filter Panel */}
      <div className="glass-mission-control p-6 rounded-[2rem] flex flex-wrap gap-4 items-center">
         <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query matrix by name or identifier..." 
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all placeholder:text-slate-600"
            />
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/5 rounded-2xl">
               <Filter size={14} className="text-slate-500" />
               <select 
                 value={statusFilter}
                 onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                 className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer"
               >
                  <option value="all">All States</option>
                  <option value="active">Active</option>
                  <option value="review">Review</option>
                  <option value="blocked">Locked</option>
               </select>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
               <Globe size={14} className="text-[#00D4FF]" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Global Reach</span>
            </div>
         </div>
      </div>

      {/* 🛸 Asset List Matrix */}
      <div className="glass-mission-control rounded-[2.5rem] overflow-hidden">
         <div className="overflow-x-auto no-scrollbar">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 size={40} className="animate-spin text-[#8B5CF6] mx-auto mb-4" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Grid Assets...</p>
              </div>
            ) : (
              <table className="w-full text-left border-separate border-spacing-y-2 px-6 pb-6">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('companyName')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Carrier Identity{getSortIcon('companyName')}</th>
                    <th onClick={() => handleSort('email')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Network Point{getSortIcon('email')}</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Efficiency</th>
                    <th onClick={() => handleSort('status')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Status{getSortIcon('status')}</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCarriers.map((c, idx) => (
                    <motion.tr 
                      key={c.uid}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-2xl border-y border-l border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-black border border-white/5 flex items-center justify-center group-hover:border-[#8B5CF6]/40 transition-all duration-500 relative overflow-hidden">
                               <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                               <Bus size={22} className="text-[#8B5CF6] relative z-10" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-white tracking-tight leading-none group-hover:text-[#00D4FF] transition-colors">{c.companyName || 'Unknown Protocol'}</p>
                               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                 <ShieldCheck size={10} className="text-[#10B981]" /> Verified ID: {c.uid.substring(0, 8)}
                               </p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors flex items-center gap-2">
                           <Mail size={12} className="text-slate-600" /> {c.email}
                         </span>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <div className="flex items-center gap-2">
                            <Star size={14} className="text-[#F59E0B] fill-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-xs font-black text-white">4.8</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <button 
                           onClick={() => handleStatusChange(c.uid)}
                           className={`
                             px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all relative overflow-hidden
                             ${c.status === 'active' || !c.status ? 'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/5' : 
                               c.status === 'review' ? 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5' : 
                               'text-red-500 border-red-500/20 bg-red-500/5'}
                           `}
                         >
                            <span className="relative z-10">
                              {c.status === 'active' || !c.status ? 'Operational' : c.status === 'review' ? 'In Review' : 'Deactivated'}
                            </span>
                            <motion.div 
                              animate={{ opacity: [0.2, 0.5, 0.2] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className={`absolute inset-0 ${
                                c.status === 'active' || !c.status ? 'bg-[#10B981]/10' : 
                                c.status === 'review' ? 'bg-[#F59E0B]/10' : 'bg-red-500/10'
                              }`} 
                            />
                         </button>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-r-2xl border-y border-r border-white/5 text-right">
                         <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                           <button className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-[#00D4FF] transition-all"><TrendingUp size={14}/></button>
                           <button className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-[#00D4FF] transition-all"><Mail size={14}/></button>
                           <button 
                             onClick={() => {
                               if (window.confirm('Ви впевнені, що хочете видалити цей обліковий запис?')) {
                                 useAdminStore.getState().deleteUser(c.uid);
                               }
                             }}
                             className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-red-500 transition-all"
                           >
                             <Trash2 size={14}/>
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
         </div>
         {/* Pagination Controls */}
         {!loading && totalPages > 1 && (
           <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Сторінка {page} з {totalPages} (Всього: {sortedCarriers.length})
             </span>
             <div className="flex gap-2">
               <button 
                 onClick={() => setPage(Math.max(1, page - 1))}
                 disabled={page === 1}
                 className="p-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-30 hover:bg-white/10 transition-all"
               >
                 <ChevronLeft size={16} />
               </button>
               <button 
                 onClick={() => setPage(Math.min(totalPages, page + 1))}
                 disabled={page === totalPages}
                 className="p-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-30 hover:bg-white/10 transition-all"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
           </div>
         )}
      </div>

      {/* 🚀 Performance Analytics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass-mission-control rounded-[2.5rem] p-8 luminous-border">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-10 italic">
               <Zap size={18} className="text-[#F59E0B]" /> Top Assets by Reliability
            </h3>
            <div className="space-y-8">
               {carriers.slice(0, 3).map((c, i) => (
                 <div key={i}>
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{c.companyName || c.email}</span>
                       <span className="text-[10px] font-black text-[#F59E0B] tracking-widest">Efficiency: 96%</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${96 - (i * 5)}%` }}
                         transition={{ duration: 1.5, delay: i * 0.2 }}
                         className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#00D4FF] rounded-full shadow-[0_0_15px_#8B5CF6]" 
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="glass-mission-control rounded-[2.5rem] p-8 flex items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 scale-150 rotate-12 transition-all duration-700">
               <ShieldCheck size={120} className="text-[#10B981]" />
            </div>
            <div className="relative z-10 space-y-5">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-10 bg-[#10B981] rounded-full" />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Trust Protocols</h3>
               </div>
               <p className="text-[11px] text-slate-500 uppercase tracking-widest leading-relaxed max-w-sm font-bold">
                 Verification queue is active. 3 new operators require document synchronization.
               </p>
               <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-[#00D4FF] hover:bg-[#00D4FF] hover:text-black transition-all">
                  Access Queue →
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CarriersTab;
