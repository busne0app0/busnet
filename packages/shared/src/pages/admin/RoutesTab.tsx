import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route as RouteIcon, MapPin, Search, Calendar, Users, Ban, Edit2, CheckCircle, Clock, AlertCircle, ChevronDown, Zap, ShieldCheck, Activity, ArrowRight, Download, ChevronLeft, ChevronRight, Bus } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { toast } from 'react-hot-toast';
import { exportToCSV } from '@busnet/shared/utils/exportToCSV';

interface TripItem {
  id: string;
  from: string;
  to: string;
  date: string;
  departureTime: string;
  price: number;
  seats: number;
  bookedSeats: number;
  carrierName: string;
  status: string;
  stops?: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Operational', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  pending_approval: { label: 'Awaiting Auth', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  pending: { label: 'Queued', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  completed: { label: 'Archived', color: 'text-[#00D4FF]', bg: 'bg-[#00D4FF]/10', border: 'border-[#00D4FF]/20' },
  cancelled: { label: 'Terminated', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const RoutesTab: React.FC = () => {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof TripItem, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  const { addLog } = useAdminStore();

  useEffect(() => {
    let isMounted = true;
    const fetchTrips = async () => {
      try {
        const { data, error } = await supabase.from('trips').select('*');
        if (!error && data && isMounted) {
          setTrips(data.map(d => ({
            id: d.id,
            from: d.departure_city || d.departureCity || 'Node_A',
            to: d.arrival_city || d.arrivalCity || 'Node_B',
            date: d.departure_date || 'N/A',
            departureTime: d.departure_time || '',
            price: d.price || 0,
            seats: d.totalSeats || 50,
            bookedSeats: d.bookedSeats || 0,
            carrierId: d.carrierId || '',
            carrierName: d.carrierName || 'Unknown_Entity',
            status: d.status || 'active',
            stops: d.stops || [],
          })));
        }
      } catch (err) {
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTrips();
    const channel = supabase.channel(`admin_trips_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        if (isMounted) fetchTrips();
      })
      .subscribe();
    return () => { 
      isMounted = false;
      supabase.removeChannel(channel); 
    };
  }, []);

  const handleApprove = async (id: string, carrierName: string, route: string) => {
    setApprovingId(id);
    const toastId = toast.loading('Synchronizing Linkage...');
    try {
      const { error } = await supabase.from('trips').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      addLog({ id: Date.now().toString(), time: new Date().toLocaleTimeString(), actor: 'Root', role: 'owner', action: 'APPROVE', obj: `Link ${route} established for ${carrierName}`, icon: '⚡' });
      toast.success('Link Established!', { id: toastId });
    } catch (e) {
      toast.error('Sync Failed', { id: toastId });
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string, carrierName: string, route: string) => {
    const toastId = toast.loading('Terminating Link...');
    try {
      const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      addLog({ id: Date.now().toString(), time: new Date().toLocaleTimeString(), actor: 'Root', role: 'owner', action: 'REJECT', obj: `Link ${route} from ${carrierName} terminated`, icon: '🛑' });
      toast.success('Link Terminated', { id: toastId });
    } catch (e) {
      toast.error('Termination Error', { id: toastId });
    }
  };

  const handleUpdatePrice = (id: string, currentPrice: number) => {
    toast('Pricing override protocols require secondary clearance.', { icon: '⚠️' });
  };

  const handleCancelTrip = (id: string) => {
    toast('Vector termination disabled in current grid mode.', { icon: '⚠️' });
  };

  const pendingTrips = trips.filter(t => t.status === 'pending_approval');
  
  const filtered = trips.filter(t => {
    const matchSearch = t.from.toLowerCase().includes(search.toLowerCase()) ||
      t.to.toLowerCase().includes(search.toLowerCase()) ||
      t.carrierName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sortedTrips = [...filtered].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTrips.length / rowsPerPage);
  const paginatedTrips = sortedTrips.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: keyof TripItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof TripItem) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#00D4FF] rounded-full shadow-[0_0_15px_#00D4FF]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Grid <span className="text-[#00D4FF]">Engineering</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Route Linkage Matrix · System Topology
           </p>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={() => {
                const from = window.prompt('Пункт відправлення:');
                const to = window.prompt('Пункт призначення:');
                if (from && to) {
                  supabase.from('trips').insert({ 
                    departure_city: from, arrival_city: to, 
                    departure_date: new Date().toISOString().split('T')[0],
                    status: 'active',
                    carrierName: 'Admin System',
                    totalSeats: 50,
                    bookedSeats: 0
                  }).then(() => toast.success('Маршрут розгорнуто в мережі'));
                }
              }}
              className="px-8 py-3 bg-[#00D4FF] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            >
              + Create Route
            </button>
            <button 
              onClick={() => exportToCSV(sortedTrips, 'routes_export')}
              className="px-6 py-3 glass-mission-control rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export Network
            </button>
        </div>
      </div>

      <AnimatePresence>
        {pendingTrips.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-mission-control border-[#F59E0B]/30 rounded-[2.5rem] p-8 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 -rotate-12 pointer-events-none">
               <ShieldCheck size={120} className="text-[#F59E0B]" />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-2 bg-[#F59E0B] rounded-full animate-ping" />
              <h3 className="text-sm font-black uppercase text-[#F59E0B] tracking-[0.3em] italic">
                Security Access Queue: {pendingTrips.length} Entities Awaiting Auth
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTrips.map(trip => (
                <motion.div 
                  layout
                  key={trip.id} 
                  className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-[#F59E0B]/30 transition-all"
                >
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                       <span className="text-sm font-black text-white italic">{trip.from}</span>
                       <ArrowRight size={14} className="text-[#F59E0B]" />
                       <span className="text-sm font-black text-white italic">{trip.to}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">
                      {trip.carrierName} · {trip.date} · <span className="text-[#00D4FF]">€{trip.price}</span>
                    </p>
                    {trip.stops && trip.stops.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[8px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Full Itinerary Matrix:</p>
                        <div className="flex flex-wrap gap-2">
                          {trip.stops.map((s: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-white">{s.city}</span>
                              <span className="text-[9px] text-slate-600 font-mono">{s.time}</span>
                              {idx < trip.stops!.length - 1 && <ArrowRight size={10} className="text-slate-700" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(trip.id, trip.carrierName, `${trip.from}→${trip.to}`)}
                      disabled={approvingId === trip.id}
                      className="px-6 py-2 bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#10B981] hover:text-black transition-all"
                    >
                      Authorize
                    </motion.button>
                    <button
                      onClick={() => handleReject(trip.id, trip.carrierName, `${trip.from}→${trip.to}`)}
                      className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Deny
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-mission-control p-6 rounded-[2rem] flex flex-wrap gap-4 items-center">
         <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Query linkage matrix by city or entity name..." 
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#00D4FF] outline-none transition-all placeholder:text-slate-600"
            />
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/5 rounded-2xl">
               <Activity size={14} className="text-slate-500" />
               <select 
                 value={filterStatus}
                 onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                 className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer"
               >
                  <option value="all">All States</option>
                  <option value="active">Operational</option>
                  <option value="pending_approval">Awaiting Auth</option>
                  <option value="completed">Archived</option>
                  <option value="cancelled">Terminated</option>
               </select>
            </div>
         </div>
      </div>

      <div className="glass-mission-control rounded-[2.5rem] overflow-hidden">
         <div className="overflow-x-auto no-scrollbar px-6 pb-6">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th onClick={() => handleSort('from')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Linkage Path{getSortIcon('from')}</th>
                  <th onClick={() => handleSort('carrierName')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Operator{getSortIcon('carrierName')}</th>
                  <th onClick={() => handleSort('date')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Sync Date{getSortIcon('date')}</th>
                  <th onClick={() => handleSort('bookedSeats')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Yield / Capacity{getSortIcon('bookedSeats')}</th>
                  <th onClick={() => handleSort('status')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Link State{getSortIcon('status')}</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-20 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Decrypting Ledger...</td></tr>
                ) : paginatedTrips.map((trip, idx) => {
                  const sc = STATUS_CONFIG[trip.status] || STATUS_CONFIG.active;
                  const capacityPct = trip.seats > 0 ? Math.round((trip.bookedSeats / trip.seats) * 100) : 0;
                  return (
                    <motion.tr 
                      key={trip.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group"
                    >
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-2xl border-y border-l border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white/5 rounded-xl text-[#00D4FF]">
                             <RouteIcon size={16} />
                          </div>
                          <div>
                             <div className="text-[11px] font-black text-white uppercase flex items-center gap-2">
                                {trip.from} <ArrowRight size={10} className="text-slate-600" /> {trip.to}
                             </div>
                             <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">UUID: {trip.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                               <Bus size={12} className="text-slate-400" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase">{trip.carrierName}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{trip.date}</div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <div className="space-y-2">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                               <span className="text-slate-500">Завантаження</span>
                               <span className={capacityPct > 80 ? "text-red-500" : "text-[#00D4FF]"}>{capacityPct}%</span>
                            </div>
                            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${capacityPct}%` }}
                                 className={`h-full ${capacityPct > 80 ? "bg-red-500" : "bg-[#00D4FF]"}`} 
                               />
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                         <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-block border border-white/10 ${sc.bg} ${sc.color}`}>
                            {sc.label}
                         </div>
                      </td>
                      <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-r-2xl border-y border-r border-white/5 text-right">
                        <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                           <button onClick={() => handleUpdatePrice(trip.id, trip.price)} className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-[#00D4FF] transition-all"><Edit2 size={14}/></button>
                           <button onClick={() => handleCancelTrip(trip.id)} className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-red-500 transition-all"><Ban size={14}/></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
         </div>
         {totalPages > 1 && (
           <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Сторінка {page} з {totalPages} (Всього: {sortedTrips.length})
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
    </div>
  );
};

export default RoutesTab;
