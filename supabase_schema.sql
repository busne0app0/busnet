-- SQL скрипт для создания таблиц в Supabase на основе Firestore коллекций

-- Включить RLS (Row Level Security)
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Таблица пользователей
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'carrier', 'admin', 'passenger', 'agent', 'driver')),
  "firstName" TEXT,
  "lastName" TEXT,
  "companyName" TEXT,
  phone TEXT,
  address TEXT,
  gender TEXT,
  avatar TEXT,
  "birthDate" TEXT,
  status TEXT DEFAULT 'active',
  "secretKey" TEXT,
  "loyaltyPoints" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица маршрутов (routes)
CREATE TABLE routes (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT NOT NULL REFERENCES users(uid),
  name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('oneway', 'roundtrip')),
  seats INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'blocked', 'draft')),
  comment TEXT,
  "activeDays" INTEGER[], -- массив дней недели
  "stopsThere" JSONB, -- массив остановок
  "stopsBack" JSONB,
  "pricesThere" JSONB, -- объект цен
  "pricesBack" JSONB,
  "pricingMode" TEXT NOT NULL CHECK ("pricingMode" IN ('single', 'segment', 'zones', 'km', 'matrix')),
  "singlePrice" NUMERIC,
  "kmRate" NUMERIC,
  "borderStopIndex" INTEGER,
  "zoneAPrice" NUMERIC,
  "zoneBPrice" NUMERIC,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);

-- Таблица рейсов (trips)
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT NOT NULL REFERENCES users(uid),
  "routeId" TEXT REFERENCES routes(id),
  "departureCity" TEXT NOT NULL,
  "arrivalCity" TEXT NOT NULL,
  "departureDate" TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'completed', 'cancelled', 'pending_approval', 'in_progress')),
  "seatsBooked" INTEGER DEFAULT 0,
  "availableSeats" INTEGER,
  "seatsTotal" INTEGER,
  "busId" TEXT,
  "driverId" TEXT,
  amenities TEXT[],
  stops JSONB,
  "departureTime" TEXT,
  "arrivalTime" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица бронирований
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(uid),
  "tripId" TEXT NOT NULL REFERENCES trips(id),
  "carrierId" TEXT REFERENCES users(uid),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'BOARDED', 'SETTLED', 'CANCELLED', 'confirmed', 'cancelled')),
  passengers JSONB NOT NULL, -- массив пассажиров
  "totalPrice" NUMERIC,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица автобусов
CREATE TABLE buses (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT NOT NULL REFERENCES users(uid),
  number TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица водителей
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT NOT NULL REFERENCES users(uid),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'on_trip', 'resting', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Балансы перевозчиков
CREATE TABLE balances (
  "carrierId" TEXT PRIMARY KEY REFERENCES users(uid),
  balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Балансы агентов
CREATE TABLE agent_balances (
  "agentId" TEXT PRIMARY KEY REFERENCES users(uid),
  balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Отзывы
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT REFERENCES users(uid),
  "userId" TEXT REFERENCES users(uid),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(uid),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Поддержка
CREATE TABLE support (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(uid),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'Other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Документы
CREATE TABLE docs (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT REFERENCES users(uid),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Настройки
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  data JSONB
);

-- Форум посты
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY,
  "authorId" TEXT REFERENCES users(uid),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Форум комментарии
CREATE TABLE forum_comments (
  id TEXT PRIMARY KEY,
  "postId" TEXT REFERENCES forum_posts(id),
  "authorId" TEXT REFERENCES users(uid),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Чернетки рейсів
CREATE TABLE trip_drafts (
  id TEXT PRIMARY KEY,
  "carrierId" TEXT REFERENCES users(uid),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ліди (заявки на підбір рейсу)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  "from" TEXT,
  "to" TEXT,
  date TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Пасажири (збережені профілі)
CREATE TABLE passengers (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(uid),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Пасажир',
  doc TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Чат підтримки (тікети)
CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(uid),
  "userEmail" TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_passengers_user ON passengers("userId");
CREATE INDEX idx_support_user ON support_tickets("userId");
CREATE INDEX idx_trips_carrier ON trips("carrierId");
CREATE INDEX idx_trips_date ON trips("departureDate");
CREATE INDEX idx_bookings_user ON bookings("userId");
CREATE INDEX idx_bookings_trip ON bookings("tripId");
CREATE INDEX idx_routes_carrier ON routes("carrierId");
CREATE INDEX idx_trip_drafts_carrier ON trip_drafts("carrierId");
CREATE INDEX idx_leads_status ON leads(status);