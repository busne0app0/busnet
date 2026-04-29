import React from 'react';
import BookingStepper from '@busnet/shared/components/booking/BookingStepper';
import { motion } from 'framer-motion';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col pt-24 pb-12 selection:bg-cyan-500/30">
      {/* Background dynamic elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-600/10 via-transparent to-transparent -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full bg-violet-600/5 blur-[160px] -z-10 animate-pulse" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] -z-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center">
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full"
        >
          <BookingStepper />
        </motion.div>
      </div>
      
      {/* Floating security badge */}
      <div className="fixed bottom-8 right-8 hidden lg:flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 opacity-50 hover:opacity-100 transition-opacity">
         <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 0L0 3V8.5C0 12.83 2.98667 16.89 7 18C11.0133 16.89 14 12.83 14 8.5V3L7 0Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M7 2L1 4.5V8.5C1 12.21 3.56 15.68 7 16.63C10.44 15.68 13 12.21 13 8.5V4.5L7 2Z" fill="currentColor"/>
            </svg>
         </div>
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Захищено SSL</span>
      </div>
    </div>
  );
}
