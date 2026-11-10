import React, { useState } from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Cookie, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CookiesPage() {
  const { langKey } = useLanguage();
  const [currentConsent, setCurrentConsent] = useState<string>(() => {
    try {
      return localStorage.getItem('busnet_cookie_consent') || 'not_set';
    } catch {
      return 'not_set';
    }
  });

  const handleUpdateConsent = (status: 'granted' | 'denied') => {
    try {
      localStorage.setItem('busnet_cookie_consent', status);
      setCurrentConsent(status);
    } catch {}

    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('consent', 'update', {
        analytics_storage: status,
        ad_storage: status,
        ad_user_data: status,
        ad_personalization: status,
      });
    }

    toast.success(
      langKey === 'it'
        ? 'Preferenze cookie aggiornate'
        : langKey === 'en'
        ? 'Cookie preferences updated'
        : 'Налаштування файлів cookie оновлено'
    );
  };

  return (
    <LegalPageLayout
      activePath="/cookies"
      titleUk="Політика використання файлів Cookie"
      titleEn="Cookie Policy"
      titleIt="Informativa sui Cookie"
      descUk="Відомості про використання технічних та аналітичних файлів cookie на платформі BUSNET UA"
      descEn="Information on technical and analytics cookies used on the BUSNET UA platform"
      descIt="Informativa estesa sull'uso dei cookie ai sensi della Direttiva ePrivacy e del GDPR"
    >
      {/* Інтерактивний блок керування згодою */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
          <Cookie size={16} />
          <span>{langKey === 'it' ? 'Gestione delle Preferenze Cookie' : langKey === 'en' ? 'Manage Cookie Preferences' : 'Керування файлами cookie'}</span>
        </div>
        <p className="text-xs text-slate-300">
          {langKey === 'it'
            ? `Stato attuale del consenso: `
            : langKey === 'en'
            ? `Current consent status: `
            : `Поточний статус згоди: `}
          <strong className="text-white uppercase font-mono">
            {currentConsent === 'granted'
              ? (langKey === 'it' ? 'Tutti accettati' : langKey === 'en' ? 'All accepted' : 'Прийнято всі')
              : currentConsent === 'denied'
              ? (langKey === 'it' ? 'Solo tecnici' : langKey === 'en' ? 'Technical only' : 'Тільки необхідні')
              : (langKey === 'it' ? 'Non impostato' : langKey === 'en' ? 'Not set' : 'Не визначено')}
          </strong>
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleUpdateConsent('granted')}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            {langKey === 'it' ? 'Accetta tutti i cookie' : langKey === 'en' ? 'Accept all cookies' : 'Прийняти всі'}
          </button>
          <button
            type="button"
            onClick={() => handleUpdateConsent('denied')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            {langKey === 'it' ? 'Rifiuta non necessari' : langKey === 'en' ? 'Refuse non-essential' : 'Тільки необхідні'}
          </button>
        </div>
      </div>

      {langKey === 'it' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Cosa sono i Cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell'utente, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla successiva visita.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Tipologie di Cookie Utilizzati</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Cookie Tecnici e di Navigazione (Strettamente Necessari)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Consentono il corretto funzionamento del sito, la conservazione della lingua prescelta e la gestione della sessione di prenotazione. Non richiedono il preventivo consenso dell'utente.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Cookie Analitici (Google Analytics 4 con Consent Mode v2)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Utilizzati per raccogliere informazioni in forma aggregata sul numero di visitatori e su come questi navigano il sito. Il tracciamento non viene attivato fino all'esplicito consenso dell'utente.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Come disabilitare i cookie dal browser</h2>
            <p>
              L'utente può gestire le preferenze relative ai cookie direttamente all'interno del proprio browser (Chrome, Safari, Firefox, Edge) ed impedire che terze parti possano installarne.
            </p>
          </section>
        </>
      ) : langKey === 'en' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. What are Cookies</h2>
            <p>
              Cookies are small text files that websites send to the user's device during navigation to retain preferences and ensure efficient functionality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Categories of Cookies Used</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Technical Cookies (Strictly Necessary)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Required for core platform navigation, language switcher persistence, and session verification. These do not require user consent.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Analytics Cookies (Google Analytics 4 in Consent Mode v2)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Provide anonymized aggregate metrics about website traffic. These cookies are strictly blocked until the user grants explicit consent.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Managing Preferences via Browser</h2>
            <p>
              You can configure your browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge) to accept, block, or delete cookies at any time.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Що таке файли Cookie</h2>
            <p>
              Файли cookie — це невеликі текстові файли, які зберігаються у вашому браузері для забезпечення коректної роботи сайту та збереження параметрів пошуку.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Які типи cookie ми використовуємо</h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Технічні (Обов'язкові)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Забезпечують вибір мови, авторизацію в кабінеті пасажира та збереження параметрів бронювання. Вони працюють без попередньої згоди.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="font-bold text-white text-xs">Аналітичні (Google Analytics 4 у режимі Consent Mode v2)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Допомагають аналізувати відвідуваність сторінок в анонімному режимі. Аналітика не запускається до надання вашої згоди.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Відкликання згоди</h2>
            <p>
              Ви можете в будь-який момент змінити свій вибір за допомогою панелі керування вгорі цієї сторінки або через налаштування вашого браузера.
            </p>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}

