/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import Header from './Header';
import { Link } from 'react-router-dom';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useLanguage();

  const footerLinks = [
    { to: '/#about', label: t.footer.about },
    { to: '/#contacts', label: t.footer.contacts },
    { to: '/forum', label: t.footer.terms },
  ];

  return (
    <div className="min-h-dvh flex flex-col relative overflow-x-clip w-full max-w-full">
      <Header />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-busnet-border bg-busnet-bg/50 pt-8 sm:pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 text-center md:text-left">
          <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-xl font-bold neon-gradient-text uppercase">BUSNET UA</span>
            <p className="text-slate-500 text-xs sm:text-sm">{t.footer.rights}</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs sm:text-sm text-slate-400">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="min-h-[44px] inline-flex items-center hover:text-neon-cyan transition-colors px-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
