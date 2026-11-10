import React from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import {
  CheckCircle2,
  MapPin,
  Bus,
  ArrowRight,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { normalizeAmenities, getAmenityIcon, getAmenityLabel } from '@busnet/shared/constants/amenities';
import { getTripCurrencySymbol } from '@busnet/shared/lib/currencyUtils';

// Форматуємо дату без зайвого року: "нд, 8 лист."
function formatDayMonth(dateStr?: string, locale: string = 'uk-UA'): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(d);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Рахуємо точний час у дорозі та різницю в днях
function computeTripDuration(depTime?: string, arrTime?: string, depDate?: string, arrDate?: string, langKey?: string) {
  if (!depTime || !arrTime) return { durationText: null, dayDiff: 0 };

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

  if (diffMinutes <= 0) return { durationText: null, dayDiff };

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const hLabel = langKey === 'en' ? 'h' : langKey === 'it' ? 'h' : 'г';
  const mLabel = langKey === 'en' ? 'min' : langKey === 'it' ? 'min' : 'хв';
  const durationText = mins > 0 ? `${hours}${hLabel} ${mins}${mLabel}` : `${hours}${hLabel}`;

  return { durationText, dayDiff };
}

export default function Step1Confirmation() {
  const { selectedTrip, setStep } = useBookingStore();
  const { t, langKey, locale } = useLanguage();

  if (!selectedTrip) return null;

  // Визначаємо зупинки та адреси
  const depStop = selectedTrip.stops && typeof selectedTrip.fromStopIdx === 'number'
    ? selectedTrip.stops[selectedTrip.fromStopIdx]
    : selectedTrip.stops?.[0];

  const arrStop = selectedTrip.stops && typeof selectedTrip.toStopIdx === 'number'
    ? selectedTrip.stops[selectedTrip.toStopIdx]
    : selectedTrip.stops?.[selectedTrip.stops.length - 1];

  const depAddress = (selectedTrip as any).departureAddress || (selectedTrip as any).fromAddress || depStop?.address || '';
  const arrAddress = (selectedTrip as any).arrivalAddress || (selectedTrip as any).toAddress || arrStop?.address || '';

  const depDateStr = selectedTrip.departureDate || (selectedTrip as any).departure_date || selectedTrip.startDate || selectedTrip.date;
  const arrDateStr = selectedTrip.arrivalDate || (selectedTrip as any).arrival_date || depDateStr;

  const { durationText, dayDiff } = computeTripDuration(
    selectedTrip.departureTime,
    selectedTrip.arrivalTime,
    depDateStr,
    arrDateStr,
    langKey
  );

  const amenities = normalizeAmenities(selectedTrip.amenities);
  const carrier = selectedTrip.carrierName || selectedTrip.operator || 'AL-TRANS';
  const busInfo = selectedTrip.busInfo || 'VAN HOOL';

  return (
    <div className="space-y-4 max-w-xl mx-auto px-2">
      {/* Компактний заголовок */}
      <div className="text-center pt-1 pb-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2"
        >
          <CheckCircle2 size={14} />
          <span>{t.booking?.step1Number || 'Крок 1 із 3'}</span>
        </motion.div>
        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          {t.booking?.step1Title || 'Підтвердження'} <span className="text-cyan-400">{t.booking?.step1TitleAccent || 'вибору'}</span>
        </h3>
        <p className="text-slate-400 text-xs mt-0.5">
          {t.booking?.step1Desc || 'Перевірте маршрут і час перед введенням даних'}
        </p>
      </div>

      {/* Картка-посадковий талон */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#141928]/95 border border-white/10 shadow-2xl relative overflow-hidden isolate">

        {/* Шапка квитка */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold uppercase tracking-wider text-[11px] shrink-0">
              {carrier}
            </span>
            <span className="text-slate-300 font-medium flex items-center gap-1 text-[11px] min-w-0">
              <Bus size={13} className="text-slate-500 shrink-0" />
              <span className="truncate">{busInfo}</span>
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 shrink-0 ml-auto">
            <ShieldCheck size={13} />
            {t.booking?.directTrip || 'Прямий рейс'}
          </span>
        </div>

        {/* Таймлайн поїздки */}
        <div className="py-4 space-y-3 relative">

          {/* Пункт відправлення */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <MapPin size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white leading-none tracking-tight">
                  {selectedTrip.departureTime}
                </span>
                {depDateStr && (
                  <span className="text-xs font-bold text-cyan-400">
                    {formatDayMonth(depDateStr, locale)}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-slate-100 mt-1 truncate">
                {selectedTrip.departureCity}
              </p>
              {depAddress && (
                <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 line-clamp-1" title={depAddress}>
                  {depAddress}
                </p>
              )}
            </div>
          </div>

          {/* Плашка часу в дорозі посередині */}
          <div className="pl-3 py-1 flex items-center gap-3">
            <div className="w-0.5 h-6 bg-cyan-500/30 ml-0.5" />
            {durationText && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300">
                <Clock size={11} className="text-cyan-400" />
                <span>{durationText} {t.booking?.inTransit || 'в дорозі'}</span>
              </div>
            )}
          </div>

          {/* Пункт прибуття */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <MapPin size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-white leading-none tracking-tight">
                  {selectedTrip.arrivalTime}
                </span>
                {dayDiff > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 border border-amber-400/40 text-amber-400 font-black">
                    {t.booking?.dayPlus ? t.booking.dayPlus(dayDiff) : `+${dayDiff} д.`}
                  </span>
                )}
                {arrDateStr && (
                  <span className="text-xs font-bold text-cyan-400">
                    {formatDayMonth(arrDateStr, locale)}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-slate-100 mt-1 truncate">
                {selectedTrip.arrivalCity}
              </p>
              {arrAddress && (
                <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 line-clamp-1" title={arrAddress}>
                  {arrAddress}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Низ картки: Ціна + Кнопка в один рядок */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              {t.booking?.singleTicket || '1 квиток'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                {selectedTrip.price?.toLocaleString(locale) || selectedTrip.price}
              </span>
              <span className="text-xs font-bold text-slate-300">
                {getTripCurrencySymbol(selectedTrip.departureCity || selectedTrip.from, selectedTrip.arrivalCity || selectedTrip.to, selectedTrip.currency)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="neon-gradient-btn min-h-11 px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <span>{t.booking?.continue || 'Продовжити'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Зручності рейсу в один горизонтальний акуратний рядок */}
      {amenities.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide py-1">
          {amenities.map((id) => {
            const Icon = getAmenityIcon(id);
            return (
              <div
                key={id}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5 shrink-0 text-slate-300 text-[11px] font-medium"
              >
                <Icon size={13} className="text-cyan-400" />
                <span>{getAmenityLabel(id, langKey)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}