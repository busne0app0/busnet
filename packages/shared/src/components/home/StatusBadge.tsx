import React from 'react';

export default function StatusBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-5">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></span>
      <span className="text-[11px] font-bold text-white uppercase tracking-wider">Бронювання відкрите 24/7</span>
    </div>
  );
}
