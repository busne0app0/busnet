import React from 'react';
import BusnetChat from '@busnet/shared/components/common/BusnetChat';

export default function SupportTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-6 rounded-full bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ПІДТРИМКА</h2>
        </div>
        <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">
          AI-чат з підтримкою та ескалацією до адміністратора
        </p>
      </div>
      <BusnetChat portalRole="carrier" heightClass="h-[calc(100vh-220px)]" />
    </div>
  );
}
