import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion';
import { Bus, ArrowRight, Clock, Wallet, Sparkles } from 'lucide-react';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { slowMotionScroll } from '@busnet/shared/lib/scrollUtils';
import { supabase } from '@busnet/shared/supabase/config';

interface DestinationDisplay {
  id: string | number;
  from: string;
  to: string;
  price: string;
  time: string;
  color: 'cyan' | 'magenta' | 'blue' | 'purple';
  accentColor: string;
}

// Словник міст трьома мовами (включаючи Краків)
const CITIES: Record<string, { UK: string; EN: string; IT: string }> = {
  kyiv: { UK: 'Київ', EN: 'Kyiv', IT: 'Kiev' },
  warsaw: { UK: 'Варшава', EN: 'Warsaw', IT: 'Varsavia' },
  krakow: { UK: 'Краків', EN: 'Krakow', IT: 'Cracovia' },
  lviv: { UK: 'Львів', EN: 'Lviv', IT: 'Leopoli' },
  berlin: { UK: 'Берлін', EN: 'Berlin', IT: 'Berlino' },
  rome: { UK: 'Рим', EN: 'Rome', IT: 'Roma' },
  milan: { UK: 'Мілан', EN: 'Milan', IT: 'Milano' },
  bologna: { UK: 'Болонья', EN: 'Bologna', IT: 'Bologna' },
  venice: { UK: 'Венеція', EN: 'Venice', IT: 'Venezia' },
  odesa: { UK: 'Одеса', EN: 'Odesa', IT: 'Odessa' },
  prague: { UK: 'Прага', EN: 'Prague', IT: 'Praga' },
  dnipro: { UK: 'Дніпро', EN: 'Dnipro', IT: 'Dnipro' },
  vienna: { UK: 'Відень', EN: 'Vienna', IT: 'Vienna' },
  naples: { UK: 'Неаполь', EN: 'Naples', IT: 'Napoli' },
  florence: { UK: 'Флоренція', EN: 'Florence', IT: 'Firenze' },
};

function normalizeCityKey(cityStr: string): string {
  const clean = (cityStr || '').trim().toLowerCase();
  for (const [key, trans] of Object.entries(CITIES)) {
    if (key === clean || trans.UK.toLowerCase() === clean || trans.EN.toLowerCase() === clean || trans.IT.toLowerCase() === clean) {
      return key;
    }
  }
  return clean;
}

function getLocalizedCity(cityKey: string, lang: 'UK' | 'EN' | 'IT'): string {
  const norm = normalizeCityKey(cityKey);
  return CITIES[norm]?.[lang] || cityKey;
}

// Підтверджені базові рейси AL-TRANS (Київ/Львів -> Рим/Мілан/Болонья/Варшава)
const BACKUP_ALTRANS_ROUTES = [
  { id: 1, from: 'kyiv', to: 'rome', priceEUR: 75, priceUAH: 3300, hours: 32, minutes: 0, color: 'cyan', accentColor: '#00D4FF' },
  { id: 2, from: 'lviv', to: 'milan', priceEUR: 65, priceUAH: 2850, hours: 24, minutes: 30, color: 'magenta', accentColor: '#e879f9' },
  { id: 3, from: 'kyiv', to: 'warsaw', priceEUR: 28, priceUAH: 1250, hours: 15, minutes: 30, color: 'blue', accentColor: '#3b82f6' },
  { id: 4, from: 'lviv', to: 'krakow', priceEUR: 22, priceUAH: 980, hours: 8, minutes: 30, color: 'purple', accentColor: '#8b5cf6' },
  { id: 5, from: 'odesa', to: 'bologna', priceEUR: 70, priceUAH: 3100, hours: 30, minutes: 0, color: 'cyan', accentColor: '#00D4FF' },
];

const COPIES = 3;
const AUTO_SPEED = 30;
const RESUME_DELAY = 1500;

const EDGE_FADE =
  'linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const getLocalDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

const DestinationCard = ({
  item,
  index,
  onClick,
  isInteractive = true,
}: {
  item: DestinationDisplay;
  index: number;
  onClick: (from: string, to: string) => void;
  isInteractive?: boolean;
}) => {
  const { t } = useLanguage();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(item.from, item.to);
    }
  };

  return (
    <motion.div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-hidden={!isInteractive}
      aria-label={`${item.from} — ${item.to}, ${item.price}`}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      variants={cardVariants}
      custom={index}
      whileHover={isInteractive ? { scale: 1.02 } : undefined}
      onClick={() => isInteractive && onClick(item.from, item.to)}
      className="relative w-[82vw] min-w-[260px] max-w-[320px] h-[180px] sm:h-[196px] sm:w-auto sm:min-w-[340px] cursor-pointer group shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-2xl sm:rounded-3xl"
    >
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transition-all group-hover:bg-white/10 group-hover:border-white/20" />

      <div
        className="absolute -inset-1 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${item.accentColor}, transparent)` }}
      />

      <div className="relative p-4 sm:p-6 h-full flex flex-col justify-between z-10" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Sparkles size={11} className="text-neon-cyan opacity-60" />
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {t.popular?.premium || 'AL-TRANS EXPRESS'}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3 truncate">
              <span>{item.from}</span>
              <ArrowRight size={16} className="text-neon-cyan opacity-60 group-hover:translate-x-1 transition-transform shrink-0" />
              <span>{item.to}</span>
            </h3>
          </div>
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 group-hover:border-neon-cyan/30 transition-colors shrink-0">
            <Bus className="text-neon-cyan w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Адаптивна SVG лінія маршруту */}
        <div className="relative h-8 sm:h-10 w-full">
          <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <line x1="15" y1="20" x2="285" y2="20" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />
            <motion.path
              d="M 15 28 Q 150 -4 285 28"
              fill="none"
              stroke={item.accentColor}
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0.8 }}
              whileHover={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="drop-shadow-[0_0_10px_rgba(0,212,255,0.6)]"
            />
            <circle cx="15" cy="20" r="3.5" className="fill-white/30" />
            <motion.circle
              cx="285" cy="20" r="4"
              className="fill-neon-cyan"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>

        {/* Футер картки */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {t.popular?.priceFrom || 'Ціна від'}
            </span>
            <div className="flex items-center gap-1.5 text-white font-black text-lg sm:text-xl italic">
              <Wallet size={15} className="text-neon-cyan" />
              <span>{item.price}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-white/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
            <Clock size={13} className="text-neon-cyan" />
            <span className="text-xs font-bold whitespace-nowrap">{item.time}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function PopularDestinations() {
  const { setSearchParams, setHighlightDate } = useSearch();
  const { t, language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase() as 'UK' | 'EN' | 'IT';

  // 1. Отримуємо реальні активні маршрути з Supabase
  const [liveDbRoutes, setLiveDbRoutes] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadLiveRoutes() {
      try {
        const { data, error } = await supabase
          .from('routes')
          .select('id, name, outbound, currency, pricesThere, operator')
          .eq('status', 'active')
          .limit(6);

        if (!error && Array.isArray(data) && data.length > 0 && mounted) {
          setLiveDbRoutes(data);
        }
      } catch (err) {
        // М'який перехід на підтверджені маршрути Аль-Трансу
      }
    }
    loadLiveRoutes();
    return () => { mounted = false; };
  }, []);

  // 2. Валюта відв'язана від мови (налаштування користувача)
  const [userCurrency, setUserCurrency] = useState<'UAH' | 'EUR'>('EUR');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('busnet_currency');
      if (saved === 'UAH' || saved === 'EUR') {
        setUserCurrency(saved);
      } else {
        setUserCurrency(currentLang === 'UK' ? 'UAH' : 'EUR');
      }
    } catch {
      setUserCurrency('EUR');
    }
  }, [currentLang]);

  // 3. Формування реальних перевірених карток
  const localizedDestinations: DestinationDisplay[] = useMemo(() => {
    const accents = ['#00D4FF', '#e879f9', '#3b82f6', '#8b5cf6', '#00D4FF'];
    const colors: Array<'cyan' | 'magenta' | 'blue' | 'purple'> = ['cyan', 'magenta', 'blue', 'purple', 'cyan'];

    // Якщо в базі є активні маршрути — беремо їхні реальні дані
    if (liveDbRoutes.length > 0) {
      return liveDbRoutes.slice(0, 5).map((route, i) => {
        const stops = route.outbound?.stops || [];
        const firstCity = stops[0]?.city || 'Київ';
        const lastCity = stops[stops.length - 1]?.city || 'Рим';

        const fromDisplay = getLocalizedCity(firstCity, currentLang);
        const toDisplay = getLocalizedCity(lastCity, currentLang);

        const depTime = stops[0]?.time || '08:00';
        const arrTime = stops[stops.length - 1]?.time || '18:00';
        const dayOffset = stops[stops.length - 1]?.dayOffset || 1;
        const totalHours = dayOffset * 24 + 4; // приблизний розрахунок за зупинками

        const timeFormatted = currentLang === 'EN' || currentLang === 'IT'
          ? `~${totalHours}h`
          : `~${totalHours} год`;

        const basePrice = stops[stops.length - 1]?.price || 70;
        const priceFormatted = userCurrency === 'UAH'
          ? `${Math.round(basePrice * 44)} ₴`
          : `€${basePrice}`;

        return {
          id: route.id,
          from: fromDisplay,
          to: toDisplay,
          price: priceFormatted,
          time: timeFormatted,
          color: colors[i % colors.length],
          accentColor: accents[i % accents.length],
        };
      });
    }

    // Підтверджені міжнародні маршрути AL-TRANS
    return BACKUP_ALTRANS_ROUTES.map((d, i) => {
      const fromDisplay = getLocalizedCity(d.from, currentLang);
      const toDisplay = getLocalizedCity(d.to, currentLang);

      const timeFormatted = currentLang === 'EN' || currentLang === 'IT'
        ? `${d.hours}h ${d.minutes ? `${d.minutes}m` : ''}`.trim()
        : `${d.hours} год ${d.minutes ? `${d.minutes} хв` : ''}`.trim();

      const priceFormatted = userCurrency === 'UAH'
        ? `${d.priceUAH} ₴`
        : `€${d.priceEUR}`;

      return {
        id: d.id,
        from: fromDisplay,
        to: toDisplay,
        price: priceFormatted,
        time: timeFormatted,
        color: d.color as any,
        accentColor: d.accentColor,
      };
    });
  }, [liveDbRoutes, currentLang, userCurrency]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const dragRef = useRef(false);
  const movedRef = useRef(false);

  // Автопрокрутка із захистом від розряду батареї (visibilitychange)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = localizedDestinations.length;

    const getPeriod = () => {
      const a = el.children[0] as HTMLElement | undefined;
      const b = el.children[n] as HTMLElement | undefined;
      return a && b ? b.offsetLeft - a.offsetLeft : 0;
    };

    let period = getPeriod();
    let pos = period;
    el.scrollLeft = pos;

    let speed = 0;
    let lastUserMove = -Infinity;
    let last = performance.now();
    let raf = 0;
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const wrap = (v: number) => {
      if (period <= 0) return v;
      while (v >= period * 2) v -= period;
      while (v < period) v += period;
      return v;
    };

    const tick = (now: number) => {
      if (!isTabVisible) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      period = getPeriod();

      if (Math.abs(el.scrollLeft - pos) > 1.5) {
        pos = el.scrollLeft;
        lastUserMove = now;
      }

      const paused =
        reduceMotion || hoverRef.current || dragRef.current || now - lastUserMove < RESUME_DELAY;
      const target = paused ? 0 : AUTO_SPEED;
      speed += (target - speed) * Math.min(1, dt * 4);

      let next = pos;
      if (speed > 0.05) next += speed * dt;
      next = wrap(next);

      if (next !== pos || speed > 0.05) {
        pos = next;
        el.scrollLeft = pos;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [localizedDestinations]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.button !== 0) return;

    dragRef.current = true;
    movedRef.current = false;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 5) movedRef.current = true;
      el.scrollLeft = startLeft - dx;
    };

    const onUp = () => {
      dragRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      movedRef.current = false;
    }
  };

  const handleCardClick = (from: string, to: string) => {
    slowMotionScroll(0, 1000);
    const today = getLocalDate();
    setSearchParams({ from, to, date: today });

    setTimeout(() => {
      setHighlightDate(true);
      setTimeout(() => setHighlightDate(false), 2000);
    }, 600);
  };

  return (
    <section className="pt-8 sm:pt-16 pb-4 sm:pb-6 relative overflow-hidden w-full text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="mb-5 sm:mb-8"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-4">
            <div className="h-[2px] w-8 sm:w-12 bg-neon-cyan shadow-[0_0_10px_#00D4FF]" />
            <span className="text-neon-cyan font-black text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.4em]">
              {t.popular?.badge || 'ПОПУЛЯРНІ НАПРЯМКИ 2026'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase italic leading-[1.1]">
            <span className="inline-block pr-2">{t.popular?.title || 'ПОПУЛЯРНІ'}</span>{' '}
            <span className="neon-gradient-text uppercase not-italic inline-block pb-[0.12em] ml-0 sm:ml-1">
              {t.popular?.titleAccent || 'РЕЙСИ'}
            </span>
          </h2>
        </motion.div>

        {/* Стрічка карток */}
        <motion.div
          ref={scrollRef}
          variants={{ hidden: {}, show: {} }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          onMouseEnter={() => { hoverRef.current = true; }}
          onMouseLeave={() => { hoverRef.current = false; }}
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
          className="flex gap-3 sm:gap-6 overflow-x-auto pt-4 pb-8 scrollbar-hide perspective-1000 -mx-3 px-3 sm:mx-0 sm:px-0 overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
        >
          {Array.from({ length: COPIES }).flatMap((_, copy) =>
            localizedDestinations.map((item, i) => (
              <DestinationCard
                key={`${copy}-${item.id}`}
                item={item}
                index={i}
                onClick={handleCardClick}
                isInteractive={copy === 1}
              />
            ))
          )}
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </section>
  );
}