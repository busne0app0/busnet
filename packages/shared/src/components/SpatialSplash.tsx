import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoUA, LogoAgent, LogoCRM, LogoControl, LogoDriver } from './ModuleLogos';

interface SpatialSplashProps {
  role: 'passenger' | 'agent' | 'carrier' | 'admin' | 'driver';
  onComplete: () => void;
}

const moduleConfigs = {
  passenger: { 
    name: 'BUSNET UA', 
    Logo: LogoUA, 
    color: '#00D4FF',
    tagline: 'Цифрова Екосистема Подорожей'
  },
  agent: { 
    name: 'BUSNET AGENT', 
    Logo: LogoAgent, 
    color: '#A855F7',
    tagline: 'Ефективність Продажів'
  },
  carrier: { 
    name: 'BUSNET CRM', 
    Logo: LogoCRM, 
    color: '#FFB800',
    tagline: 'Управління Автопарком v4.0'
  },
  admin: { 
    name: 'BUSNET CONTROL', 
    Logo: LogoControl, 
    color: '#FFFFFF',
    tagline: 'Глобальний Арбітр'
  },
  driver: { 
    name: 'BUSNET DRIVER', 
    Logo: LogoDriver, 
    color: '#00FF88',
    tagline: 'Миттєвий Контроль'
  }
};

export const SpatialSplash: React.FC<SpatialSplashProps> = ({ role, onComplete }) => {
  const config = moduleConfigs[role] || moduleConfigs.passenger;
  const { Logo } = config;

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden"
    >
      {/* Background Atmosphere */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, ${config.color}33 0%, transparent 70%)` }}
      />

      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-32 h-32 mb-8 relative"
        >
          <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: config.color }}>
            <Logo />
          </div>
          <Logo />
        </motion.div>

        {/* Text Container */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl font-black tracking-[0.2em] text-white mb-2 font-syne"
          >
            {config.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xs uppercase tracking-[0.5em] text-white/60 font-medium"
          >
            {config.tagline}
          </motion.p>
        </div>

        {/* Progress Line */}
        <motion.div 
          className="absolute -bottom-24 w-48 h-px bg-white/10"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-cyan-400 shadow-[0_0_10px_#00d4ff]"
            style={{ backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}` }}
          />
        </motion.div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </motion.div>
  );
};
