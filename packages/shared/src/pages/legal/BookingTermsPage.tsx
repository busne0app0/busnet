import React from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { CheckCircle2, CreditCard, Bus, AlertCircle } from 'lucide-react';

export default function BookingTermsPage() {
  const { langKey } = useLanguage();

  return (
    <LegalPageLayout
      activePath="/booking-terms"
      titleUk="Умови онлайн-бронювання квитків"
      titleEn="Online Booking Terms"
      titleIt="Condizioni di Prenotazione Online"
      descUk="Порядок оформлення, підтвердження та оплати квитків через платформу BUSNET UA"
      descEn="Procedure for ticket reservation, confirmation, and payment via BUSNET UA"
      descIt="Procedura di prenotazione, conferma ed emissione del titolo di viaggio tramite BUSNET UA"
    >
      {/* Ключовий акцент на бізнес-моделі без передоплати */}
      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
        <CreditCard size={20} className="shrink-0 mt-0.5 text-cyan-400" />
        <div>
          <strong>
            {langKey === 'it'
              ? 'Nessun addebito preventivo sulla piattaforma:'
              : langKey === 'en'
              ? 'No upfront online payment required:'
              : 'Бронювання без онлайн-передоплати:'}
          </strong>{' '}
          {langKey === 'it'
            ? 'BUSNET UA offre la prenotazione gratuita del posto. Il pagamento del prezzo del biglietto avviene al momento della partenza direttamente al personale del vettore.'
            : langKey === 'en'
            ? 'BUSNET UA provides free seat reservation. Ticket payment is settled upon departure directly with the operating carrier crew.'
            : 'Сервіс BUSNET UA надає можливість безкоштовно закріпити місце на рейсі. Оплата вартості проїзду здійснюється готівкою водієві або екіпажу при посадці.'}
        </div>
      </div>

      {langKey === 'it' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Procedura di Prenotazione</h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Scelta dell'itinerario:</strong> L'utente seleziona città di partenza, arrivo, data e tratta desiderata.</li>
              <li><strong>Inserimento dati:</strong> Vengono inseriti i dati anagrafici dei viaggiatori e i recapiti di contatto (telefono ed email).</li>
              <li><strong>Generazione del Voucher:</strong> Il sistema genera un codice identificativo di prenotazione e una carta d'imbarco con codice QR, consultabile in qualsiasi momento nell'Area Personale.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Validità della Prenotazione e Salita a Bordo</h2>
            <p>
              La prenotazione effettuata online costituisce blocco temporaneo del posto assegnato. Il passeggero è tenuto a presentarsi al punto di imbarco almeno 20 minuti prima dell'orario stabilito, esibendo al conducente il codice di prenotazione o il codice QR su smartphone.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Riduzioni e Tariffe Agevolate</h2>
            <p>
              Eventuali agevolazioni tariffarie per età (bambini, studenti, senior) devono essere selezionate in fase di prenotazione. L'equipaggio di bordo ha facoltà di richiedere l'esibizione di un valido documento di riconoscimento al momento del pagamento.
            </p>
          </section>
        </>
      ) : langKey === 'en' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Booking Procedure</h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Route selection:</strong> The traveler selects departure, arrival cities, dates, and preferred bus line.</li>
              <li><strong>Passenger details:</strong> Accurate personal identity and contact data (phone and email) are entered.</li>
              <li><strong>Voucher generation:</strong> The system issues an electronic booking ID and a QR boarding pass accessible in the Passenger Cabinet.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Booking Validity & Boarding Instructions</h2>
            <p>
              Your online reservation confirms seat availability with the carrier. Passengers should arrive at the boarding platform at least 20 minutes prior to departure and show their digital booking QR code to the driver.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Fare Discounts Verification</h2>
            <p>
              Age-related discounts (children, students, seniors) selected during booking are subject to identity verification by the crew upon boarding.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Етапи бронювання квитка</h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Вибір маршруту:</strong> пасажир обирає місто виїзду, прибуття, дату та перевізника;</li>
              <li><strong>Введення даних:</strong> заповнюються ім'я, прізвище, контактний номер телефону та email;</li>
              <li><strong>Підтвердження:</strong> система генерує посадковий талон з номером броні та QR-кодом, доступний у кабінеті пасажира.</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Посадка в автобус та оплата</h2>
            <p>
              Онлайн-бронювання закріплює за вами місце в автобусі. Пасажир повинен прибути до місця відправлення не пізніше ніж за 20 хвилин до виїзду та пред'явити водієві електронний талон на екрані смартфона.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Пільгові знижки</h2>
            <p>
              Якщо ви обрали пільговий тариф (дитячий, студентський або для пасажирів 60+), екіпаж автобуса має право перевірити документ, що підтверджує вік, при посадці.
            </p>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}

