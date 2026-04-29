import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-300 active:scale-95 focus:outline-none cursor-pointer';
  
  const variants = {
    primary: 'accent-gradient text-white hover:opacity-90 hover:translate-y-[-1px]',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/5',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
    glass: 'glassmorphism hover:bg-busnet-paper/80 bg-white/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-[14px] text-[15px] h-[49px]',
    lg: 'px-8 py-[14px] text-[15px] h-[49px] font-bold',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
