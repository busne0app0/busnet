import React from 'react';

export default function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.2)] ${className}`}>
      {children}
    </span>
  );
}
