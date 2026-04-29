export type Role = 'passenger' | 'agent' | 'carrier' | 'admin' | 'driver';

// Уніфіковані статуси — ТІЛЬКИ lowercase, відповідає БД (bookings.status)
export type TxStatus = 'pending' | 'confirmed' | 'boarded' | 'settled' | 'cancelled' | 'active';

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
  carrierId: string;
  carrierName: string;
  from: string;
  to: string;
  departureCity?: string;
  arrivalCity?: string;
  departureTime: string;
  departureDate?: string;
  date?: string; // YYYY-MM-DD
  arrivalTime: string;
  price: number;
  currency?: string;
  availableSeats: number;
  totalSeats: number;
  seatsTotal?: number;
  seatsBooked?: number;
  busInfo: string;
  busId?: string;
  driverId?: string;
  amenities: string[];
  status?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  userId?: string;
  passengerId: string;
  passengerName: string;
  passengers?: any[];
  seats: number;
  totalPrice: number;
  status: TxStatus;
  createdAt: any;
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
