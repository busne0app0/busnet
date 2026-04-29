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

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
      
      {/* Footer Placeholder */}
      <footer className="py-12 border-t border-busnet-border bg-busnet-bg/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold neon-gradient-text uppercase">BUSNET UA</span>
            <p className="text-slate-500 text-sm">{t.footer.rights}</p>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <Link to="/forum" className="hover:text-neon-cyan transition-colors">{t.footer.about}</Link>
            <Link to="/forum" className="hover:text-neon-cyan transition-colors">{t.footer.contacts}</Link>
            <Link to="/forum" className="hover:text-neon-cyan transition-colors">{t.footer.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
