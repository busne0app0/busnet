import React from 'react';
import { LegalPageLayout } from '@busnet/shared/components/layout/LegalPageLayout';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { ShieldAlert, Building2 } from 'lucide-react';

export default function TermsPage() {
  const { langKey } = useLanguage();

  return (
    <LegalPageLayout
      activePath="/terms"
      titleUk="Умови використання платформи"
      titleEn="Terms and Conditions of Use"
      titleIt="Termini e Condizioni di Utilizzo"
      descUk="Правила доступу та користування онлайн-сервісом бронювання BUSNET UA"
      descEn="Rules and conditions governing the use of the BUSNET UA travel platform"
      descIt="Condizioni generali che regolano l'accesso e l'uso dei servizi BUSNET UA"
    >
      {/* Юридичні реквізити власника (Італія) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Building2 size={16} />
          <span>{langKey === 'it' ? 'Dati del Gestore della Piattaforma' : langKey === 'en' ? 'Platform Operator Information' : 'Відомості про оператора платформи'}</span>
        </div>
        <div className="space-y-1 text-slate-300 font-mono text-[11px] leading-relaxed">
          <p><strong>Denominazione / Ragione Sociale:</strong> BUSNET UA [Da compilare dall'operatore / Власник компанії]</p>
          <p><strong>Sede Legale (Італія):</strong> [Indirizzo registrato in Italia / Вказується юридична адреса в Італії]</p>
          <p><strong>Partita IVA / Codice Fiscale:</strong> [P.IVA / CF da inserire]</p>
          <p><strong>Registro delle Imprese:</strong> [Camera di Commercio di riferimento]</p>
          <p><strong>PEC / Email di contatto:</strong> info@busnetua.it</p>
        </div>
      </div>

      {langKey === 'it' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Oggetto e Ambito di Applicazione</h2>
            <p>
              I presenti Termini e Condizioni disciplinano l'accesso e l'utilizzo della piattaforma digitale BUSNET UA (di seguito "Piattaforma").
              L'accesso ai servizi implica l'accettazione integrale delle presenti condizioni da parte dell'utente.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Ruolo della Piattaforma e Assenza di Servizi di Trasporto Diretti</h2>
            <p>
              BUSNET UA opera esclusivamente come intermediario tecnologico e piattaforma di incontro tra i passeggeri e i vettori di trasporto passeggeri titolari di regolari licenze nazionali e internazionali.
            </p>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <p>
                <strong>Avvertenza Legale:</strong> BUSNET UA non è un vettore di trasporto né un'agenzia di viaggi organizzatrice. Il contratto di trasporto è stipulato direttamente ed esclusivamente tra il passeggero e la società di trasporto designata.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Gratuita della Prenotazione e Pagamento del Servizio</h2>
            <p>
              La ricerca degli orari e la prenotazione del posto tramite la Piattaforma sono fornite gratuitamente all'utente, senza alcuna commissione di prenotazione addebitata da BUSNET UA sul sito web.
              L'importo del biglietto di viaggio viene corrisposto dall'utente direttamente all'equipaggio del vettore al momento della salita a bordo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Limitazione di Responsabilità</h2>
            <p>
              BUSNET UA non è responsabile per la corretta esecuzione della prestazione di trasporto, per ritardi, cancellazioni, perdite di coincidenze o danni ai bagagli, i quali rimangono sotto la diretta responsabilità del vettore operativo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Legge Applicabile e Foro Competente</h2>
            <p>
              I presenti termini sono regolati dalla legge italiana e dalla normativa dell'Unione Europea applicabile. Per le controversie con i consumatori residenti nell'Unione Europea resta salvo il foro inderogabile del consumatore.
            </p>
          </section>
        </>
      ) : langKey === 'en' ? (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Scope and Object</h2>
            <p>
              These Terms and Conditions govern the access and use of the BUSNET UA digital platform (hereinafter the "Platform").
              Accessing or using the platform implies full and unconditional acceptance of these conditions by the user.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Platform Role & Intermediary Status</h2>
            <p>
              BUSNET UA operates solely as an independent technology marketplace connecting travelers with licensed, independent passenger bus carriers across Europe.
            </p>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <p>
                <strong>Legal Notice:</strong> BUSNET UA is not a direct transport carrier. The contract of carriage is established directly between the passenger and the operating bus carrier.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Reservation and Payment Terms</h2>
            <p>
              Route search and seat reservations via BUSNET UA are provided without upfront reservation fees on the website.
              The ticket fare is paid directly by the passenger to the carrier crew upon boarding the bus.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Limitation of Liability</h2>
            <p>
              BUSNET UA shall not be liable for carriage operations, scheduled delays, line cancellations, or luggage safety, which remain under the exclusive liability of the designated licensed carrier.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Applicable Law & Jurisdiction</h2>
            <p>
              These Terms are governed by Italian law and applicable European Union regulations. Mandatory consumer protection provisions under applicable EU law remain unaffected.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Загальні положення</h2>
            <p>
              Ці Умови регулюють порядок доступу та користування онлайн-платформою BUSNET UA (надалі — «Платформа»).
              Користуючись сервісом пошуку та бронювання, ви погоджуєтеся з цими Умовами в повному обсязі.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Статус сервісу та взаємодія з перевізниками</h2>
            <p>
              BUSNET UA є технологічним інформаційним сервісом, що надає пасажирам доступ до розкладу та бронювання місць на рейсах незалежних ліцензованих автобусних перевізників між містами України та країнами Європейського Союзу.
            </p>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <p>
                <strong>Правове застереження:</strong> BUSNET UA не є безпосереднім автомобільним перевізником. Договір міжнародного або внутрішнього перевезення виникає виключно між пасажиром та фактичним ліцензованим перевізником.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Оплата та безкоштовне бронювання</h2>
            <p>
              Платформа не стягує з пасажирів попередньої оплати за послугу бронювання на веб-сайті.
              Розрахунок за квиток здійснюється безпосередньо екіпажу автобуса при посадці.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Розмежування відповідальності</h2>
            <p>
              Фактичне виконання графіка перевезення, технічний стан транспортних засобів, безпека перевезення багажу та дотримання митних правил покладаються на ліцензованого перевізника, визначеного в посадковому документі.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">5. Застосовне право</h2>
            <p>
              Платформа адмініструється відповідно до законодавства Італійської Республіки та регламентів Європейського Союзу з дотриманням обов'язкових норм захисту прав споживачів.
            </p>
          </section>
        </>
      )}
    </LegalPageLayout>
  );
}

