import React from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Mail, Phone, Clock, MessageSquare, MapPin, Building2 } from 'lucide-react';

export default function ContactsPage() {
  const { langKey } = useLanguage();

  return (
    <LegalPageLayout
      activePath="/contacts"
      titleUk="Контакти та служба підтримки"
      titleEn="Contacts & Customer Support"
      titleIt="Contatti e Assistenza Clienti"
      descUk="Офіційні канали зв'язку з диспетчерською службою платформи BUSNET UA"
      descEn="Official contact channels for BUSNET UA customer and dispatcher support"
      descIt="Canali ufficiali di contatto e assistenza passeggeri della piattaforma BUSNET UA"
    >
      {/* Картки контактних каналів */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Phone size={16} />
            <span>{langKey === 'it' ? 'Assistenza Telefonica / WhatsApp' : langKey === 'en' ? 'Phone & WhatsApp Support' : 'Диспетчерська лінія'}</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-white">+39 [Da inserire / Телефон підтримки]</p>
          <p className="text-[11px] text-slate-400">
            {langKey === 'it' ? 'Attivo tutti i giorni per informazioni su orari e banchine' : langKey === 'en' ? 'Daily support for schedule and platform inquiries' : 'Щоденна допомога з посадкою та графіком рейсів'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Mail size={16} />
            <span>{langKey === 'it' ? 'Email Ufficiale' : langKey === 'en' ? 'Official Email' : 'Електронна пошта'}</span>
          </div>
          <p className="text-base sm:text-lg font-mono font-bold text-white">support@busnetua.it</p>
          <p className="text-[11px] text-slate-400">
            {langKey === 'it' ? 'Per richieste generali, reclami e informazioni' : langKey === 'en' ? 'For general inquiries and booking support' : 'Для загальних звернень, запитів та пропозицій'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Clock size={16} />
            <span>{langKey === 'it' ? 'Orari di Supporto' : langKey === 'en' ? 'Working Hours' : 'Графік роботи підтримки'}</span>
          </div>
          <p className="text-sm font-bold text-white">08:00 – 21:00 (CET / UTC+1)</p>
          <p className="text-[11px] text-slate-400">
            {langKey === 'it' ? 'Supporto chat attivo 7 giorni su 7' : langKey === 'en' ? '7 days a week customer assistance' : 'Працюємо без вихідних для вашого спокою'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <MessageSquare size={16} />
            <span>Telegram / Viber</span>
          </div>
          <p className="text-sm font-bold text-white">@busnet_support</p>
          <p className="text-[11px] text-slate-400">
            {langKey === 'it' ? 'Messaggistica diretta per urgenze prima della partenza' : langKey === 'en' ? 'Instant messaging for urgent departure questions' : 'Швидкий зв\'язок перед виїздом чи посадкою'}
          </p>
        </div>
      </div>

      {/* Офіційні реквізити для кореспонденції (Італія) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Building2 size={18} />
          <span>{langKey === 'it' ? 'Sede e Dati Societari' : langKey === 'en' ? 'Registered Office & Corporate Data' : 'Юридичні реквізити оператора'}</span>
        </div>
        <div className="space-y-1.5 text-slate-300 font-mono text-[11px] leading-relaxed">
          <p><strong>Operatore / Ragione Sociale:</strong> BUSNET UA [Da compilare dall'operatore / Власник компанії]</p>
          <p><strong>Sede Legale:</strong> [Indirizzo registrato in Italia / Юридична адреса компанії в Італії]</p>
          <p><strong>Partita IVA / Codice Fiscale:</strong> [P.IVA / CF]</p>
          <p><strong>PEC (Posta Elettronica Certificata):</strong> [pec@...]</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}

