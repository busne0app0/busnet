import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@busnet/shared/store/useBookingStore';
import Step1Confirmation from './steps/Step1Confirmation';
import Step2Details from './steps/Step2Details';
import Step3Success from './steps/Step3Success';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../../busnet/types';

const ALTRANS_CARRIER_UID = 'ec987229-0773-49b9-bac8-69d562a794d1';

export default function BookingStepper() {
  const { currentStep, setStep, selectedTrip, setTrip } = useBookingStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [restoring, setRestoring] = useState(false);

  const stepsMeta = [
    { id: 1, label: t.booking?.step1Title || 'Підтвердження' },
    { id: 2, label: t.booking?.step2Title?.split(' ')[0] || 'Пасажири' },
    { id: 3, label: t.booking?.step3BookingNumber ? 'Готово' : 'Готово' }
  ];

  useEffect(() => {
    if (selectedTrip || currentStep === 3) return;

    const query = new URLSearchParams(location.search);
    const routeId = query.get('route');
    const dir = (query.get('dir') || 'outbound') as 'outbound' | 'inbound';
    const fromStr = query.get('from');
    const toStr = query.get('to');
    const dateStr = query.get('date');

    if (!routeId || fromStr === null || toStr === null || !dateStr) {
      navigate('/');
      return;
    }

    const fromIdx = parseInt(fromStr);
    const toIdx = parseInt(toStr);

    let cancelled = false;
    setRestoring(true);

    const restore = async () => {
      try {
        const { data: routeData, error: routeErr } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .single();

        if (routeErr || !routeData) {
          throw new Error('Маршрут не знайдено');
        }

        const stops = (routeData[dir]?.stops || []);
        const fromStop = stops[fromIdx];
        const toStop = stops[toIdx];
        const depCity = fromStop?.city || 'Львів';
        const arrCity = toStop?.city || 'Болонья';

        const depOffset = fromStop?.dayOffset || 0;
        const arrOffset = toStop?.dayOffset || 0;
        const depDate = addDays(dateStr, depOffset);
        const arrDate = addDays(dateStr, arrOffset);

        let price = 6240;
        let currency = 'грн';
        let depTime = (fromStop?.time || '04:00').slice(0, 5);
        let arrTime = (toStop?.time || '08:10').slice(0, 5);
        let availableSeats = 30;
        let busNumber = 'BC 4204 PH';

        const carrierId = routeData.carrier_id ?? routeData.carrierId ?? '';
        const isAltrans = carrierId === ALTRANS_CARRIER_UID || (routeData.operator || '').toLowerCase().includes('al-trans');

        // 1. Отримуємо офіційну живу ціну від Аль-Транса
        if (isAltrans) {
          const fromCityId = fromStop?.cityId ?? fromStop?.external_city_id;
          const toCityId = toStop?.cityId ?? toStop?.external_city_id;

          if (fromCityId && toCityId) {
            try {
              const res = await fetch('/api/altrans/api/v2/booking/search_trips', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept-Language': 'uk',
                },
                body: JSON.stringify({
                  departure_city_id: fromCityId,
                  arrival_city_id: toCityId,
                  depature_date: `${depDate}T00:00:00`,
                  passengers_count: 1,
                  currecny_code: 'UAH',
                  enable_external_search: false,
                }),
              });

              if (res.ok) {
                const data = await res.json();
                const seq = data?.trips_sequences;
                if (Array.isArray(seq) && seq.length > 0) {
                  const first = seq[0];
                  if (first.price) price = Number(first.price);
                  if (first.free_seats !== undefined) availableSeats = first.free_seats;
                  if (first.departure_time) depTime = String(first.departure_time).slice(0, 5);
                  if (first.arrival_time) arrTime = String(first.arrival_time).slice(0, 5);
                  if (first.trips?.[0]?.bus_number) busNumber = first.trips[0].bus_number;
                }
              }
            } catch (alErr) {
              console.warn('[BookingStepper] Live API restore error:', alErr);
            }
          }
        }

        if (cancelled) return;

        const restoredTrip: Trip = {
          id: `${routeId}_${dir}_${fromIdx}_${toIdx}_${dateStr}`,
          routeId: routeId,
          direction: dir,
          fromStopIdx: fromIdx,
          toStopIdx: toIdx,
          startDate: dateStr,
          carrierId: carrierId || ALTRANS_CARRIER_UID,
          carrierName: routeData.operator ?? 'AL-TRANS',
          from: depCity,
          to: arrCity,
          name: routeData.name ?? `${depCity} - ${arrCity}`,
          operator: routeData.operator ?? 'AL-TRANS',
          departureCity: depCity,
          arrivalCity: arrCity,
          departureDate: depDate,
          arrivalDate: arrDate,
          departureTime: depTime,
          arrivalTime: arrTime,
          price: price,
          currency: currency,
          availableSeats: availableSeats,
          totalSeats: routeData.seats || 50,
          seatsTotal: routeData.seats || 50,
          seatsBooked: Math.max(0, (routeData.seats || 50) - availableSeats),
          busInfo: `VAN HOOL (${busNumber})`,
          amenities: routeData.amenities ?? ['wifi', 'wc', 'ac', 'usb', 'tea'],
          discounts: routeData.discounts,
          custom_discounts: routeData.custom_discounts,
          status: 'active',
          stops
        };

        setTrip(restoredTrip);
      } catch (err) {
        console.error('Failed to restore trip from URL:', err);
        if (!cancelled) navigate('/');
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [location.search, selectedTrip, currentStep, navigate, setTrip]);

  if (restoring) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        <p className="text-white text-xs font-black uppercase tracking-widest">Відновлення даних рейсу...</p>
      </div>
    );
  }

  if (!selectedTrip && currentStep < 3) return null;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-32 sm:pb-16">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6 sm:mb-10">
        <button
          onClick={() => currentStep > 1 && currentStep < 3 ? setStep(currentStep - 1) : navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group px-3 py-2 rounded-full border border-white/10 hover:border-cyan-500/30"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {currentStep === 3 ? (t.booking?.toHome || 'На головну') : (t.booking?.back || 'Назад')}
          </span>
        </button>

        <div className="flex items-center gap-4 sm:gap-10">
          {stepsMeta.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${currentStep >= step.id ? 'bg-cyan-400 shadow-[0_0_15px_#00D4FF]' : 'bg-white/10'}`} />
              <span className={`absolute -bottom-5 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors hidden sm:block ${currentStep === step.id ? 'text-cyan-400' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden md:block w-24" />
      </div>

      {/* Main Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentStep === 1 && <Step1Confirmation />}
            {currentStep === 2 && <Step2Details />}
            {currentStep === 3 && <Step3Success />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer support notice */}
      <div className="mt-10 sm:mt-20 pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
            <span className="text-[10px] font-bold">24/7</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Підтримка готова допомогти вам</p>
        </div>
        <p className="text-[10px] text-slate-600 font-bold italic tracking-tighter">Powered by Busnet Neural Engine 2026</p>
      </div>
    </div>
  );
}