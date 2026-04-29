import React from 'react';
import { motion } from 'framer-motion';

export const LogoUA = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="gradUA" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D4FF" />
        <stop offset="100%" stopColor="#0055FF" />
      </linearGradient>
    </defs>
    <motion.path
      d="M20 50 Q50 20 80 50 Q50 80 20 50 Z"
      fill="none"
      stroke="url(#gradUA)"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    <circle cx="50" cy="50" r="5" fill="#00D4FF" className="animate-pulse" />
  </svg>
);

export const LogoAgent = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="gradAgent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <rect x="25" y="25" width="50" height="50" rx="12" fill="none" stroke="url(#gradAgent)" strokeWidth="2" />
    <motion.path
      d="M35 50 L45 60 L65 40"
      stroke="url(#gradAgent)"
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  </svg>
);

export const LogoCRM = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="gradCRM" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB800" />
        <stop offset="100%" stopColor="#FF4E00" />
      </linearGradient>
    </defs>
    <motion.rect
      x="20" y="20" width="60" height="60" rx="4"
      fill="none" stroke="url(#gradCRM)" strokeWidth="2"
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
    />
    <path d="M35 40 H65 M35 50 H65 M35 60 H50" stroke="url(#gradCRM)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const LogoControl = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="40" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" />
    <motion.path
      d="M30 50 L50 30 L70 50 L50 70 Z"
      fill="#FFFFFF"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
    />
  </svg>
);

export const LogoDriver = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <rect x="30" y="20" width="40" height="60" rx="4" fill="none" stroke="#00FF88" strokeWidth="2" />
    <motion.rect
      x="35" y="25" width="30" height="30"
      fill="#00FF88"
      initial={{ y: 25 }}
      animate={{ y: 55 }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);
