import { create } from 'zustand';
import { supabase } from '@busnet/shared/supabase/config';
import { Trip } from '../busnet/types';

export interface Passenger {
  firstName: string;
  lastName: string;
  discountType: 'none' | 'child' | 'student';
}

interface BookingState {
  currentStep: number;
  selectedTrip: Trip | null;
  mainContact: { 
    email: string; 
    phone: string;
  };
  passengers: Passenger[];
  tempPassword: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: number) => void;
  setTrip: (trip: Trip) => void;
  addPassenger: () => void;
  removePassenger: (index: number) => void;
  updatePassenger: (index: number, data: Partial<Passenger>) => void;
  updateContact: (data: Partial<{ email: string; phone: string }>) => void;
  generatePassword: () => string;
  resetBooking: () => void;
  confirmBooking: () => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentStep: 1,
  selectedTrip: null,
  mainContact: { email: '', phone: '' },
  passengers: [{ firstName: '', lastName: '', discountType: 'none' }],
  tempPassword: '',
  loading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  setTrip: (trip) => set({ selectedTrip: trip, currentStep: 1 }),
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
  generatePassword: () => {
    const password = "BN-" + Math.random().toString(36).slice(-6).toUpperCase();
    set({ tempPassword: password });
    return password;
  },
  resetBooking: () => set({
    currentStep: 1,
    selectedTrip: null,
    mainContact: { email: '', phone: '' },
    passengers: [{ firstName: '', lastName: '', discountType: 'none' }],
    tempPassword: '',
    loading: false,
    error: null
  }),

  confirmBooking: async () => {
    const { selectedTrip, passengers, mainContact } = get();
    
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!selectedTrip || !user) {
      set({ error: "Будь ласка, увійдіть в систему, щоб продовжити бронювання." });
      return;
    }

    set({ loading: true, error: null });
    try {
      const basePrice = selectedTrip.price;
      const totalPrice = passengers.reduce((total, p) => {
        let price = basePrice;
        if (p.discountType === 'child') price *= 0.5;
        if (p.discountType === 'student') price *= 0.8;
        return total + price;
      }, 0);

      const requestedSeats = passengers.length;

      // Атомарна операція через RPC — вирішує race condition
      // PostgreSQL блокує рядок FOR UPDATE, жоден паралельний запит
      // не може забронювати ті самі місця одночасно
      const { data: bookResult, error: rpcError } = await supabase
        .rpc('book_seats', {
          p_trip_id: selectedTrip.id,
          p_seats_count: requestedSeats,
        });

      if (rpcError) throw new Error(rpcError.message);
      if (!bookResult?.success) {
        throw new Error(bookResult?.error || 'Не вдалося забронювати місця');
      }

      // Отримуємо дані рейсу для збереження в бронюванні
      const { data: tripData } = await supabase
        .from('trips')
        .select('carrierId, departureCity, arrivalCity, departureDate, departureTime, arrivalTime')
        .eq('id', selectedTrip.id)
        .single();

      // Створюємо бронювання з дублюванням критичних полів маршруту
      const bookingId = "BK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          userId: user.id,
          tripId: selectedTrip.id,
          status: 'confirmed',
          passengers: passengers,
          totalPrice: totalPrice,
          carrierId: tripData?.carrierId || null,
          routeFrom: selectedTrip.departureCity || tripData?.departureCity || '',
          routeTo: selectedTrip.arrivalCity || tripData?.arrivalCity || '',
          departureDate: selectedTrip.departureDate || tripData?.departureDate || null,
          departureTime: selectedTrip.departureTime || tripData?.departureTime || null,
          arrivalTime: selectedTrip.arrivalTime || tripData?.arrivalTime || null,
        });

      if (insertError) {
        throw new Error("Помилка створення бронювання: " + insertError.message);
      }

      set({ loading: false, currentStep: 3 });
    } catch (err: any) {
      set({ loading: false, error: err.message });
      console.error('Booking Error:', err);
    }
  }
}));

