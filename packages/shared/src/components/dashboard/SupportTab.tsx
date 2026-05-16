/**
 * SupportTab for Passenger Dashboard
 * Uses unified BusnetChat component
 */
import React from 'react';
import BusnetChat from '@busnet/shared/components/common/BusnetChat';

const SupportTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Підтримка</h2>
        <p className="text-[11px] text-[#4a6a85] uppercase tracking-widest font-bold mt-1">
          AI-консьєрж та зв'язок з командою BUSNET
        </p>
      </div>
      <BusnetChat portalRole="passenger" heightClass="h-[calc(100vh-260px)]" />
    </div>
  );
};

export default SupportTab;
