/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Clock, MapPin, Users, CreditCard, ChevronRight, Info, Send, Phone, User } from 'lucide-react';
import { Trip } from '../../busnet/types';
import Badge from '../ui/Badge';
import { supabase } from '@busnet/shared/supabase/config';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { calculateTripPrices } from '../../busnet/logic';

interface SearchResultsProps {
  trips: Trip[];
  loading: boolean;
  onSelect: (trip: Trip) => void;
}

export default function SearchResults({ trips, loading, onSelect }: SearchResultsProps) {
  const { searchParams } = useSearch();

  const getSegmentDetails = (trip: Trip) => {
    const from = searchParams.from?.toLowerCase();
    const to = searchParams.to?.toLowerCase();

    const stops = (trip as any).stops || (trip as any).stopsThere || [];
    const fromStop = stops.find((s: any) => s.city.toLowerCase() === from) || stops[0] || { time: '--:--', city: '' };
    const toStop = stops.find((s: any) => s.city.toLowerCase() === to) || stops[stops.length - 1] || { time: '--:--', city: '' };

    // Find indices for price calculation
    const fromIdx = stops.findIndex((s: any) => s.city.toLowerCase() === from);
    const toIdx = stops.findIndex((s: any) => s.city.toLowerCase() === to);

    let price = trip.price || 0;
    if (fromIdx !== -1 && toIdx !== -1 && trip.pricesThere) {
       const key = `${fromIdx}-${toIdx}`;
       if (trip.pricesThere[key]) {
          price = trip.pricesThere[key];
       }
    }

    return {
      departureTime: fromStop.time,
      arrivalTime: toStop.time,
      fromCity: fromStop.city,
      toCity: toStop.city,
      price
    };
  };
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 flex flex-col gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-40 w-full bg-white/5 animate-pulse rounded-3xl border border-white/5" />
        ))}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      setIsSubmitting(true);
      setIsSubmitted(true);
      
      try {
        const { error } = await supabase.from('leads').insert({
          name: formData.name,
          phone: formData.phone,
          from: searchParams.from,
          to: searchParams.to,
          date: searchParams.date,
          status: 'new',
          created_at: new Date().toISOString()
        });
        
        if (error) console.error('Error creating lead:', error);
      } catch (err) {
        console.error('Lead submission failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (trips.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4">
        <div className="bg-[#141928]/40 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[100px] -z-10" />
          
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                  <Info className="w-10 h-10 text-neon-cyan" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-4 text-white uppercase tracking-tight">Рейсів не знайдено</h3>
                <p className="text-slate-400 mb-10 text-lg leading-relaxed max-w-md mx-auto italic font-medium">
                  Введіть ваші дані і ми підберемо найкращий варіант за <span className="text-neon-cyan font-black">60 секунд</span>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-cyan transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder="Ваше ім'я"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-neon-cyan/50 focus:bg-white/[0.08] transition-all font-bold"
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-cyan transition-colors" />
                    <input 
                      required
                      type="tel" 
                      placeholder="+380"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-neon-cyan/50 focus:bg-white/[0.08] transition-all font-bold"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="neon-gradient-btn w-full py-5 rounded-2xl text-base font-black uppercase tracking-wider mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        ВІДПРАВИТИ ЗАПИТ
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 128 128">
                    <circle 
                      cx="64" cy="64" r="56" 
                      fill="none" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="8"
                    />
                    <motion.circle 
                      cx="64" cy="64" r="56" 
                      fill="none" 
                      stroke="#00D4FF" 
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="352"
                      animate={{ strokeDashoffset: 352 - (352 * timeLeft) / 60 }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-neon-cyan">
                    {timeLeft}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white uppercase mb-2">Запит обробляється</h3>
                <p className="text-slate-400 font-medium italic">Ми вже шукаємо найкращий рейс для вас...</p>
                {timeLeft === 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-400 mt-4 font-bold uppercase tracking-widest text-sm"
                  >
                    Оператор зв'яжеться з вами найближчим часом!
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <div className="flex justify-between items-end px-4">
        <h2 className="text-xl font-bold text-slate-200">Знайдено результатів: {trips.length}</h2>
        <div className="text-sm text-slate-500 italic">Ціни вказані за 1 пасажира</div>
      </div>

      <div className="grid gap-4">
        {trips.map((trip, index) => {
          const details = getSegmentDetails(trip);
          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-[#141928]/40 backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 rounded-[32px] overflow-hidden transition-all duration-300"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
                
                {/* Timing & Carrier */}
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
                  <div className="flex flex-col">
                    <div className="text-3xl font-black text-white">{details.departureTime}</div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1 min-w-0">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{details.fromCity}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-center">
                     <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                     </div>
                     <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold">в дорозі</div>
                  </div>

                  <div className="flex flex-col text-right md:text-left">
                    <div className="text-3xl font-black text-white">{details.arrivalTime}</div>
                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1 md:justify-start justify-end min-w-0">
                      <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{details.toCity}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="w-full md:w-auto md:min-w-[200px] flex md:flex-col items-center justify-between gap-4 md:border-l border-white/10 md:pl-8">
                  <div className="flex flex-col md:items-end">
                    <div className="text-sm text-slate-400 font-medium">{trip.carrierName}</div>
                    <div className="text-2xl font-bold text-neon-cyan">
                      {details.price} <span className="text-sm uppercase">{trip.currency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-500">Вільних місць: {trip.seatsTotal - (trip.seatsBooked || 0)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelect(trip)}
                    className="neon-gradient-btn px-6 py-3 rounded-2xl flex items-center gap-2 group-hover:px-8 transition-all"
                  >
                    ВИБРАТИ
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
              
              {/* Amenities Footer */}
              {trip.amenities && (
                <div className="px-8 py-3 bg-white/[0.02] border-t border-white/5 flex gap-4 overflow-x-auto no-scrollbar">
                  {trip.amenities.map(a => (
                    <span key={a} className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      ⚡️ {a}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
