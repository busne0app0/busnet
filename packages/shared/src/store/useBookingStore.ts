import { getTripCurrencySymbol } from '../lib/currencyUtils';
import { create } from 'zustand';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';

export interface Passenger {
  firstName: string;
  lastName: string;
  discountType: string;
  birthDate?: string;
}

export interface ConfirmedBooking {
  bookingId: string;
  totalPrice: number;
  currency: string;
  status?: string;
}

interface BookingState {
  currentStep: number;
  selectedTrip: Trip | null;
  mainContact: {
    email: string;
    phone: string;
  };
  passengers: Passenger[];
  confirmedBooking: ConfirmedBooking | null;
  loading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  setTrip: (trip: Trip) => void;
  addPassenger: () => void;
  removePassenger: (index: number) => void;
  updatePassenger: (index: number, data: Partial<Passenger>) => void;
  updateContact: (data: Partial<{ email: string; phone: string }>) => void;
  resetBooking: () => void;
  confirmBooking: () => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentStep: 1,
  selectedTrip: null,
  mainContact: { email: '', phone: '' },
  passengers: [{ firstName: '', lastName: '', discountType: 'none', birthDate: '' }],
  confirmedBooking: null,
  loading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  setTrip: (trip) => set({ selectedTrip: trip, currentStep: 1, error: null }),
  addPassenger: () => set((state) => ({
    passengers: [...state.passengers, { firstName: '', lastName: '', discountType: 'none', birthDate: '' }]
  })),
  removePassenger: (index) => set((state) => ({
    passengers: state.passengers.filter((_, i) => i !== index)
  })),
  updatePassenger: (index, data) => set((state) => {
    const newPassengers = [...state.passengers];
    newPassengers[index] = { ...newPassengers[index], ...data };
    return { passengers: newPassengers };
  }),
  updateContact: (data) => set((state) => ({
    mainContact: { ...state.mainContact, ...data }
  })),
  resetBooking: () => set({
    currentStep: 1,
    selectedTrip: null,
    mainContact: { email: '', phone: '' },
    passengers: [{ firstName: '', lastName: '', discountType: 'none', birthDate: '' }],
    confirmedBooking: null,
    loading: false,
    error: null
  }),

  confirmBooking: async () => {
    const { selectedTrip, passengers, mainContact } = get();

    if (!selectedTrip) {
      set({ error: "Рейс не обрано." });
      return false;
    }

    set({ loading: true, error: null });

    try {
      // 1. Отримуємо сесію, якщо користувач не увійшов — створюємо анонімну сесію
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError || !anonData.session) {
          throw new Error('Не вдалося створити сесію для бронювання. Спробуйте увійти в акаунт.');
        }
        session = anonData.session;
      }

      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 2. Викликаємо захищений серверний ендпоінт /api/booking/create (БЕЗ p_price)
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          routeId: selectedTrip.routeId || selectedTrip.id,
          direction: selectedTrip.direction || 'outbound',
          fromStop: selectedTrip.fromStopIdx ?? 0,
          toStop: selectedTrip.toStopIdx ?? 1,
          startDate: selectedTrip.startDate || selectedTrip.departureDate,
          passengers: passengers.map(p => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            discountType: p.discountType || 'none',
            birthDate: p.birthDate?.trim() || null
          })),
          contact: {
            email: mainContact.email.trim(),
            phone: mainContact.phone.trim()
          },
          idempotencyKey,
          expectedPrice: selectedTrip.price || null
        })
      });

      const data = await res.json();

      // Обробка зміни ціни від перевізника
      if (res.status === 409 && data.code === 'price_changed') {
        const newPrice = data.newPrice;
        if (newPrice) {
          set((state) => ({
            selectedTrip: state.selectedTrip ? { ...state.selectedTrip, price: newPrice } : null,
            loading: false,
            error: `Ціна квитка змінилася на ${newPrice} ${data.currency || ''}. Будь ласка, натисніть «Підтвердити бронювання» ще раз.`
          }));
          return false;
        }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Помилка створення бронювання');
      }

      set({
        loading: false,
        error: null,
        confirmedBooking: {
          bookingId: data.booking_id,
          totalPrice: data.total_price,
          currency: getTripCurrencySymbol(
            selectedTrip.departureCity || selectedTrip.from,
            selectedTrip.arrivalCity || selectedTrip.to,
            data.currency || selectedTrip.currency
          ),
          status: data.status
        },
        currentStep: 3
      });

      return true;
    } catch (err: any) {
      console.error('Booking Error:', err);
      set({ loading: false, error: err.message || 'Помилка створення бронювання' });
      return false;
    }
  }
}));
