import React from 'react';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { slowMotionScroll } from '@busnet/shared/lib/scrollUtils';

const routes = [
  { from: 'Київ', to: 'Мілан' },
  { from: 'Львів', to: 'Берлін' },
  { from: 'Одеса', to: 'Прага' },
  { from: 'Вінниця', to: 'Париж' },
  { from: 'Дніпро', to: 'Варшава' },
];

// Одна «половина» ленты = маршруты, повторённые REPEAT раз.
// Должна быть шире самого широкого экрана, иначе справа появится пустота.
const REPEAT = 4;
const group = Array.from({ length: REPEAT }, () => routes).flat();

export default function Ticker() {
  const { searchParams, setSearchParams, setHighlightDate } = useSearch();

  const handleClick = (from: string, to: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Если дата уже выбрана, оставляем её, иначе ставим сегодняшнюю
    const date = searchParams.date || today;
    setSearchParams({ from, to, date });

    slowMotionScroll(0, 800);

    setHighlightDate(true);
    setTimeout(() => setHighlightDate(false), 2000);
  };

  return (
    <div className="busnet-ticker relative w-full overflow-hidden py-4 sm:py-6 my-4 sm:my-6">
      <style>{`
        @keyframes busnet-ticker-loop {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .busnet-ticker__track {
          animation: busnet-ticker-loop 70s linear infinite;
          will-change: transform;
        }
        .busnet-ticker:hover .busnet-ticker__track,
        .busnet-ticker:focus-within .busnet-ticker__track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .busnet-ticker__track { animation: none; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-busnet-bg to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-busnet-bg to-transparent z-20" />

      {/* Две одинаковые половины подряд: лента сдвигается ровно на одну половину и бесшовно повторяется */}
      <div className="busnet-ticker__track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1 ? true : undefined}>
            {group.map((r, i) => (
              <button
                key={i}
                type="button"
                tabIndex={copy === 1 || i >= routes.length ? -1 : 0}
                onClick={() => handleClick(r.from, r.to)}
                className="bg-white/[0.03] border border-neon-cyan/60 rounded-full px-5 py-2 mx-2 whitespace-nowrap cursor-pointer font-semibold text-[13px] text-white transition-colors hover:bg-neon-cyan/15 active:bg-neon-cyan/25"
              >
                {r.from} → {r.to}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}