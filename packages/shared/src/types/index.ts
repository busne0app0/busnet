export type Role = 'passenger' | 'agent' | 'carrier' | 'admin' | 'driver';

// Уніфіковані статуси — ТІЛЬКИ lowercase, відповідає БД (bookings.status)
export type TxStatus = 'pending' | 'confirmed' | 'boarded' | 'settled' | 'cancelled' | 'completed';

export interface User {
  uid: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  companyName?: string;
  role: Role;
  adminRole?: 'owner' | 'manager';
  status: 'active' | 'pending_verification' | 'blocked';
  loyaltyPoints?: number;
  secretKey?: string;
  address?: string;
  createdAt?: any;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers?: number;
}

export interface Trip {
  id: string;
  routeId?: string;
  carrierId: string;
  carrierName: string;
  direction?: 'outbound' | 'inbound';
  fromStopIdx?: number;
  toStopIdx?: number;
  startDate?: string;
  from: string;
  to: string;
  departureCity?: string;
  departure_city?: string;
  arrivalCity?: string;
  arrival_city?: string;
  departureTime: string;
  departure_time?: string;
  departureDate?: string;
  departure_date?: string;
  date?: string; // YYYY-MM-DD
  arrivalTime: string;
  arrival_time?: string;
  arrivalDate?: string;
  price: number;
  price_eur?: number;
  carrier_id?: string;
  currency?: string;
  availableSeats: number;
  totalSeats?: number;
  seatsTotal?: number;
  seatsBooked?: number;
  busInfo: string;
  busId?: string;
  driverId?: string;
  amenities: string[];
  status?: string;
  name?: string;
  operator?: string;
  stops?: any[];
  discounts?: any;
  custom_discounts?: any[];
  rules?: string[];
}

export interface Booking {
  id: string;
  user_id: string;
  trip_id?: string;
  carrier_id?: string | null;
  status: TxStatus;
  passengers?: any[];
  total_price: number;
  currency?: string;
  route_from?: string;
  route_to?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  created_at?: any;
}

export interface Transaction {
  id: string;
  bookingId: string;
  carrierId: string;
  agentId?: string;
  passengerId: string;
  ticketPrice: number;
  currency: 'UAH' | 'EUR' | 'PLN';
  platformFee: number;
  agentCommission: number;
  status: TxStatus;
  createdAt: any;
  boardedAt?: any;
}

export interface CarrierBalance {
  carrierId: string;
  totalDebtToAdmin: number;
  totalDebtToAgents: number;
  creditLimit: number;
  updatedAt: any;
}

export interface AgentBalance {
  agentId: string;
  unpaidCommissions: number;
  paidCommissions: number;
  updatedAt: any;
}
