import React, { useState, useEffect } from 'react';
import { Menu, X, User, Map, Handshake, MessageSquare, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Language } from '@busnet/shared/constants/translations';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t.header.routes, anchor: 'routes', icon: <Map className="w-5 h-5" /> },
    { name: t.header.partners, anchor: 'partners', icon: <Handshake className="w-5 h-5" /> },
    { name: t.header.forum, href: '/forum', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleAnchorClick = (anchor: string) => {
    // Якщо вже на головній — плавно скролимо
    if (window.location.pathname === '/') {
      const el = document.getElementById(anchor);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // На іншій сторінці — переходимо на головну і скролимо
      navigate('/');
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
    setIsMenuOpen(false);
  };

  const languages: Language[] = ['UA', 'EN', 'IT'];

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    // Redirect to correct cabinet based on role
    const roleRoutes: Record<string, string> = {
      admin: '/admin/',
      carrier: '/carrier/',
      agent: '/agent/',
      driver: '/driver/',
      passenger: '/dashboard',
      user: '/dashboard',
    };
    window.location.href = roleRoutes[user?.role || ''] || '/dashboard';
  };

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isMenuOpen ? 'bg-transparent h-20 md:h-24'
          : scrolled ? 'bg-busnet-bg/80 backdrop-blur-lg border-b border-white/5 h-16 md:h-20'
          : 'bg-transparent h-20 md:h-24'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0">
            <span className="text-xl md:text-2xl font-black tracking-tight">
              <span className="holographic-text uppercase">BUSNET UA</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => (
            link.href ? (
              <Link key={link.name} to={link.href} className="text-sm font-medium text-slate-400 hover:text-neon-cyan transition-colors">
                {link.name}
              </Link>
            ) : (
              <button
                key={link.name}
                onClick={() => handleAnchorClick(link.anchor!)}
                className="text-sm font-medium text-slate-400 hover:text-neon-cyan transition-colors"
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
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    language === lang ? 'bg-neon-cyan text-busnet-bg shadow-[0_0_10px_#00D4FF]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-neon-cyan/40 text-sm font-bold text-white hover:bg-neon-cyan/10 transition-all backdrop-blur-sm"
            >
              <User className="w-4 h-4 text-neon-cyan" />
              {isAuthenticated ? (user?.firstName || user?.companyName || 'ПРОФІЛЬ') : t.header.login}
            </button>

            {/* Logout */}
            {isAuthenticated && (
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                Вихід
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                className="p-2 relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 transition-all"
              >
                <Globe className="w-5 h-5 text-slate-400" />
                <span className="absolute -bottom-1 -right-1 bg-busnet-bg border border-neon-cyan/30 text-neon-cyan text-[8px] font-black px-1 rounded-sm">
                  {language}
                </span>
              </button>
              <AnimatePresence>
                {isMobileLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 bg-[#0A0D14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-1 shadow-xl z-[60]"
                  >
                    {(['UA', 'EN', 'IT'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setLanguage(lang); setIsMobileLangOpen(false); }}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                          language === lang ? 'bg-neon-cyan text-busnet-bg' : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none p-2 relative z-50">
              {isMenuOpen ? <X className="w-8 h-8 text-neon-cyan" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#030712]/98 backdrop-blur-3xl z-40 lg:hidden flex flex-col p-6 pt-24 gap-8"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.href ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4"
                  >
                    <span className="text-neon-cyan">{link.icon}</span>
                    {link.name}
                  </Link>
                ) : (
                  <button
                    key={link.name}
                    onClick={() => handleAnchorClick(link.anchor!)}
                    className="text-xl font-bold text-slate-200 hover:text-neon-cyan flex items-center gap-4 border-b border-white/5 pb-4 w-full text-left"
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
                className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl neon-gradient-btn text-lg font-black tracking-widest"
              >
                <User className="w-5 h-5" />
                {isAuthenticated ? (user?.firstName || user?.companyName || 'ПРОФІЛЬ') : t.header.login}
              </button>

              {isAuthenticated && (
                <button
                  onClick={async () => { setIsMenuOpen(false); await logout(); navigate('/'); }}
                  className="py-3 text-slate-500 font-bold uppercase tracking-widest"
                >
                  Вийти з акаунта
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}