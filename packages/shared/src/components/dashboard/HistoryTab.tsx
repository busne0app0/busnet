import React from 'react';
import { History, CheckCircle2, XCircle, RotateCcw, HelpCircle } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface Ticket {
  id: string;
  route: string;
  date: string;
  price: number | string;
  currency?: string;
  status: string;
}

interface HistoryTabProps {
  tickets: Ticket[];
  loading?: boolean;
  setActiveTab?: (id: string) => void;
}

const STATUS_STYLE: Record<string, { color: string; Icon: React.ElementType }> = {
  completed: { color: 'text-emerald-400', Icon: CheckCircle2 },
  cancelled: { color: 'text-rose-400', Icon: XCircle },
  refunded: { color: 'text-amber-400', Icon: RotateCcw },
  unknown: { color: 'text-slate-400', Icon: HelpCircle },
};

const HistoryTab: React.FC<HistoryTabProps> = ({ tickets, loading = false, setActiveTab }) => {
  const { language } = useLanguage();
  const lang = (language || 'UK').toUpperCase();
  const pick = (uk: string, en: string, it: string) => (lang === 'EN' ? en : lang === 'IT' ? it : uk);
  const locale = lang === 'EN' ? 'en-GB' : lang === 'IT' ? 'it-IT' : 'uk-UA';

  const l = {
    subtitle: pick('Ваші завершені та скасовані поїздки', 'Your completed and cancelled trips', 'I tuoi viaggi completati e annullati'),
    route: pick('Маршрут', 'Route', 'Tratta'),
    date: pick('Дата', 'Date', 'Data'),
    status: pick('Статус', 'Status', 'Stato'),
    price: pick('Ціна', 'Price', 'Prezzo'),
    completed: pick('Завершено', 'Completed', 'Completato'),
    cancelled: pick('Скасовано', 'Cancelled', 'Annullato'),
    refunded: pick('Повернено кошти', 'Refunded', 'Rimborsato'),
    unknown: pick('Інший статус', 'Other status', 'Altro stato'),
    emptyTitle: pick('Історія поки порожня', 'No trip history yet', 'Nessun viaggio nello storico'),
    emptyHint: pick(
      'Завершені та скасовані поїздки з’являться тут. Активні квитки дивіться у вкладці «Мої квитки».',
      'Completed and cancelled trips will appear here. Active tickets are in the “My Tickets” tab.',
      'I viaggi completati e annullati appariranno qui. I biglietti attivi sono in “I Miei Biglietti”.'
    ),
    findTrip: pick('Знайти рейс', 'Find a trip', 'Cerca una corsa'),
  };

  const history = tickets.filter((t) => t.status !== 'active');

  const formatPrice = (p: number | string, cur?: string) => {
    const n = Number(p);
    const formatted = Number.isFinite(n)
      ? n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';
    return `${formatted} ${cur || '€'}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const key = STATUS_STYLE[status] ? status : 'unknown';
    const { color, Icon } = STATUS_STYLE[key];
    return (
      <div className={`flex items-center gap-1.5 text-xs font-bold ${color}`}>
        <Icon size={14} aria-hidden="true" />
        <span>{l[key as keyof typeof l]}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">{l.subtitle}</p>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-md">
        {history.length > 0 ? (
          <>
            {/* Мобільні картки */}
            <ul className="divide-y divide-slate-800 md:hidden">
              {history.map((h) => (
                <li key={h.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-white text-sm break-words flex-1 min-w-0">{h.route}</p>
                    <span className="text-sm font-mono font-bold text-cyan-300 shrink-0 tabular-nums">
                      {formatPrice(h.price, h.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>{h.date}</span>
                    <StatusBadge status={h.status} />
                  </div>
                </li>
              ))}
            </ul>

            {/* Десктопна таблиця */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th scope="col" className="py-4 px-6 text-xs font-bold uppercase tracking-wider">{l.route}</th>
                    <th scope="col" className="py-4 px-6 text-xs font-bold uppercase tracking-wider">{l.date}</th>
                    <th scope="col" className="py-4 px-6 text-xs font-bold uppercase tracking-wider">{l.status}</th>
                    <th scope="col" className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-right">{l.price}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-4 px-6 font-bold text-white text-sm">{h.route}</td>
                      <td className="py-4 px-6 text-sm text-slate-300">{h.date}</td>
                      <td className="py-4 px-6"><StatusBadge status={h.status} /></td>
                      <td className="py-4 px-6 text-sm font-mono text-cyan-300 text-right tabular-nums">
                        {formatPrice(h.price, h.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-10 sm:p-16 text-center flex flex-col items-center gap-3">
            <History size={44} strokeWidth={1.5} className="text-slate-500" aria-hidden="true" />
            <p className="font-bold text-slate-200">{l.emptyTitle}</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{l.emptyHint}</p>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                {l.findTrip}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;