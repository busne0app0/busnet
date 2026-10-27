import React, { useState, useEffect } from 'react';
import { Menu, X, User, Map, Handshake, MessageSquare, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Language } from '@busnet/shared/constants/translations';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getPostLoginTarget } from '@busnet/shared/constants/roleRoutes';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll listener with initial call and passive flag
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsMobileLangOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
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

  // Click outside to close mobile language dropdown
  useEffect(() => {
    if (!isMobileLangOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-lang-container')) {
        setIsMobileLangOpen(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [isMobileLangOpen]);

  const navLinks = [
    { name: t.header.routes, anchor: 'routes', icon: <Map className="w-5 h-5" /> },
    { name: t.header.partners, anchor: 'partners', icon: <Handshake className="w-5 h-5" /> },
    { name: t.header.forum, href: '/forum', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleAnchorClick = (anchor: string) => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/', { state: { scrollTo: anchor } });
    }
  };

  const languages: Language[] = ['UK', 'EN', 'IT'];

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    const target = getPostLoginTarget(user?.role || '');
    if (target.error || !target.shouldRedirect) return;
    // For passenger on landing use SPA router, for dashboards use cross-app navigation
    if (target.url === '/dashboard') {
      navigate('/dashboard');
    } else {
      window.location.assign(target.url);
    }
  };

  const getProfileButtonLabel = () => {
    if (!isAuthenticated) return t.header.login;
    if (user?.role === 'carrier') return `КАБІНЕТ: ${user?.companyName || 'ПЕРЕВІЗНИК'}`;
    if (user?.role === 'admin') return 'АДМІН-ПАНЕЛЬ';
    if (user?.role === 'agent') return 'КАБІНЕТ АГЕНТА';
    if (user?.role === 'driver') return 'КАБІНЕТ ВОДІЯ';
    return user?.firstName ? `ПРОФІЛЬ: ${user.firstName}` : 'ОСОБИСТИЙ КАБІНЕТ';
  };

  const logoutLabel = language === 'EN' ? 'Log out' : language === 'IT' ? 'Esci' : 'Вихід';
  const logoutFullLabel = language === 'EN' ? 'Sign out of account' : language === 'IT' ? 'Esci dal conto' : 'Вийти з акаунта';

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-[background,box-shadow] duration-300 ${isMenuOpen
          ? 'bg-transparent h-16 md:h-20'
          : scrolled
            ? 'bg-busnet-bg/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] h-16 md:h-20'
            : 'bg-transparent h-16 md:h-20'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer shrink min-w-0">
            <img src="/icon.png" alt="BUSNET UA" className="w-8 h-8 md:w-9 md:h-9 object-contain shrink-0 rounded-lg drop-shadow-[0_0_8px_rgba(0,212,255,0.35)]" />
            <span className="text-base sm:text-xl font-semibold tracking-[0.14em] uppercase truncate">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">BUSNET</span>
              <span className="ml-1 text-neon-cyan drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">UA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              link.href ? (
                <Link key={link.name} to={link.href} className="text-sm font-medium text-slate-200 hover:text-neon-cyan transition-colors duration-200">
                  {link.name}
                </Link>
              ) : (
                <button
                  key={link.name}
                  onClick={() => handleAnchorClick(link.anchor!)}
                  className="text-sm font-medium text-slate-200 hover:text-neon-cyan transition-colors duration-200"
                >
                  {link.name}
                </button>
              )
            ))}
          </nav>

          {/* Desktop Action Group */}
          <div className="hidden lg:flex items-center gap-4">

            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${language === lang ? 'bg-neon-cyan text-busnet-bg shadow-[0_0_10px_#00D4FF]' : 'text-slate-300 hover:text-white'
                    }`}
                >
                  {lang === 'UK' ? 'UA' : lang}
                </button>
              ))}
            </div>

            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-neon-cyan/40 text-sm font-bold text-white hover:bg-neon-cyan/10 transition-all backdrop-blur-sm max-w-[240px]"
            >
              <User className="w-4 h-4 text-neon-cyan shrink-0" />
              <span className="truncate">{getProfileButtonLabel()}</span>
            </button>

            {/* Logout */}
            {isAuthenticated && (
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                {logoutLabel}
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="relative mobile-lang-container">
              <button
                type="button"
                onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                aria-label="Change language"
                aria-expanded={isMobileLangOpen}
                className="p-2 relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                <Globe className="w-5 h-5 text-slate-300" />
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
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => { setLanguage(lang); setIsMobileLangOpen(false); }}
                        className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-black transition-all ${language === lang ? 'bg-neon-cyan text-busnet-bg' : 'text-slate-400 hover:text-white hover:bg-white/10'
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
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={isMenuOpen}
              className="text-white focus:outline-none min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all relative z-50"
            >
              {isMenuOpen ? <X className="w-6 h-6 text-neon-cyan" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
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
                    className="min-h-[44px] text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4"
                  >
                    <span className="text-neon-cyan">{link.icon}</span>
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleAnchorClick(link.anchor!)}
                    className="min-h-[44px] text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4 w-full text-left"
                  >
                    <span className="text-neon-cyan">{link.icon}</span>
                    {link.name}
                  </button>
                )
              ))}
            </nav>

            <div className="flex flex-col gap-4 mt-auto">
              <button
                onClick={() => { setIsMenuOpen(false); handleProfileClick(); }}
                className="flex items-center justify-center gap-3 w-full min-h-[52px] py-4 rounded-2xl neon-gradient-btn text-base sm:text-lg font-black tracking-widest"
              >
                <User className="w-5 h-5" />
                <span className="truncate">{getProfileButtonLabel()}</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={async () => { setIsMenuOpen(false); await logout(); navigate('/'); }}
                  className="min-h-[44px] py-3 text-slate-500 hover:text-red-400 font-bold uppercase tracking-widest text-center"
                >
                  {logoutFullLabel}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
