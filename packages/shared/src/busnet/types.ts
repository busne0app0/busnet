export enum PricingMode {
  SINGLE = 'single',
  SEGMENT = 'segment',
  ZONES = 'zones',
  KM = 'km',
  MATRIX = 'matrix',
}

export enum RouteStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  BLOCKED = 'blocked',
  DRAFT = 'draft',
}

export interface Stop {
  time: string;
  dayOffset: number;
  city: string;
  address: string;
  price?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface RouteTemplate {
  id?: string;
  carrierId: string;
  name: string;
  direction: 'oneway' | 'roundtrip';
  seats: number;
  currency: string;
  status: RouteStatus;
  comment: string;
  activeDays: number[]; // 0=Sun, 6=Sat
  stopsThere: Stop[];
  stopsBack: Stop[];
  pricesThere: Record<string, number>; // "0-1" -> price
  pricesBack: Record<string, number>;
  pricingMode: PricingMode;
  singlePrice?: number;
  kmRate?: number;
  borderStopIndex?: number;
  zoneAPrice?: number;
  zoneBPrice?: number;
  createdAt: number;
  updatedAt: number;
}

import { Trip as GlobalTrip } from '../types';

export interface Trip extends GlobalTrip {
  templateId?: string;
  originCity?: string;
  destinationCity?: string;
  stopCities?: string[];
  pricesThere?: Record<string, number>;
  pricesBack?: Record<string, number>;
  stopsThere?: any[];
  stopsBack?: any[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials?: string;
  category: string;
  content: string;
  likes: number;
  likedBy: string[]; // Fix for infinite likes
  commentsCount: number;
  verified: boolean;
  coins: number;
  createdAt: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorInitials?: string;
  content: string;
  createdAt: number;
}

export interface BorderStatus {
  id: string;
  checkpointId: string;
  name: string;
  waitTime: string;
  trend: 'stable' | 'faster' | 'slower';
  lastUpdated: number;
}
