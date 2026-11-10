import React from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RefundPolicyPage() {
  const { langKey } = useLanguage();

  return (
    <LegalPageLayout
      activePath="/refund-policy"
      titleUk="Правила скасування та повернення"
      titleEn="Cancellation & Refund Policy"
      titleIt="Politica di Cancellazione e Rimborsi"
      descUk="Інформація про порядок скасування бронювань та повернення коштів пасажирам"
      descEn="Information on booking cancellation procedures and ticket refund terms"
      descIt="Condizioni e modalità di cancellazione della prenotazione e rimborso dei biglietti"
    >
      {/* Інформаційний блок про відсутність онлайн-передоплати */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
          <CheckCircle2 size={16} />
          <span>
            {langKey === 'it'
              ? 'Cancellazione Gratuita Online'
              : langKey === 'en'
              ? 'Free Online Booking Cancellation'
              : 'Безкоштовне скасування онлайн-бронювання'}
          </span>
        </div>
        <p className="text-slate-300">
          {langKey === 'it'
            ? 'Poiché la piattaforma BUSNET UA non richiede alcun pagamento anticipato con carta di credito sul sito, la cancellazione della prenotazione online non comporta alcuna penale o trattenuta da parte della piattaforma.'
            : langKey === 'en'
            ? 'Because BUSNET UA does not collect advance credit card payments online, cancelling a seat reservation involves no financial penalties or platform deductions.'
            : 'Оскільки сервіс BUSNET UA не стягує онлайн-передоплати на сайті, скасування броні в кабінеті пасажира не тягне за собою жодних штрафів чи списань з боку платформи.'}
        </p>
      </div>

      {langKey === 'it' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Modalità di Cancellazione della Prenotazione</h2>
            <p>
              Qualora il passeggero sia impossibilitato a partire, è pregato di procedere alla cancellazione della prenotazione con congruo anticipo (consigliato almeno 24 ore prima dell'orario di partenza), per consentire la riassegnazione del posto ad altri utenti in lista d'attesa.
            </p>
            <p>
              La cancellazione può essere effettuata:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>In autonomia, accedendo all'Area Personale (sezione "I Miei Biglietti" → pulsante "Cancella");</li>
              <li>Contattando il servizio di supporto e assistenza passeggeri via email o messaggistica istantanea.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Rimborsi dei Biglietti Pagati Direttamente al Vettore</h2>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p className="font-bold text-amber-400">Nota sulle transazioni dirette:</p>
              <p>
                Qualora un pagamento sia avvenuto direttamente tra il passeggero ed il vettore operativo (es. bonifico preventivo, acquisto in agenzia o pagamento all'imbarco), le condizioni di eventuale rimborso o cambio data sono disciplinate esclusivamente dal regolamento interno e dalle condizioni generali di trasporto del singolo vettore licenziatario.
              </p>
            </div>
          </section>
        </>
      ) : langKey === 'en' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. How to Cancel a Reservation</h2>
            <p>
              If your travel plans change, we kindly ask passengers to cancel their reservation promptly (recommended at least 24 hours prior to departure) to release seats for other travelers.
            </p>
            <p>
              Cancellation can be completed:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Directly inside your Passenger Cabinet ("My Tickets" tab → "Cancel" action);</li>
              <li>By contacting Dispatcher Customer Support via email or instant messaging.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Refunds for Direct Carrier Payments</h2>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p className="font-bold text-amber-400">Direct Transaction Clause:</p>
              <p>
                In cases where fares were paid directly to the operating transport company (e.g. advance bank wire or physical terminal purchase), refund claims and rescheduling rules are governed exclusively by the specific carrier's terms of carriage.
              </p>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Порядок скасування броні</h2>
            <p>
              Якщо ваші плани змінилися, просимо завчасно скасувати бронювання (рекомендовано не пізніше ніж за 24 години до часу виїзду), щоб водій міг запропонувати місце іншим пасажирам.
            </p>
            <p>
              Скасувати замовлення можна:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Самостійно в кабінеті пасажира (вкладка «Мої квитки» → кнопка «Скасувати»);</li>
              <li>Звернувшись до диспетчерської служби підтримки через телефон або месенджери.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Повернення коштів при розрахунку з перевізником</h2>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
              <p className="font-bold text-amber-400">Правила прямих розрахунків:</p>
              <p>
                Якщо оплата проїзду здійснювалася пасажиром безпосередньо перевізнику (наприклад, готівкою при посадці або передплатою на рахунок перевізника), порядок повернення коштів у разі форс-мажору визначається внутрішніми правилами конкретного ліцензованого перевізника.
              </p>
            </div>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}

