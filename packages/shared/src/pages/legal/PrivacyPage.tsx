import React from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { ShieldCheck, UserCheck, Lock, Building2 } from 'lucide-react';

export default function PrivacyPage() {
  const { langKey } = useLanguage();

  return (
    <LegalPageLayout
      activePath="/privacy"
      titleUk="Політика конфіденційності"
      titleEn="Privacy Policy"
      titleIt="Informativa sulla Privacy"
      descUk="Інформація про обробку та захист персональних даних користувачів згідно з GDPR"
      descEn="Information on personal data processing and privacy rights in compliance with GDPR"
      descIt="Informativa sul trattamento dei dati personali ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR)"
    >
      {/* Titolare del Trattamento (Італія) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Building2 size={16} />
          <span>{langKey === 'it' ? 'Titolare del Trattamento dei Dati' : langKey === 'en' ? 'Data Controller Information' : 'Володілець персональних даних'}</span>
        </div>
        <div className="space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed">
          <p><strong>Titolare / Ragione Sociale:</strong> BUSNET UA [Da compilare dall'operatore / Власник компанії]</p>
          <p><strong>Sede Legale:</strong> [Indirizzo registrato in Italia / Юридична адреса в Італії]</p>
          <p><strong>Partita IVA / Codice Fiscale:</strong> [P.IVA / CF]</p>
          <p><strong>Email DPO / Privacy:</strong> privacy@busnetua.it</p>
        </div>
      </div>

      {langKey === 'it' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Premessa e Base Giuridica</h2>
            <p>
              La presente informativa è resa ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR). BUSNET UA tutela la riservatezza dei dati personali dei propri utenti garantendo che il trattamento sia improntato ai principi di correttezza, liceità, trasparenza e tutela dei diritti.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Categorie di Dati Raccolti</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Dati anagrafici:</strong> nome e cognome del passeggero (necessari per il manifesto di viaggio internazionale);</li>
              <li><strong>Dati di contatto:</strong> numero di telefono mobile (per comunicazioni operative da parte del vettore/autista) ed indirizzo email (per l'invio del riepilogo di prenotazione);</li>
              <li><strong>Data di nascita:</strong> richiesta esclusivamente qualora il passeggero intenda beneficiare di riduzioni tariffarie per età (bambini, studenti o over 60);</li>
              <li><strong>Dati tecnici:</strong> indirizzo IP anonimizzato e dati di navigazione strettamente tecnici.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Finalità del Trattamento</h2>
            <p>
              I dati personali sono trattati unicamente per consentire l'esecuzione della richiesta di prenotazione, la trasmissione dei nominativi al vettore incaricato del viaggio e l'adempimento degli obblighi di legge.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Comunicazione dei Dati a Terzi</h2>
            <p>
              I dati personali del passeggero non vengono ceduti a scopi commerciali o pubblicitari. Vengono comunicati esclusivamente al personale del vettore operativo titolare della linea prescelta al fine esclusivo di consentire la salita a bordo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Diritti dell'Interessato (Artt. 15-22 GDPR)</h2>
            <p>
              In qualsiasi momento l'utente può esercitare i propri diritti di accesso, rettifica, cancellazione (diritto all'oblio), limitazione e opposizione al trattamento inviando una comunicazione a privacy@busnetua.it o tramite la gestione del proprio profilo.
            </p>
          </section>
        </>
      ) : langKey === 'en' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Introduction and Legal Basis</h2>
            <p>
              This Privacy Policy is provided in accordance with Article 13 of Regulation (EU) 2016/679 (GDPR). BUSNET UA ensures that personal data processing adheres strictly to lawful, fair, transparent, and secure principles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Categories of Data Collected</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Identity data:</strong> First name and last name of each passenger (required for cross-border passenger manifests);</li>
              <li><strong>Contact data:</strong> Mobile phone number (for departure notices by bus crew) and email address (for electronic ticket vouchers);</li>
              <li><strong>Date of birth:</strong> Requested strictly when age-based fare discounts are selected (child, student, senior discounts);</li>
              <li><strong>Technical data:</strong> Anonymized IP addresses and essential technical logs.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Purposes of Processing</h2>
            <p>
              Personal data is collected strictly to generate seat bookings, transmit required manifest records to the operating carrier, and fulfill statutory transport obligations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Third-Party Data Sharing</h2>
            <p>
              We do not sell personal data to marketing networks. Passenger information is transmitted solely to the authorized operating carrier of the designated journey for boarding validation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. User Privacy Rights (Articles 15-22 GDPR)</h2>
            <p>
              Users may exercise their rights of access, rectification, erasure (Right to be Forgotten), and restriction of processing by contacting privacy@busnetua.it or directly inside their Passenger Cabinet.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Правові засади захисту даних</h2>
            <p>
              Ця Політика розроблена відповідно до норм Загального регламенту захисту даних ЄС (GDPR 2016/679) та законодавства про захист персональних даних.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Які дані збираються</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Дані пасажирів:</strong> ім'я та прізвище (необхідні для формування міжнародного маніфесту рейсу);</li>
              <li><strong>Контактні дані:</strong> номер мобільного телефону (для зв'язку водія чи диспетчера) та email (для доставки посадкового талона);</li>
              <li><strong>Дата народження:</strong> запитується виключно у разі вибору пільгового тарифу (діти, студенти, пенсіонери);</li>
              <li><strong>Технічні дані:</strong> анонімізована IP-адреса та сесійні ідентифікатори.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Мета та передача даних</h2>
            <p>
              Збір даних здійснюється виключно з метою бронювання місця на рейсі. Дані передаються лише ліцензованому перевізнику, що виконує обраний рейс. Платформа не передає дані рекламним посередникам.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Права користувачів</h2>
            <p>
              Ви маєте право на доступ до своїх персональних даних, їх виправлення, відкликання згоди та повне видалення (Right to be Forgotten) шляхом направлення запиту на privacy@busnetua.it або через кабінет пасажира.
            </p>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}

