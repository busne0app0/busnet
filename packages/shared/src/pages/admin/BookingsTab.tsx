import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, MoreVertical, Bus, Users, Calendar, Activity, Fingerprint, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { exportToCSV } from '@busnet/shared/utils/exportToCSV';
import { toast } from 'react-hot-toast';

const BookingsTab: React.FC = () => {
  const { bookings: mockBookings } = useAdminStore();
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, departure_city, arrival_city, departureCity, arrivalCity');
      
      const tripsMap: Record<string, string> = {};
      if (tripsData) {
        tripsData.forEach(t => {
          const from = t.departure_city || t.departureCity || 'A';
          const to = t.arrival_city || t.arrivalCity || 'B';
          tripsMap[t.id] = `${from} → ${to}`;
        });
      }

      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (!error && bookingsData && isMounted) {
        const formatted = bookingsData.map((bData) => {
          const routeStr = tripsMap[bData.tripId] || 'Unknown Vector';
          return {
            id: bData.id,
            ...bData,
            passengerName: bData.passengers?.[0] ? `${bData.passengers[0].firstName} ${bData.passengers[0].lastName}` : 'Unknown Entity',
            passengersCount: bData.passengers?.length || 1,
            route: routeStr,
            date: bData.created_at ? new Date(bData.created_at).toLocaleDateString('uk-UA') : 'Pending Sync',
            seats: bData.passengers?.length || 0,
            amount: `€${(bData.totalPrice || 0).toFixed(2)}`,
            status: bData.status || 'confirmed'
          };
        });
        setRealBookings(formatted);
      }
      if (isMounted) setLoading(false);
    };

    fetchData();

    const channel = supabase.channel(`bookings_updates_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        if (isMounted) fetchData();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const displayBookings = realBookings.length > 0 ? realBookings : mockBookings;

  const filteredBookings = displayBookings.filter(b => {
    const matchSearch = (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.passengerName || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.route || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedBookings.length / rowsPerPage);
  const paginatedBookings = sortedBookings.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#00D4FF] rounded-full shadow-[0_0_15px_#00D4FF]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Журнал <span className="text-[#00D4FF]">Транзакцій</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             Реєстр квитків · Безпечні платежі
           </p>
        </div>
        <div className="flex gap-4">
            <button 
              onClick={() => exportToCSV(sortedBookings, 'bookings_export')}
              className="px-6 py-3 glass-mission-control rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export Logs
            </button>
            <button 
              onClick={() => {
                const tripId = window.prompt('ID рейсу:');
                if (tripId) {
                   supabase.from('bookings').insert({ tripId, userId: 'manual', status: 'confirmed', totalPrice: 0, passengers: [{ firstName: 'Manual', lastName: 'Entry' }] }).then(() => {
                      toast.success('Бронювання додано');
                   });
                }
              }}
              className="px-8 py-3 bg-[#00D4FF] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            >
              + Manual Insertion
            </button>
        </div>
      </div>

      <div className="glass-mission-control p-6 rounded-[2rem] flex flex-wrap gap-4 items-center">
         <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Шукати за ID, пасажиром або маршрутом..." 
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#00D4FF] outline-none transition-all placeholder:text-slate-600"
            />
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border border-white/5 rounded-2xl">
               <Filter size={14} className="text-slate-500" />
               <select 
                 value={filterStatus}
                 onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                 className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer"
               >
                  <option value="all">Усі Статуси</option>
                  <option value="confirmed">Підтверджені</option>
                  <option value="pending">Очікування</option>
                  <option value="cancelled">Скасовані</option>
               </select>
            </div>
         </div>
      </div>

      <div className="glass-mission-control rounded-[2.5rem] overflow-hidden">
         <div className="overflow-x-auto no-scrollbar px-6 pb-6 pt-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th onClick={() => handleSort('passengerName')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Passenger {getSortIcon('passengerName')}</th>
                  <th onClick={() => handleSort('route')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Vector Path {getSortIcon('route')}</th>
                  <th onClick={() => handleSort('date')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Sync Date {getSortIcon('date')}</th>
                  <th onClick={() => handleSort('amount')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">Yield {getSortIcon('amount')}</th>
                  <th onClick={() => handleSort('status')} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">State {getSortIcon('status')}</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={6} className="py-20 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">Decrypting Ledger...</td></tr>
                ) : paginatedBookings.map((booking, idx) => (
                  <motion.tr 
                    key={booking.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-2xl border-y border-l border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-[#00D4FF]">
                              {booking.passengerName?.slice(0, 2).toUpperCase()}
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase">{booking.passengerName}</p>
                              <p className="text-[8px] text-slate-600 font-mono mt-0.5">ID: {booking.id.slice(0,8)}</p>
                           </div>
                        </div>
                    </td>
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">{booking.route}</span>
                    </td>
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                        <span className="text-[10px] font-black text-slate-400">{booking.date}</span>
                    </td>
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <p className="text-sm font-black text-[#10B981] italic tracking-tighter">{booking.amount}</p>
                    </td>
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <span className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit
                         ${booking.status === 'confirmed' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 
                           booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                           'bg-red-500/10 text-red-500 border-red-500/20'}
                       `}>
                          {booking.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 bg-white/2 group-hover:bg-white/5 transition-all rounded-r-2xl border-y border-r border-white/5 text-right">
                       <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                          <button className="p-2 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                             <Search size={14} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
         </div>
         {totalPages > 1 && (
           <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Сторінка {page} з {totalPages}
             </span>
             <div className="flex gap-2">
               <button 
                 onClick={() => setPage(Math.max(1, page - 1))}
                 disabled={page === 1}
                 className="p-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-30"
               >
                 <ChevronLeft size={16} />
               </button>
               <button 
                 onClick={() => setPage(Math.min(totalPages, page + 1))}
                 disabled={page === totalPages}
                 className="p-2 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-30"
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

export default BookingsTab;
