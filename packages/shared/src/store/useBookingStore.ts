import { create } from 'zustand';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';

export interface Passenger {
  firstName: string;
  lastName: string;
  discountType: string;
}

export interface ConfirmedBooking {
  bookingId: string;
  totalPrice: number;
  currency: string;
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
  passengers: [{ firstName: '', lastName: '', discountType: 'none' }],
  confirmedBooking: null,
  loading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  setTrip: (trip) => set({ selectedTrip: trip, currentStep: 1, error: null }),
  addPassenger: () => set((state) => ({ 
    passengers: [...state.passengers, { firstName: '', lastName: '', discountType: 'none' }] 
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
    passengers: [{ firstName: '', lastName: '', discountType: 'none' }],
    confirmedBooking: null,
    loading: false,
    error: null
  }),

  confirmBooking: async () => {
    const { selectedTrip, passengers, mainContact } = get();
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!selectedTrip || !user) {
      set({ error: "Будь ласка, увійдіть в систему, щоб продовжити бронювання." });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Rule 9: Створення броні лише через create_booking RPC
      const { data, error: rpcError } = await supabase.rpc('create_booking', {
        p_route_id: selectedTrip.routeId || selectedTrip.id,
        p_direction: selectedTrip.direction || 'outbound',
        p_from_stop: selectedTrip.fromStopIdx ?? 0,
        p_to_stop: selectedTrip.toStopIdx ?? 1,
        p_start_date: selectedTrip.startDate || selectedTrip.departureDate,
        p_passengers: passengers.map(p => ({
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          discountType: p.discountType || 'none'
        })),
        p_contact: {
          email: mainContact.email.trim(),
          phone: mainContact.phone.trim()
        },
        p_idempotency_key: idempotencyKey
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!data || !data.success) {
        throw new Error(data?.error || 'Помилка створення бронювання');
      }

      set({
        loading: false,
        error: null,
        confirmedBooking: {
          bookingId: data.booking_id,
          totalPrice: data.total_price,
          currency: data.currency
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
