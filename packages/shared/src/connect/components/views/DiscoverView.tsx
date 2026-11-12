import React, { useId, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import type { ConnectPost } from '../../types/connect.types';
import { PostCard } from '../PostCard';

interface DiscoverViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

type RecommendedRoute = {
  from: string;
  to: string;
};

const recommendedRoutes: RecommendedRoute[] = [
  { from: 'Київ', to: 'Рим' },
  { from: 'Львів', to: 'Мілан' },
  { from: 'Київ', to: 'Варшава' },
  { from: 'Івано-Франківськ', to: 'Болонья' },
];

const normalizeRoutePart = (value?: string | null) =>
  value?.trim().toLocaleLowerCase('uk-UA') ?? '';

const getPostCountLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits === 11) return 'дописів';
  if (lastDigit === 1) return 'допис';
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return 'дописи';
  }

  return 'дописів';
};

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  posts,
  savedPostIds,
  onLike,
  onToggleSave,
  onOpenComments,
  onNavigateToBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<RecommendedRoute | null>(null);
  const searchId = useId();
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('uk-UA');

  const filteredPosts = useMemo(() => {
    if (selectedRoute) {
      const expectedFrom = normalizeRoutePart(selectedRoute.from);
      const expectedTo = normalizeRoutePart(selectedRoute.to);

      return posts.filter(
        (post) =>
          normalizeRoutePart(post.routeFrom) === expectedFrom &&
          normalizeRoutePart(post.routeTo) === expectedTo,
      );
    }

    if (!normalizedSearchTerm) {
      return posts.slice(0, 4);
    }

    return posts.filter((post) => {
      const searchableFields = [
        post.title,
        post.content,
        post.authorName,
        post.routeFrom,
        post.routeTo,
      ];

      return searchableFields.some((field) =>
        field?.toLocaleLowerCase('uk-UA').includes(normalizedSearchTerm),
      );
    });
  }, [normalizedSearchTerm, posts, selectedRoute]);

  const hasSearch = normalizedSearchTerm.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="discover-heading"
        className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1420] p-5 sm:p-7 lg:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-cyan-300/[0.08] blur-3xl"
        />

        <div className="relative flex flex-col gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Спільнота мандрівників
            </span>
            <h1
              id="discover-heading"
              className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Відкрийте свій наступний маршрут
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Знайдіть попутників, корисні поради та досвід людей, які вже подорожували вашим напрямком.
            </p>
          </div>

          <div className="relative max-w-3xl">
            <label htmlFor={searchId} className="sr-only">
              Пошук за містом, ім&apos;ям автора або темою
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedRoute(null);
              }}
              placeholder="Місто, ім&apos;я або тема"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-white/[0.1] bg-[#080d15]/80 pl-11 pr-12 text-sm text-white outline-none transition-colors placeholder:text-slate-500 hover:border-white/[0.16] focus-visible:border-cyan-200/50 focus-visible:ring-2 focus-visible:ring-cyan-200/15"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoute(null);
                }}
                aria-label="Очистити пошуковий запит"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="popular-routes-heading" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-200" aria-hidden="true" />
          <h2
            id="popular-routes-heading"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"
          >
            Рекомендовані напрямки
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {recommendedRoutes.map((route) => {
            const isSelected =
              selectedRoute?.from === route.from && selectedRoute?.to === route.to;

            return (
              <button
                key={`${route.from}-${route.to}`}
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRoute(isSelected ? null : route);
                }}
                aria-label={
                  isSelected
                    ? `Скасувати фільтр маршруту ${route.from} — ${route.to}`
                    : `Показати дописи маршруту ${route.from} — ${route.to}`
                }
                aria-pressed={isSelected}
                className={`group flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${isSelected
                    ? 'border-cyan-200/25 bg-cyan-200/[0.06]'
                    : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.13] hover:bg-white/[0.05]'
                  }`}
              >
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-100">
                    <span className="truncate">{route.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span className="truncate">{route.to}</span>
                  </span>
                  <span className="text-xs text-slate-500">Рекомендований маршрут</span>
                </span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-cyan-200"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="discover-results-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.07] pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              BUSNET Connect
            </p>
            <h2
              id="discover-results-heading"
              className="mt-1 text-base font-semibold tracking-tight text-white"
            >
              {selectedRoute
                ? `Маршрут: ${selectedRoute.from} → ${selectedRoute.to}`
                : hasSearch
                  ? `Результати за запитом «${searchTerm.trim()}»`
                  : 'Рекомендовані дописи'}
            </h2>
          </div>
          <p className="text-xs text-slate-500" aria-live="polite">
            {filteredPosts.length} {getPostCountLabel(filteredPosts.length)}
          </p>
        </div>

        {filteredPosts.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center rounded-3xl border border-white/[0.08] bg-white/[0.025] px-5 py-12 text-center sm:py-14"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.04] text-slate-300">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-white">Нічого не знайдено</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Спробуйте інше місто, ім&apos;я автора або ключове слово.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRoute(null);
              }}
              className="mt-5 inline-flex h-9 items-center justify-center rounded-full border border-white/[0.12] px-4 text-xs font-medium text-slate-200 transition-colors hover:border-white/[0.2] hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              Скинути фільтри
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSaved={savedPostIds.includes(post.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
