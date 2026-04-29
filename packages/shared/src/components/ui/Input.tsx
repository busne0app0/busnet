import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function Input({ className = '', label, icon, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2 w-full text-left">
      {label && <label className="text-[11px] font-semibold text-slate-500 uppercase ml-1 block mb-2">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors ${
            icon ? 'pl-11 pr-4 py-[14px] text-[15px]' : 'px-4 py-[14px] text-[15px]'
          } ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
