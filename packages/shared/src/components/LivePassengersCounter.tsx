import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LivePassengersCounter() {
  const [count, setCount] = useState(1240);

  useEffect(() => {
    // Initial random offset to not look static
    setCount(Math.floor(1200 + Math.random() * 100));

    // Change every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
        return Math.max(1000, prev + change);
      });
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-[#00e676] text-[10px] md:text-xs font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 bg-[#00e676] rounded-full animate-pulse shadow-[0_0_8px_#00e676]" />
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="tabular-nums"
        >
          {count.toLocaleString()} пасажирів в дорозі
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
