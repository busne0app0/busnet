import React from 'react';

const routes = [
  "Київ → Мілан",
  "Львів → Берлін",
  "Одеса → Прага",
  "Вінниця → Париж",
  "Дніпро → Варшава",
  "Київ → Мілан",
  "Львів → Берлін",
  "Одеса → Прага",
];

export default function Ticker() {
  return (
    <div className="w-full overflow-hidden mb-6 py-12 relative -mt-32">
      {/* Background Transition Gradient */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-busnet-bg/0 via-busnet-bg to-busnet-bg/0 z-0 pointer-events-none" />
      
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] relative z-10">
        {/* We duplicate the content to ensure smooth seamless scrolling */}
        {[...routes, ...routes].map((route, i) => (
          <div 
            key={i} 
            className="bg-white/[0.03] border border-neon-cyan/80 rounded-full px-5 py-2 mx-2 whitespace-nowrap cursor-pointer font-semibold text-[13px] text-white transition-all hover:bg-neon-cyan/15 hover:scale-105"
          >
            {route}
          </div>
        ))}
      </div>
    </div>
  );
}
