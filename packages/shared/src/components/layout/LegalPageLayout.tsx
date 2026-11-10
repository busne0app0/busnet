import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Cookie, HelpCircle, PhoneCall, ArrowLeft, RotateCcw } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import MainLayout from './MainLayout';

interface LegalPageLayoutProps {
  children: React.ReactNode;
  activePath: '/terms' | '/privacy' | '/cookies' | '/booking-terms' | '/refund-policy' | '/contacts';
  titleUk: string;
  titleEn: string;
  titleIt: string;
  descUk: string;
  descEn: string;
  descIt: string;
}

const navItems = [
  { path: '/terms', labelUk: 'Умови сервісу', labelEn: 'Terms of Service', labelIt: 'Termini di Servizio', icon: FileText },
  { path: '/privacy', labelUk: 'Конфіденційність (GDPR)', labelEn: 'Privacy Policy (GDPR)', labelIt: 'Informativa Privacy (GDPR)', icon: ShieldCheck },
  { path: '/cookies', labelUk: 'Файли Cookie', labelEn: 'Cookie Policy', labelIt: 'Informativa Cookie', icon: Cookie },
  { path: '/booking-terms', labelUk: 'Правила бронювання', labelEn: 'Booking Terms', labelIt: 'Termini di Prenotazione', icon: HelpCircle },
  { path: '/refund-policy', labelUk: 'Скасування та повернення', labelEn: 'Cancellation & Refunds', labelIt: 'Cancellazioni e Rimborsi', icon: RotateCcw },
  { path: '/contacts', labelUk: 'Контакти та підтримка', labelEn: 'Contacts & Support', labelIt: 'Contatti e Assistenza', icon: PhoneCall },
];

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  children,
  activePath,
  titleUk,
  titleEn,
  titleIt,
  descUk,
  descEn,
  descIt,
}) => {
  const { langKey } = useLanguage();
  const location = useLocation();

  const title = langKey === 'it' ? titleIt : langKey === 'en' ? titleEn : titleUk;
  const desc = langKey === 'it' ? descIt : langKey === 'en' ? descEn : descUk;

  // Динамічне оновлення SEO тегів
  useEffect(() => {
    document.title = `${title} — BUSNET UA`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://busnetua.it${location.pathname}`);
  }, [title, desc, location.pathname]);

  const breadcrumbHome = langKey === 'it' ? 'Home' : langKey === 'en' ? 'Home' : 'Головна';
  const breadcrumbSection = langKey === 'it' ? 'Informazioni Legali' : langKey === 'en' ? 'Legal Information' : 'Правова інформація';

  return (
    <MainLayout>
      <div className="w-full max-w-full overflow-hidden bg-[#030712] text-slate-200 py-6 sm:py-12 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto space-y-6 sm:space-y-8 min-w-0">
          
          {/* Хлібні крихти */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto no-scrollbar py-1">
            <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1 shrink-0">
              <ArrowLeft size={14} />
              <span>{breadcrumbHome}</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 shrink-0">{breadcrumbSection}</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-bold truncate">{title}</span>
          </nav>

          {/* Головна сітка: Бокова навігація + Основний вміст */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0">
            
            {/* Сайдбар правових сторінок */}
            <aside className="lg:col-span-4 space-y-2 min-w-0">
              <div className="bg-[#0b1323]/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">
                  {breadcrumbSection}
                </p>
                <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar pb-1 lg:pb-0">
                  {navItems.map((item) => {
                    const isActive = activePath === item.path;
                    const itemLabel = langKey === 'it' ? item.labelIt : langKey === 'en' ? item.labelEn : item.labelUk;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-cyan-400 shrink-0' : 'text-slate-400 shrink-0'} />
                        <span className="truncate">{itemLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Інформаційна плашка про статус платформи */}
              <div className="bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/20 rounded-2xl p-4 text-[11px] text-slate-300 leading-relaxed hidden lg:block">
                <span className="font-bold text-cyan-400 block mb-1">BUSNET UA Marketplace</span>
                {langKey === 'it' ? (
                  <>Piattaforma tecnologica indipendente di prenotazione. I contratti di trasporto sono conclusi direttamente con i singoli vettori licenziatari.</>
                ) : langKey === 'en' ? (
                  <>Independent technology booking platform. Contracts of carriage are concluded directly with licensed transport operators.</>
                ) : (
                  <>Незалежна технологічна платформа онлайн-бронювання. Договори перевезення укладаються безпосередньо з ліцензованими перевізниками.</>
                )}
              </div>
            </aside>

            {/* Основний вміст документа */}
            <main className="lg:col-span-8 min-w-0">
              <article className="bg-[#0b1323]/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 backdrop-blur-xl space-y-6 text-slate-200 shadow-xl">
                <header className="border-b border-slate-800 pb-5">
                  <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight break-words">
                    {title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                    {desc}
                  </p>
                </header>

                <div className="legal-prose text-xs sm:text-sm leading-relaxed space-y-6 text-slate-300 break-words">
                  {children}
                </div>
              </article>
            </main>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LegalPageLayout;

