/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Construction } from 'lucide-react';

export default function CarrierPlaceholder({ title }: { title: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pb-20">
      <div className="w-20 h-20 rounded-[32px] bg-[#ff6b35]/5 border border-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] animate-pulse">
        <Construction size={40} />
      </div>
      <div className="space-y-1">
        <h2 className="font-syne font-black text-2xl italic tracking-tighter uppercase text-white">{title}</h2>
        <p className="text-[#5a6a85] text-xs font-black uppercase tracking-widest leading-loose">
          Цей розділ кабінету перевізника<br />знаходиться в активній розробці
        </p>
      </div>
    </div>
  );
}
