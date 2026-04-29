import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Star, Search, 
  MapPin, MessageSquare, ArrowUpRight, Heart, TrendingUp, Filter, Loader2, MinusCircle,
  ShieldAlert, Fingerprint, Zap, Mail, Phone
} from 'lucide-react';
import { useAdminStore } from '@busnet/shared/store/useAdminStore';
import { supabase } from '@busnet/shared/supabase/config';

interface PassengerUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: string;
  loyaltyPoints?: number;
  totalTrips?: number;
  totalSpent?: number;
  createdAt?: any;
}

const CRMTab: React.FC = () => {
  const { addLog } = useAdminStore();
  const [passengers, setPassengers] = useState<PassengerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .in('role', ['passenger', 'user']);
        
        if (!error && data) {
          setPassengers(data.map(u => ({ ...u, id: u?.uid || '' })));
        }
      } catch (err) {
        console.error('Error fetching passengers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
    const channel = supabase
      .channel(`users_crm_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchPassengers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleBlockUser = async (user: PassengerUser) => {
    try {
      const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('uid', user.id);
      
      if (error) throw error;

      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: 'Admin',
        role: 'owner',
        action: 'SECURITY',
        obj: `${nextStatus === 'blocked' ? 'Locked' : 'Unlocked'} user: ${user.email}`,
        icon: '🔐'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = passengers.filter(p => 
    `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = passengers.filter(p => p.status !== 'blocked').length;
  const totalLtv = passengers.reduce((acc, p) => acc + (p.totalSpent || 0), 0) / 42;
  const avgCheck = passengers.length > 0 ? (totalLtv / passengers.length).toFixed(0) : 0;
  const totalPoints = passengers.reduce((acc, p) => acc + (p.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
      {/* 🚀 Human Intel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="w-1.5 h-8 bg-[#00D4FF] rounded-full shadow-[0_0_15px_#00D4FF]" />
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                Passenger <span className="text-[#00D4FF]">Grid</span>
              </h2>
           </div>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-6">
             User Matrix Intelligence · Loyalty Synchronization
           </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-[#00D4FF] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
        >
          Initialize User Protocol
        </motion.button>
      </div>

      {/* 📊 Intelligence KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Identified Users', val: passengers.length.toLocaleString(), icon: Users, color: '#00D4FF' },
           { label: 'Active Signals', val: activeCount.toLocaleString(), icon: UserCheck, color: '#10B981' },
           { label: 'Avg Unit Yield', val: `€${avgCheck}`, icon: TrendingUp, color: '#8B5CF6' },
           { label: 'Neural Points', val: totalPoints.toLocaleString(), icon: Star, color: '#F59E0B' },
         ].map((s, i) => (
           <motion.div 
             key={i} 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="glass-mission-control luminous-border p-6 group cursor-default"
           >
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-[#00D4FF]/30 transition-all duration-500">
                    <s.icon size={18} style={{ color: s.color }} />
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{s.val}</div>
           </motion.div>
         ))}
      </div>

      {/* 🔍 Matrix Search */}
      <div className="glass-mission-control p-6 rounded-[2rem] flex gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Decrypt passenger identity by name, neural point or contact..." 
              className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs text-white focus:border-[#00D4FF] outline-none transition-all placeholder:text-slate-600"
            />
         </div>
      </div>

      {/* 🛸 Human Matrix Grid */}
      <div className="glass-mission-control rounded-[2.5rem] overflow-hidden">
         <div className="overflow-x-auto no-scrollbar px-6 pb-6">
            {loading ? (
               <div className="py-24 text-center">
                 <Loader2 size={40} className="animate-spin text-[#00D4FF] mx-auto mb-4" />
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Accessing Bio-Matrix Database...</p>
               </div>
            ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Bio Identity</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Communication</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Ops</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">LTV / Yield</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Neural Points</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocol State</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <motion.tr 
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all rounded-l-2xl border-y border-l border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[10px] font-black text-white group-hover:border-[#00D4FF]/40 transition-all duration-500 uppercase overflow-hidden relative">
                             <Fingerprint size={18} className="text-[#00D4FF] opacity-20 absolute inset-0 m-auto" />
                             <span className="relative z-10">{p.firstName ? p.firstName.slice(0, 2) : '??'}</span>
                          </div>
                          <div>
                             <p className="text-sm font-black text-white group-hover:text-[#00D4FF] transition-colors leading-none">{p.firstName || 'Unknown'} {p.lastName || 'Unit'}</p>
                             <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1.5">{p.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5 text-[10px] font-bold text-slate-400 group-hover:text-white">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2"><Phone size={10} className="text-[#00D4FF]" /> {p.phone || 'N/A'}</span>
                        <span className="flex items-center gap-2 opacity-50"><Mail size={10} /> {p.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                      <div className="flex items-center gap-2">
                         <Zap size={12} className="text-[#F59E0B]" />
                         <span className="text-xs font-black text-white italic">{p.totalTrips || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5 font-black text-[#10B981]">
                      €{Math.round((p.totalSpent || 0) / 42)}
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <div className="flex items-center gap-1.5 text-[#F59E0B]">
                          <Star size={12} className="fill-[#F59E0B] drop-shadow-[0_0_8px_#F59E0B]" />
                          <span className="text-xs font-black">{(p.loyaltyPoints || 0).toLocaleString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all border-y border-white/5">
                       <span className={`
                         px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit
                         ${p.status === 'blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                           p.status === 'active' || !p.status ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 
                           'bg-white/5 text-slate-500 border-white/10'}
                       `}>
                          <div className={`w-1 h-1 rounded-full ${p.status === 'blocked' ? 'bg-red-500' : 'bg-[#10B981]'} animate-pulse`} />
                          {p.status === 'blocked' ? 'Locked' : 'Active'}
                       </span>
                    </td>
                    <td className="px-6 py-4 bg-white/2 group-hover:bg-white/5 transition-all rounded-r-2xl border-y border-r border-white/5 text-right">
                       <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleBlockUser(p)}
                            className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                          >
                             <ShieldAlert size={16} />
                          </button>
                          <button className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-500 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all">
                             <MessageSquare size={16} />
                          </button>
                       </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
         </div>
      </div>
    </div>
  );
};

export default CRMTab;
