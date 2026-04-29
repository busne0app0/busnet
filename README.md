# Busnet OS - Transportation Management System

A comprehensive transportation management system built with React, TypeScript, and Supabase.

## Features

- **Multi-role Dashboard**: Admin, Carrier, Agent, Driver, and Landing pages
- **Real-time Updates**: Live passenger counters and trip status
- **Route Management**: Create and manage bus routes and templates
- **Fleet Management**: Track buses and drivers
- **Booking System**: Handle passenger bookings and payments
- **PWA Support**: Offline-capable progressive web app

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build**: Turbo monorepo
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 18+
- Supabase account

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

3. **Configure environment variables:**
   Create `.env.local` in the root:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Setup database schema:**
   - Go to Supabase Dashboard > SQL Editor
   - Run the contents of `supabase_schema.sql`

5. **Run development server:**
   ```bash
   npm run dev
   ```

## Deployment to Supabase/Vercel

### 1. Database Setup

Execute `supabase_schema.sql` in your Supabase SQL Editor to create all tables and relationships.

### 2. Environment Variables

In Vercel dashboard, add these environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Deploy

```bash
npm run deploy:full
```

This will build and deploy to Vercel with proper SPA routing.

## Migration from Firebase

This project was migrated from Firebase/Firestore to Supabase. If you previously deployed to Firebase Hosting, make sure to remove or replace the hosted artifacts (see `scripts/remove-firebase-hosting.md`).

Recommended migration checklist:

- Ensure `supabase_schema.sql` has been applied to your Supabase project.
- Migrate Firestore data exports into Supabase tables (transform as needed).
- Switch client env vars to `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and remove Firebase SDK usage.

## Project Structure

```
├── apps/                 # Individual applications
│   ├── admin/           # Admin dashboard
│   ├── carrier/         # Carrier management
│   ├── agent/           # Agent interface
│   ├── driver/          # Driver app
│   └── landing/         # Public landing page
├── packages/
│   └── shared/          # Shared components and logic
├── dist_production/     # Built production assets
└── supabase_schema.sql  # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build all apps
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy:full` - Build and deploy to Vercel
