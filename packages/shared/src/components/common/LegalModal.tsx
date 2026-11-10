import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Cookie } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'cookies';
}

const contentByLang = {
  uk: {
    title: 'Правова інформація BUSNET UA',
    subtitle: 'Технологічна платформа бронювання рейсів по Європі',
    tabTerms: 'Умови платформи',
    tabPrivacy: 'Конфіденційність (GDPR)',
    tabCookies: 'Файли Cookie',
    closeBtn: 'Зрозуміло',
    updatedDate: 'Оновлено: Листопад 2026',
    terms: {
      alert: '💡 Важливо для пасажирів: Сервіс BUSNET UA не стягує з вас жодних оплат чи комісій на сайті. Ми надаємо можливість безкоштовного онлайн-бронювання місця. Розрахунок здійснюється безпосередньо екіпажу перевізника при посадці в автобус.',
      h1: '1. Статус платформи',
      p1: "BUSNET UA є міжнародною технологічною онлайн-платформою, що об'єднує незалежних ліцензованих автобусних перевізників на маршрутах між містами України та країнами Європейського Союзу (Італія, Польща, Німеччина, Чехія, Австрія, Словаччина тощо).",
      h2: '2. Бронювання та оплата',
      p2: 'Платформа надає пасажиру право безкоштовного попереднього вибору та закріплення посадкового місця в автобусі. Договір перевезення укладається між пасажиром та фактичним ліцензованим перевізником у момент посадки та оплати квитка.',
      h3: '3. Відповідальність та скасування',
      p3: 'Пасажир має право безкоштовно скасувати або змінити бронювання не пізніше ніж за 24 години до часу відправлення рейсу через особистий кабінет або диспетчерську службу підтримки.'
    },
    privacy: {
      h1: 'Політика конфіденційності (GDPR Compliant)',
      p1: 'BUSNET UA суворо дотримується Загального регламенту захисту даних ЄС (GDPR 2016/679) та законодавства України про захист персональних даних.',
      h2: 'Які дані ми збираємо:',
      items: [
        "Ім'я та прізвище пасажира (для включення до міжнародного посадкового маніфесту);",
        'Контактний номер телефону (для SMS/Viber сповіщення водієм про номер платформи чи час виїзду);',
        'Адреса електронної пошти (для надсилання електронного посадкового талона).'
      ],
      h3: 'Зберігання та безпека',
      p3: 'Ми не продаємо і не передаємо ваші персональні дані стороннім рекламним мережам. Дані передаються виключно екіпажу обраного рейсу для здійснення посадки. Ви маєте право запросити повне видалення своїх даних через кабінет пасажира (Right to be Forgotten).'
    },
    cookies: {
      h1: 'Використання файлів Cookie',
      p1: 'Відповідно до Директиви ЄС про конфіденційність та електронні комунікації (ePrivacy), платформа використовує виключно технічні файли cookie, необхідні для збереження обраного маршруту та сесії користувача, а також аналітику Google Analytics 4 в режимі Google Consent Mode v2.',
      p2: 'Ви можете будь-якої миті змінити своє рішення або відкликати згоду на файли за допомогою налаштувань вашого браузера.'
    }
  },
  en: {
    title: 'Legal Information — BUSNET UA',
    subtitle: 'European Bus Travel & Booking Platform',
    tabTerms: 'Platform Terms',
    tabPrivacy: 'Privacy Policy (GDPR)',
    tabCookies: 'Cookie Policy',
    closeBtn: 'Got it',
    updatedDate: 'Updated: November 2026',
    terms: {
      alert: '💡 Important for Passengers: BUSNET UA does not collect any upfront payment or booking fees on the website. We offer free online seat reservation. Payment is made directly in cash or card to the bus crew upon boarding.',
      h1: '1. Platform Role & Status',
      p1: 'BUSNET UA operates as an international marketplace connecting passengers with licensed, independent bus carriers running scheduled routes across Europe (Ukraine, Italy, Poland, Germany, Czech Republic, Austria, Slovakia, etc.).',
      h2: '2. Reservation & Payment',
      p2: 'The platform provides passengers with the right to reserve seats online in advance. The contract of carriage is established directly between the passenger and the licensed operating carrier at the moment of boarding and payment.',
      h3: '3. Free Cancellation & Support',
      p3: 'Passengers have the right to cancel or amend their bookings free of charge up to 24 hours prior to scheduled departure directly through their Passenger Cabinet or Dispatcher Support.'
    },
    privacy: {
      h1: 'Privacy Policy (GDPR Compliant)',
      p1: 'BUSNET UA adheres strictly to the EU General Data Protection Regulation (GDPR 2016/679) and applicable European data protection legislation.',
      h2: 'Personal Data Collected:',
      items: [
        'Passenger First & Last Name (required for international passenger manifests);',
        'Contact phone number (for departure updates, platform number notifications by drivers);',
        'Email address (for digital ticket delivery and booking confirmations).'
      ],
      h3: 'Data Storage & Your Rights',
      p3: 'We never sell personal data to third-party ad networks. Data is shared strictly with the operating crew of the selected bus line to ensure boarding. You have the right to request deletion of your account and data at any time (Right to be Forgotten).'
    },
    cookies: {
      h1: 'Cookie Policy & Consent',
      p1: 'In compliance with the EU ePrivacy Directive, BUSNET UA uses essential technical cookies required for trip search and session preservation, alongside Google Analytics 4 in Google Consent Mode v2.',
      p2: 'You can modify your cookie settings or revoke consent anytime through your browser settings.'
    }
  },
  it: {
    title: 'Informazioni Legali — BUSNET UA',
    subtitle: 'Piattaforma Tecnologica di Prenotazione Autobus in Europa',
    tabTerms: 'Termini e Condizioni',
    tabPrivacy: 'Informativa Privacy (GDPR)',
    tabCookies: 'Informativa Cookie',
    closeBtn: 'Ho capito',
    updatedDate: 'Aggiornato: Novembre 2026',
    terms: {
      alert: '💡 Importante per i passeggeri: BUSNET UA non richiede alcun pagamento anticipato o commissione online. Offriamo la prenotazione gratuita del posto. Il pagamento del biglietto avviene direttamente in contanti o carta all\'autista al momento della salita a bordo.',
      h1: '1. Natura della Piattaforma',
      p1: 'BUSNET UA è una piattaforma tecnologica internazionale che mette in contatto i viaggiatori con vettori autorizzati e muniti di regolare licenza per rotte tra l\'Ucraina e i paesi dell\'Unione Europea (Italia, Polonia, Germania, Repubblica Ceca, Austria, Slovacchia, ecc.).',
      h2: '2. Prenotazione e Pagamento',
      p2: 'La piattaforma consente la prenotazione anticipata gratuita del posto. Il contratto di trasporto si perfeziona direttamente tra il passeggero e il vettore autorizzato al momento della salita a bordo e del relativo pagamento.',
      h3: '3. Cancellazione Gratuita',
      p3: 'Il passeggero ha il diritto di annullare o modificare gratuitamente la propria prenotazione fino a 24 ore prima della partenza tramite l\'Area Personale o il servizio clienti.'
    },
    privacy: {
      h1: 'Informativa sulla Privacy (Conforme al GDPR)',
      p1: 'BUSNET UA opera nel pieno rispetto del Regolamento Generale sulla Protezione dei Dati dell\'UE (GDPR 2016/679) e della normativa applicabile sulla protezione dei dati personali.',
      h2: 'Dati personali trattati:',
      items: [
        'Nome e cognome del passeggero (necessari per i manifesti passeggeri internazionali);',
        'Numero di telefono (per comunicazioni di servizio da parte dell\'autista riguardo banchina e orari);',
        'Indirizzo email (per la ricezione del biglietto digitale e riepilogo del viaggio).'
      ],
      h3: 'Conservazione e Diritti dell\'Interessato',
      p3: 'Non cediamo né vendiamo i dati ad agenzie pubblicitarie terze. I dati vengono condivisi esclusivamente con il personale del vettore del viaggio prescelto. È possibile esercitare in qualsiasi momento il diritto alla cancellazione dei dati (Diritto all\'Oblio).'
    },
    cookies: {
      h1: 'Informativa sull\'uso dei Cookie',
      p1: 'In conformità con la Direttiva UE ePrivacy, la piattaforma utilizza unicamente cookie tecnici necessari al corretto funzionamento della ricerca viaggi e della sessione, nonché Google Analytics 4 configurato in modalità Google Consent Mode v2.',
      p2: 'È possibile modificare le preferenze relative ai cookie in qualunque momento tramite le impostazioni del proprio browser.'
    }
  }
};

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, defaultTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cookies'>(defaultTab);
  const { langKey } = useLanguage();

  const currentLang = (langKey === 'it' ? 'it' : langKey === 'en' ? 'en' : 'uk') as keyof typeof contentByLang;
  const c = contentByLang[currentLang];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0b1323] border border-cyan-500/30 rounded-3xl shadow-2xl p-5 sm:p-8 z-10 my-auto text-slate-200 max-h-[90dvh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  {c.title}
                </h2>
                <p className="text-[11px] text-slate-400 truncate">{c.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors shrink-0 ml-2"
              aria-label="Закрити"
            >
              <X size={20} />
            </button>
          </div>

          {/* Таби */}
          <div className="flex gap-2 pt-4 pb-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
            {[
              { id: 'terms', label: c.tabTerms, icon: FileText },
              { id: 'privacy', label: c.tabPrivacy, icon: ShieldCheck },
              { id: 'cookies', label: c.tabCookies, icon: Cookie },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Текстовий контент з високим E-E-A-T рейтингом для Google/AI */}
          <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed custom-scrollbar">
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl text-cyan-300 text-xs leading-relaxed">
                  {c.terms.alert}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.terms.h1}</h3>
                <p>{c.terms.p1}</p>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.terms.h2}</h3>
                <p>{c.terms.p2}</p>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.terms.h3}</h3>
                <p>{c.terms.p3}</p>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-white">{c.privacy.h1}</h3>
                <p>{c.privacy.p1}</p>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.privacy.h2}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {c.privacy.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>

                <h3 className="text-sm sm:text-base font-bold text-white">{c.privacy.h3}</h3>
                <p>{c.privacy.p3}</p>
              </div>
            )}

            {activeTab === 'cookies' && (
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-white">{c.cookies.h1}</h3>
                <p>{c.cookies.p1}</p>
                <p>{c.cookies.p2}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
            <span>{c.updatedDate}</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-colors cursor-pointer"
            >
              {c.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalModal;

