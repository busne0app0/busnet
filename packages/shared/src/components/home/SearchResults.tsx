import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, ChevronRight, Info, Send, Phone, User, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Trip } from '../../busnet/types';
import { useSearch } from '@busnet/shared/context/SearchContext';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { submitLead } from '@busnet/shared/services/leadService';
import { normalizeAmenities, getAmenityIcon, getAmenityLabel } from '@busnet/shared/constants/amenities';
import { Link } from 'react-router-dom';

interface SearchResultsProps {
  trips: Trip[];
  loading: boolean;
  error?: string | null;
  query?: { from?: string; to?: string; date?: string };
  onSelect: (trip: Trip) => void;
  onRetry?: () => void;
}

type LeadStatus = 'idle' | 'sending' | 'sent' | 'error';

function getAvailableSeats(trip: Trip): number | null {
  if (typeof trip.availableSeats === 'number' && !isNaN(trip.availableSeats)) {
    return Math.max(0, trip.availableSeats);
  }
  const total = trip.seatsTotal ?? trip.totalSeats;
  if (typeof total === 'number' && !isNaN(total)) {
    const booked = trip.seatsBooked || 0;
    return Math.max(0, total - booked);
  }
  return null;
}

function computeDurationAndOffset(trip: Trip, langKey: string) {
  const depTime = trip.departureTime || trip.departure_time;
  const arrTime = trip.arrivalTime || trip.arrival_time;
  const depDate = trip.departureDate || (trip as any).departure_date || trip.startDate || trip.date;
  const arrDate = trip.arrivalDate || (trip as any).arrival_date || depDate;

  if (!depTime || !arrTime) {
    return { durationText: null, dayDiff: 0 };
  }

  const [depH, depM] = depTime.split(':').map(Number);
  const [arrH, arrM] = arrTime.split(':').map(Number);

  if (isNaN(depH) || isNaN(depM) || isNaN(arrH) || isNaN(arrM)) {
    return { durationText: null, dayDiff: 0 };
  }

  let dayDiff = 0;
  if (depDate && arrDate && depDate !== arrDate) {
    const d1 = new Date(depDate).getTime();
    const d2 = new Date(arrDate).getTime();
    if (!isNaN(d1) && !isNaN(d2)) {
      dayDiff = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    }
  } else if (arrH < depH || (arrH === depH && arrM < depM)) {
    dayDiff = 1;
  }

  const totalDepMinutes = depH * 60 + depM;
  const totalArrMinutes = dayDiff * 1440 + arrH * 60 + arrM;
  const diffMinutes = totalArrMinutes - totalDepMinutes;

  if (diffMinutes <= 0) {
    return { durationText: null, dayDiff };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  let durationText = `${hours}г`;
  if (langKey === 'en') {
    durationText = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else if (langKey === 'it') {
    durationText = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  } else {
    durationText = mins > 0 ? `${hours}г ${mins}хв` : `${hours}г`;
  }

  return { durationText, dayDiff };
}

function formatTripPrice(price: number | undefined, currency: string = 'UAH', locale: string = 'uk-UA', fallbackText: string): string {
  if (!price || price <= 0 || isNaN(price)) {
    return fallbackText;
  }
  try {
    const validCurr = (currency || 'UAH').toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurr,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export default function SearchResults({
  trips,
  loading,
  error,
  query,
  onSelect,
  onRetry,
}: SearchResultsProps) {
  const { searchParams } = useSearch();
  const { langKey, locale, t } = useLanguage();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [status, setStatus] = useState<LeadStatus>('idle');
  const [formData, setFormData] = useState({ name: '', phone: '', hp_field: '' });

  // Focus results heading on arrival for accessibility
  useEffect(() => {
    if (!loading && trips.length > 0) {
      titleRef.current?.focus({ preventScroll: false });
    }
  }, [loading, trips.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.hp_field) return; // Honeypot spam trap
    if (status === 'sending') return;

    setStatus('sending');
    try {
      await submitLead({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        from_city: query?.from || searchParams.from || '',
        to_city: query?.to || searchParams.to || '',
        date: query?.date || searchParams.date || null,
      });
      setStatus('sent');
    } catch (err) {
      console.error('[SearchResults] Lead submission error:', err);
      setStatus('error');
    }
  };

  // 1. Loading Skeleton with proper ARIA
  if (loading) {
    return (
      <div role="status" aria-busy="true" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-4">
        <span className="sr-only">Завантаження...</span>
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-44 w-full bg-white/5 animate-pulse rounded-2xl sm:rounded-[32px] border border-white/5" />
        ))}
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="bg-[#141928]/90 border border-rose-500/30 rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-400">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t.results.loadError}</h3>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="neon-gradient-btn min-h-11 px-8 rounded-xl font-bold text-sm tracking-wider uppercase inline-flex items-center justify-center"
            >
              {t.results.retry}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty state: Request Lead Form
  if (trips.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[#141928]/90 border border-white/10 rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden isolate">
          <AnimatePresence mode="wait">
            {status !== 'sent' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_24px_rgba(0,212,255,0.15)]">
                  <Info className="w-8 h-8 text-neon-cyan" aria-hidden="true" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white uppercase tracking-tight">
                  {t.results.notFound}
                </h3>
                <p className="text-slate-400 mb-8 text-base leading-relaxed max-w-md mx-auto font-normal">
                  {t.results.leadIntro}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto text-left">
                  {/* Honeypot field for bot spam detection */}
                  <input
                    type="text"
                    name="hp_field"
                    value={formData.hp_field}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hp_field: e.target.value }))}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div>
                    <label htmlFor="lead-name" className="sr-only">
                      {t.results.name}
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-cyan transition-colors" aria-hidden="true" />
                      <input
                        id="lead-name"
                        name="name"
                        type="text"
                        required
                        minLength={2}
                        autoComplete="name"
                        placeholder={t.results.namePlaceholder}
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-base outline-none focus:border-neon-cyan/50 focus:bg-white/[0.08] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lead-phone" className="sr-only">
                      {t.results.phone}
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-cyan transition-colors" aria-hidden="true" />
                      <input
                        id="lead-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        pattern="[+0-9 ()-]{9,20}"
                        placeholder={t.results.phonePlaceholder}
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-base outline-none focus:border-neon-cyan/50 focus:bg-white/[0.08] transition-all font-medium"
                      />
                    </div>
                  </div>

                  {status === 'error' && (
                    <p role="alert" className="text-rose-400 text-xs text-center font-medium">
                      {t.results.leadError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="neon-gradient-btn min-h-12 w-full py-4 rounded-xl text-sm sm:text-base font-black uppercase tracking-wider mt-2 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    {status === 'sending' ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        <span>{t.results.sending}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.results.send}</span>
                        <Send size={16} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center leading-normal mt-2">
                    {t.results.privacyNotice}{' '}
                    <Link to="/forum" className="text-slate-400 hover:text-neon-cyan underline transition-colors">
                      {t.results.privacyLink}
                    </Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase mb-2">
                  {t.results.sentTitle}
                </h3>
                <p className="text-slate-300 font-normal max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                  {t.results.sentDesc}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 4. Results List
  return (
    <section aria-labelledby="results-title" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-2">
        <h2
          id="results-title"
          ref={titleRef}
          tabIndex={-1}
          aria-live="polite"
          className="text-lg sm:text-xl font-bold text-slate-200 outline-none"
        >
          {t.results.found(trips.length)}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal">{t.results.perPassenger}</p>
      </div>

      <ul role="list" className="grid gap-3 sm:gap-4">
        {trips.map((trip, index) => {
          const depTime = trip.departureTime || trip.departure_time || '--:--';
          const arrTime = trip.arrivalTime || trip.arrival_time || '--:--';
          const fromCity = trip.departureCity || trip.from || '';
          const toCity = trip.arrivalCity || trip.to || '';
          const carrier = trip.carrierName || trip.operator || 'Перевізник';
          const amenities = normalizeAmenities(trip.amenities);

          const { durationText, dayDiff } = computeDurationAndOffset(trip, langKey);
          const seatsLeft = getAvailableSeats(trip);
          const soldOut = seatsLeft === 0;
          const formattedPrice = formatTripPrice(trip.price, trip.currency, locale, t.results.priceOnRequest);

          return (
            <motion.li
              key={trip.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 5) * 0.05 }}
              className="group relative bg-[#141928]/90 border border-white/10 hover:border-neon-cyan/40 rounded-2xl sm:rounded-[32px] overflow-hidden transition-colors duration-200 isolate"
            >
              <article className="p-4 sm:p-6 md:p-7 flex flex-col md:flex-row gap-4 sm:gap-6 items-center">
                {/* Timing & Carrier */}
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center">
                  <div className="flex flex-col">
                    <time className="text-2xl sm:text-3xl font-black text-white leading-none">
                      {depTime}
                    </time>
                    <div className="flex items-center gap-1 text-slate-400 text-xs sm:text-sm mt-1.5 min-w-0 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                      <span className="truncate">{fromCity}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center col-span-2 md:col-span-1 order-last md:order-none py-1 md:py-0 border-t border-b md:border-none border-white/5">
                    {durationText && (
                      <span className="text-[11px] sm:text-xs text-neon-cyan font-bold tracking-wide">
                        {durationText}
                      </span>
                    )}
                    <div className="w-full max-w-[120px] h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent relative my-1">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      {t.results.inTransit}
                    </span>
                  </div>

                  <div className="flex flex-col text-right md:text-left">
                    <div className="flex items-baseline justify-end md:justify-start gap-1.5">
                      <time className="text-2xl sm:text-3xl font-black text-white leading-none">
                        {arrTime}
                      </time>
                      {dayDiff > 0 && (
                        <span className="text-[11px] sm:text-xs font-bold text-amber-400">
                          {t.results.dayPlus(dayDiff)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs sm:text-sm mt-1.5 md:justify-start justify-end min-w-0 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                      <span className="truncate">{toCity}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="w-full md:w-auto md:min-w-[210px] flex md:flex-col items-center justify-between gap-3 sm:gap-4 md:border-l border-white/10 md:pl-6 pt-3 md:pt-0 border-t md:border-t-0">
                  <div className="flex flex-col md:items-end">
                    <div className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                      {carrier}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-neon-cyan tracking-tight">
                      {formattedPrice}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      <span className={`text-[11px] font-semibold ${soldOut ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        {soldOut
                          ? t.results.soldOut
                          : seatsLeft !== null
                            ? seatsLeft <= 10
                              ? t.results.seatsLeft(seatsLeft)
                              : t.results.availableSeatsCount(seatsLeft)
                            : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => onSelect(trip)}
                    className="neon-gradient-btn min-h-11 px-5 sm:px-6 rounded-xl flex items-center justify-center gap-2 group text-sm sm:text-base font-black disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <span>{soldOut ? t.results.soldOut : t.results.select}</span>
                    {!soldOut && (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </article>

              {/* Amenities List */}
              {amenities.length > 0 && (
                <ul
                  role="list"
                  className="px-4 sm:px-6 py-2.5 bg-white/[0.02] border-t border-white/5 flex gap-4 overflow-x-auto no-scrollbar scrollbar-hide"
                >
                  {amenities.map((id) => {
                    const Icon = getAmenityIcon(id);
                    return (
                      <li key={id} className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <Icon className="w-3.5 h-3.5 text-neon-cyan shrink-0" aria-hidden="true" />
                        <span>{getAmenityLabel(id, langKey)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
