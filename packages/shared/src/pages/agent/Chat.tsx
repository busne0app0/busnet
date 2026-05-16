import React from 'react';
import BusnetChat from '@busnet/shared/components/common/BusnetChat';

export default function Chat() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          Чат підтримки
        </h1>
        <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
          AI-асистент та зв'язок з командою BUSNET
        </p>
      </div>
      <BusnetChat portalRole="agent" heightClass="h-[calc(100vh-220px)]" />
    </div>
  );
}
