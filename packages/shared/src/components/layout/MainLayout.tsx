/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import Header from './Header';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { LegalModal } from '../common/LegalModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

/* ------------------------------------------------------------------
 * НАЛАШТУВАННЯ ФУТЕРА. Заповни тут адреси, більше нічого міняти не треба.
 * Зараз стоять ЗАГЛУШКИ ('#' та '/#...'): замінюй їх на справжні адреси.
 * Порожній рядок '' означає «цієї сторінки/мережі немає»: такий пункт
 * автоматично не показується, а група без жодного пункту ховається цілком.
 * ------------------------------------------------------------------ */
const SOCIAL_URLS = {
  telegram: '#',   // TODO: встав посилання, напр. 'https://t.me/busnet_ua'
  instagram: '#',  // TODO: напр. 'https://instagram.com/busnet.ua'
  facebook: '#',   // TODO: напр. 'https://facebook.com/busnet.ua'
  youtube: '#',    // TODO: напр. 'https://youtube.com/@busnet'
};

const PATHS = {
  about: '/#about',
  contacts: '/contacts',
  connect: '/connect',
  forum: '/connect/community',
  routes: '/',
  help: '/contacts',
  refunds: '/refund-policy',
  bookingTerms: '/booking-terms',
  partner: '/#partners',
  carrierCabinet: '/#carrier',
  agents: '/#agents',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
};

/* ---------- Іконки соцмереж (лінійні, у стилі lucide) ---------- */
type IconProps = { className?: string };
const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const TelegramIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
const InstagramIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const FacebookIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const YoutubeIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useLanguage();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; tab: 'terms' | 'privacy' | 'cookies' }>({
    isOpen: false,
    tab: 'terms'
  });

  // Нові підписи беруться з перекладів (footer.*), поки їх немає, діє український запасний варіант
  // Приводимо до any, щоб TypeScript не сварився на нові ключі перекладу
  const f = t.footer as any;
  const h = t.header as any;

  const groups = [
    {
      id: 'company',
      title: f?.groupCompany || 'BUSNET',
      links: [
        { label: t.footer.about, to: PATHS.about },
        { label: t.footer.contacts, to: PATHS.contacts },
        { label: 'BUSNET CONNECT', to: PATHS.connect },
      ],
    },
    {
      id: 'passengers',
      title: f?.groupPassengers || 'Пасажирам',
      links: [
        { label: t.header.routes, to: PATHS.routes },
        { label: f?.help || 'Допомога', to: PATHS.help },
        { label: f?.refunds || 'Повернення коштів', to: PATHS.refunds },
      ],
    },
    {
      id: 'carriers',
      title: f?.groupCarriers || 'Перевізникам',
      links: [
        { label: f?.becomePartner || t.header.partners, to: PATHS.partner },
        { label: f?.carrierCabinet || 'Кабінет перевізника', to: PATHS.carrierCabinet },
        { label: f?.agentProgram || 'Агентам', to: PATHS.agents },
      ],
    },
    {
      id: 'info',
      title: f?.groupInfo || 'Інформація',
      links: [
        { label: t.footer.terms, to: PATHS.terms },
        { label: t.footer.privacy, to: PATHS.privacy },
        { label: t.footer.cookies, to: PATHS.cookies },
        { label: f?.bookingTerms || 'Правила бронювання', to: PATHS.bookingTerms },
        { label: f?.refundPolicy || 'Скасування та повернення', to: PATHS.refunds },
      ],
    },
  ]
    .map((g) => ({ ...g, links: g.links.filter((l) => l.to) }))
    .filter((g) => g.links.length > 0);

  const socials = [
    { name: 'Telegram', href: SOCIAL_URLS.telegram, Icon: TelegramIcon },
    { name: 'Instagram', href: SOCIAL_URLS.instagram, Icon: InstagramIcon },
    { name: 'Facebook', href: SOCIAL_URLS.facebook, Icon: FacebookIcon },
    { name: 'YouTube', href: SOCIAL_URLS.youtube, Icon: YoutubeIcon },
  ].filter((s) => s.href);

  return (
    <div className="min-h-dvh flex flex-col relative overflow-x-clip w-full max-w-full">
      <Header />
      <main className="flex-1 w-full flex flex-col pt-16 md:pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-busnet-border bg-busnet-bg/50 pt-4 sm:pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-12">

            {/* Бренд і соцмережі */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <span className="text-xl font-bold neon-gradient-text uppercase">BUSNET UA</span>
              {socials.length > 0 && (
                <div className="flex items-center gap-2.5">
                  {socials.map(({ name, href, Icon }) => (
                    <a
                      key={name}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      aria-label={name}
                      className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/40 active:text-neon-cyan transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Групи посилань: на телефоні акордеон, від md: колонки */}
            {groups.length > 0 && (
              <nav
                aria-label="Footer navigation"
                className="w-full md:w-auto md:grid md:grid-flow-col md:auto-cols-fr md:gap-x-12 lg:gap-x-16 divide-y divide-white/5 md:divide-y-0 border-y border-white/5 md:border-0"
              >
                {groups.map((g) => {
                  const open = openGroup === g.id;
                  return (
                    <div key={g.id}>
                      {/* Телефон: заголовок-кнопка */}
                      <button
                        type="button"
                        onClick={() => setOpenGroup(open ? null : g.id)}
                        aria-expanded={open}
                        aria-controls={`footer-group-${g.id}`}
                        className="md:hidden w-full min-h-12 flex items-center justify-between text-left text-sm font-bold uppercase tracking-wider text-slate-200 [-webkit-tap-highlight-color:transparent]"
                      >
                        {g.title}
                        <ChevronDown
                          size={18}
                          aria-hidden="true"
                          className={`text-neon-cyan/80 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {/* Комп'ютер: звичайний заголовок */}
                      <h3 className="hidden md:block mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-200">
                        {g.title}
                      </h3>

                      <ul
                        id={`footer-group-${g.id}`}
                        className={`${open ? 'block pb-2' : 'hidden'} md:block`}
                      >
                        {g.links.map((link: any) => (
                          <li key={link.label}>
                            {link.action ? (
                              <button
                                type="button"
                                onClick={link.action}
                                className="min-h-[44px] md:min-h-0 md:py-1.5 inline-flex items-center text-[13px] sm:text-sm text-slate-300 sm:text-slate-400 hover:text-neon-cyan active:text-neon-cyan transition-colors text-left cursor-pointer"
                              >
                                {link.label}
                              </button>
                            ) : (
                              <Link
                                to={link.to}
                                className="min-h-[44px] md:min-h-0 md:py-1.5 inline-flex items-center text-[13px] sm:text-sm text-slate-300 sm:text-slate-400 hover:text-neon-cyan active:text-neon-cyan transition-colors"
                              >
                                {link.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </nav>
            )}
          </div>

          <p className="mt-5 sm:mt-8 text-center md:text-left text-slate-400 sm:text-slate-500 text-xs sm:text-sm">
            {t.footer.rights}
          </p>
        </div>
      </footer>

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        defaultTab={legalModal.tab}
      />
    </div>
  );
}