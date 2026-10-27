import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Map, Handshake, MessageSquare, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Language } from '@busnet/shared/constants/translations';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getPostLoginTarget } from '@busnet/shared/constants/roleRoutes';
import toast from 'react-hot-toast';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const burgerRef = useRef<HTMLButtonElement>(null);
  const pendingAnchor = useRef<string | null>(null);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll listener with initial call and passive flag
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll, trap interactivity with inert, and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const covered = document.querySelectorAll('main, footer');
    covered.forEach((el) => el.setAttribute('inert', ''));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsMobileLangOpen(false);
        burgerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      covered.forEach((el) => el.removeAttribute('inert'));
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsMobileLangOpen(false);
  }, [location.pathname]);

  // Close mobile menu on desktop breakpoint resize
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) {
        setIsMenuOpen(false);
        setIsMobileLangOpen(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Pointerdown and Escape listeners to close mobile language dropdown
  useEffect(() => {
    if (!isMobileLangOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('.mobile-lang-container')) {
        setIsMobileLangOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileLangOpen(false);
    };

    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [isMobileLangOpen]);

  const navLinks = [
    { name: t.header.routes, anchor: 'routes', icon: <Map className="w-5 h-5" /> },
    { name: t.header.partners, anchor: 'partners', icon: <Handshake className="w-5 h-5" /> },
    { name: t.header.forum, href: '/forum', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleAnchorClick = (anchor: string) => {
    if (location.pathname !== '/') {
      setIsMenuOpen(false);
      navigate('/', { state: { scrollTo: anchor } });
    } else if (isMenuOpen) {
      pendingAnchor.current = anchor;
      setIsMenuOpen(false);
    } else {
      goTo(anchor);
    }
  };

  const languages: Language[] = ['UK', 'EN', 'IT'];

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    const target = getPostLoginTarget(user?.role || '');
    if (target.error || !target.shouldRedirect) {
      toast.error(t.header.cabinetUnavailable || 'Кабінет тимчасово недоступний');
      return;
    }
    // For passenger on landing use SPA router, for dashboards use cross-app navigation
    if (target.url === '/dashboard') {
      navigate('/dashboard');
    } else {
      window.location.assign(target.url);
    }
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  const getProfileButtonLabel = () => {
    if (!isAuthenticated) return t.header.login;
    if (user?.role === 'carrier') return t.header.cabinetCarrier(user?.companyName || 'ПЕРЕВІЗНИК');
    if (user?.role === 'admin') return t.header.cabinetAdmin;
    if (user?.role === 'agent') return t.header.cabinetAgent;
    if (user?.role === 'driver') return t.header.cabinetDriver;
    return user?.firstName ? t.header.profileOf(user.firstName) : t.header.cabinet;
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-[background,box-shadow] duration-300 ${
          isMenuOpen
            ? 'bg-transparent h-16 md:h-20'
            : scrolled
              ? 'bg-busnet-bg/95 lg:bg-busnet-bg/90 lg:backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] h-16 md:h-20'
              : 'bg-transparent h-16 md:h-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer shrink min-w-0">
            <img src="/icon.png" alt="BUSNET UA" className="w-8 h-8 md:w-9 md:h-9 object-contain shrink-0 rounded-lg drop-shadow-[0_0_8px_rgba(0,212,255,0.35)]" />
            <span className="text-[15px] min-[360px]:text-base tracking-[0.08em] min-[360px]:tracking-[0.14em] font-semibold uppercase truncate">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">BUSNET</span>
              <span className="ml-1 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">UA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              link.href ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-slate-200 hover:text-neon-cyan transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg px-2 py-1"
                >
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => handleAnchorClick(link.anchor!)}
                  className="text-sm font-medium text-slate-200 hover:text-neon-cyan transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg px-2 py-1"
                >
                  {link.name}
                </button>
              )
            ))}
          </nav>

          {/* Desktop Action Group */}
          <div className="hidden lg:flex items-center gap-4">

            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10" role="group" aria-label={t.header.changeLanguage}>
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  lang={lang.toLowerCase()}
                  aria-pressed={language === lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-neon-cyan ${
                    language === lang
                      ? 'bg-neon-cyan text-busnet-bg shadow-[0_0_10px_#00D4FF]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lang === 'UK' ? 'UA' : lang}
                </button>
              ))}
            </div>

            {/* Profile Button */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-neon-cyan/40 text-sm font-bold text-white hover:bg-neon-cyan/10 transition-all backdrop-blur-sm max-w-[240px] focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              <User className="w-4 h-4 text-neon-cyan shrink-0" aria-hidden="true" />
              <span className="truncate">{getProfileButtonLabel()}</span>
            </button>

            {/* Logout */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg"
              >
                {t.header.logout}
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="relative mobile-lang-container">
              <button
                type="button"
                onClick={() => setIsMobileLangOpen((v) => !v)}
                aria-label={t.header.changeLanguage}
                aria-expanded={isMobileLangOpen}
                className="p-2 relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-neon-cyan"
              >
                <Globe className="w-5 h-5 text-slate-300" aria-hidden="true" />
                <span className="absolute -bottom-0.5 -right-0.5 bg-busnet-bg border border-neon-cyan/40 text-neon-cyan text-[9px] font-black px-1 rounded-sm shadow-sm">
                  {language === 'UK' ? 'UA' : language}
                </span>
              </button>
              <AnimatePresence>
                {isMobileLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 bg-[#0A0D14]/98 backdrop-blur-xl border border-white/15 rounded-2xl p-2 flex gap-1 shadow-2xl z-[60]"
                    role="group"
                    aria-label={t.header.changeLanguage}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        lang={lang.toLowerCase()}
                        aria-pressed={language === lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsMobileLangOpen(false);
                        }}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-black transition-all ${
                          language === lang
                            ? 'bg-neon-cyan text-busnet-bg'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {lang === 'UK' ? 'UA' : lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              ref={burgerRef}
              type="button"
              onClick={() => {
                setIsMobileLangOpen(false);
                setIsMenuOpen((v) => !v);
              }}
              aria-label={isMenuOpen ? t.header.closeMenu : t.header.openMenu}
              aria-expanded={isMenuOpen}
              className="text-white min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all relative z-50 focus-visible:ring-2 focus-visible:ring-neon-cyan"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-neon-cyan" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence
        onExitComplete={() => {
          if (pendingAnchor.current) {
            goTo(pendingAnchor.current);
            pendingAnchor.current = null;
          }
        }}
      >
        {isMenuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.header.openMenu}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#030712]/98 z-40 lg:hidden flex flex-col p-6 pt-24 gap-6 overflow-y-auto pb-[max(2rem,env(safe-area-inset-bottom))]"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.href ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="min-h-[44px] text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4 focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg"
                  >
                    <span className="text-neon-cyan" aria-hidden="true">{link.icon}</span>
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handleAnchorClick(link.anchor!)}
                    className="min-h-[44px] text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4 w-full text-left focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg"
                  >
                    <span className="text-neon-cyan" aria-hidden="true">{link.icon}</span>
                    {link.name}
                  </button>
                )
              ))}
            </nav>

            <div className="flex flex-col gap-4 mt-auto">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleProfileClick();
                }}
                className="flex items-center justify-center gap-3 w-full min-h-[52px] py-4 rounded-2xl neon-gradient-btn text-base sm:text-lg font-black tracking-widest focus-visible:ring-2 focus-visible:ring-neon-cyan"
              >
                <User className="w-5 h-5" aria-hidden="true" />
                <span className="truncate">{getProfileButtonLabel()}</span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] py-3 text-slate-500 hover:text-red-400 font-bold uppercase tracking-widest text-center focus-visible:ring-2 focus-visible:ring-neon-cyan rounded-lg"
                >
                  {t.header.logoutFull}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
