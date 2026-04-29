import React, { useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  route: string;
  price: number;
  time: string;
  duration: string;
  seats: string;
}

interface SearchTabProps {
  searchResults: SearchResult[] | null;
  handleSearch: (from: string, to: string, date: string) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({ searchResults, handleSearch }) => {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Пошук рейсів</h2>
        <p className="text-[#7a9ab5]">Знайдіть найкращий маршрут за лічені секунди</p>
      </div>

      <div className="bg-[#141c2e] border border-[#1e3a5f] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c8ff] blur-[120px] opacity-10 pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-[#00c8ff] tracking-[0.2em] pl-1">Відправлення</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a6a85] group-focus-within:text-[#00c8ff] transition-colors" size={18} />
              <input 
                className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-2xl pl-12 pr-4 py-5 text-sm focus:border-[#00c8ff] outline-none text-white transition-all shadow-inner shadow-black/40" 
                placeholder="Місто виїзду" 
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-[#00c8ff] tracking-[0.2em] pl-1">Прибуття</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a6a85] group-focus-within:text-[#00c8ff] transition-colors" size={18} />
              <input 
                className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-2xl pl-12 pr-4 py-5 text-sm focus:border-[#00c8ff] outline-none text-white transition-all shadow-inner shadow-black/40" 
                placeholder="Місто прибуття" 
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-[#00c8ff] tracking-[0.2em] pl-1">Дата</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-2xl px-6 py-5 text-sm focus:border-[#00c8ff] outline-none text-white transition-all" 
            />
          </div>
        </div>
        
        <button 
          onClick={() => handleSearch(from, to, date)} 
          className="w-full mt-10 py-5 bg-gradient-to-r from-[#00c8ff] to-[#0099cc] text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:shadow-[0_0_40px_rgba(0,200,255,0.4)] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
        >
          <Zap size={20} /> Почати пошук рейсів
        </button>
      </div>

      <AnimatePresence>
        {searchResults && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#4a6a85] ml-2">Результати пошуку ({searchResults.length})</h3>
            {searchResults.map((r) => (
              <div 
                key={r.id} 
                className="bg-[#111827] border border-[#1e3a5f] rounded-3xl p-8 flex flex-col lg:flex-row justify-between items-center gap-8 hover:border-[#00c8ff]/40 transition-all group"
              >
                <div className="flex-1 space-y-2">
                  <p className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-[#00c8ff] transition-colors">{r.route}</p>
                  <div className="flex gap-4 text-xs font-bold text-[#7a9ab5]">
                    <span className="flex items-center gap-1"><Zap size={14} className="text-[#ffd600]" /> {r.time}</span>
                    <span className="flex items-center gap-1">⏱ {r.duration}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center lg:items-end gap-1">
                  <p className="text-3xl font-black text-[#00c8ff] tracking-tighter">{r.price} ₴</p>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{r.seats}</p>
                </div>
                <button 
                  onClick={() => navigate(`/booking?from=${from}&to=${to}&date=${date}`)}
                  className="w-full lg:w-auto px-10 py-4 bg-white text-black text-[11px] font-black uppercase rounded-xl hover:bg-[#00c8ff] transition-all active:scale-95 shadow-lg"
                >
                  Забронювати
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!searchResults && (
        <div className="text-center py-10 opacity-20 pointer-events-none">
          <Search size={80} className="mx-auto mb-4" />
          <p className="text-xl font-black uppercase italic">Введіть дані для пошуку</p>
        </div>
      )}
    </div>
  );
};

export default SearchTab;
