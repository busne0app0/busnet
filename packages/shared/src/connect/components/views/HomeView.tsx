"use client";

import React from 'react';
import {
  ArrowRight,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ConnectPost, ConnectTabType } from '../../types/connect.types';
import { PostCard } from '../PostCard';
import { useAuthStore } from '../../../store/useAuthStore';

interface HomeViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onSelectTab: (tab: ConnectTabType) => void;
  onOpenCreateModal: () => void;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  posts,
  savedPostIds,
  onSelectTab,
  onOpenCreateModal,
  onLike,
  onToggleSave,
  onOpenComments,
  onNavigateToBooking,
}) => {
  const { user } = useAuthStore();
  const topTrending = posts.slice(0, 3);

  const stats = [
    { icon: Users, label: 'Спільнота', value: '14,200+', detail: 'Мандрівників у Європі' },
    { icon: MapPin, label: 'Маршрути', value: '180+', detail: 'Міст Україна — ЄС' },
    { icon: ShieldCheck, label: 'Допомога', value: '24/7', detail: 'Взаємовиручка на дорогах' },
  ];

  return (
    <section aria-label="Головна BUSNET Connect" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section
        aria-labelledby="home-welcome-title"
        className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c182d] via-[#091122] to-[#050a14] p-6 shadow-2xl sm:p-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>СОЦІАЛЬНИЙ ХАБ МАНДРІВНИКІВ ЄВРОПИ</span>
          </div>

          <h1 id="home-welcome-title" className="mb-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            {`Вітаємо${user?.firstName?.trim() ? `, ${user.firstName.trim()}` : ' у'} `}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">BUSNET CONNECT</span>
          </h1>

          <p className="mb-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            Перший український простір для тих, хто подорожує або живе в Європі. Знаходьте перевірених попутників, передавайте посилки, дізнавайтеся реальну ситуацію на кордонах та діліться власним досвідом.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(0,212,255,0.24)] transition-all hover:from-cyan-300 hover:to-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 sm:text-sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              <span>Створити публікацію</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('community')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:text-sm"
            >
              <span>Відкрити стрічку</span>
              <ArrowRight className="size-4 text-cyan-300" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div role="group" aria-label="Коротко про спільноту" className="mt-8 grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-6 sm:grid-cols-3 sm:gap-4">
          {stats.map(({ icon: Icon, label, value, detail }) => (
            <div key={label} className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-4 transition-colors hover:border-cyan-400/20">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-cyan-200">{label}</span>
                <Icon className="size-4 text-cyan-300" aria-hidden="true" />
              </div>
              <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-trending-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-cyan-300" aria-hidden="true" />
            <h2 id="home-trending-title" className="text-lg font-semibold tracking-tight text-white">Актуальні обговорення</h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('community')}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-300/10 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <span>Всі публікації</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {topTrending.length === 0 ? (
          <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0c1424] px-6 py-10 text-center text-slate-400">
            <MessageSquare className="size-5 text-cyan-300" aria-hidden="true" />
            <p className="max-w-md text-sm leading-relaxed">Публікацій поки що немає. Будьте першим, хто поділиться історією!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topTrending.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={savedPostIds.includes(p.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
};
