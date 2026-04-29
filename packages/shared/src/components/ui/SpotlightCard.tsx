import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = "" }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if device supports hover (not a touch device)
    if (!divRef.current || window.matchMedia('(hover: none)').matches) return;
    
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: none)').matches) return;
    setOpacity(1);
  };
  
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-10 transition-colors duration-500 hover:border-neon-cyan/30 ${className}`}
    >
      {/* Spotlight Effect - Hidden on touch devices or static glow if desired */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 hidden md:block"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,212,255, 0.1), transparent 40%)`,
        }}
      />
      
      {/* Static Glow for Mobile / Touch */}
      <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 md:hidden group-hover:opacity-100 transition-opacity" />

      {children}
    </div>
  );
};
