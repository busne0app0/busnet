import React, { useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Globe,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Package,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ConnectPost, ConnectPostType } from '../../types/connect.types';
import { StoriesBar } from '../StoriesBar';
import { PostCard } from '../PostCard';

interface CommunityViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  categoryFilter: ConnectPostType | 'all';
  searchQuery: string;
  isLoading: boolean;
  onSetCategoryFilter: (category: ConnectPostType | 'all') => void;
  onSetSearchQuery: (query: string) => void;
  onOpenCreateModal: () => void;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDeletePost: (postId: string) => void;
  onReportPost: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

type SortBy = 'newest' | 'popular' | 'discussed';

type CategoryOption = {
  id: ConnectPostType | 'all';
  label: string;
  icon: LucideIcon;
};

const categories: CategoryOption[] = [
  { id: 'all', label: 'Усі дописи', icon: Globe },
  { id: 'border', label: 'Кордон Live', icon: AlertTriangle },
  { id: 'buddy', label: 'Попутники', icon: Users },
  { id: 'parcel', label: 'Посилки', icon: Package },
  { id: 'blog', label: 'Історії', icon: Sparkles },
  { id: 'review', label: 'Відгуки', icon: CheckCircle2 },
  { id: 'tips', label: 'Поради', icon: Lightbulb },
  { id: 'questions', label: 'Запитання', icon: HelpCircle },
];

const sortOptions: { id: SortBy; label: string; icon: LucideIcon }[] = [
  { id: 'newest', label: 'Свіжі', icon: Clock },
  { id: 'popular', label: 'Популярні', icon: Flame },
  { id: 'discussed', label: 'Обговорювані', icon: MessageSquare },
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  savedPostIds,
  categoryFilter,
  searchQuery,
  isLoading,
  onSetCategoryFilter,
  onSetSearchQuery,
  onOpenCreateModal,
  onLike,
  onToggleSave,
  onOpenComments,
  onDeletePost,
  onReportPost,
  onNavigateToBooking,
}) => {
  const searchId = useId();
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const sortedPosts = useMemo(() => {
    const list = [...posts];

    if (sortBy === 'popular') {
      return list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    if (sortBy === 'discussed') {
      return list.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [posts, sortBy]);

  const emptyTitle = searchQuery.trim()
    ? 'Нічого не знайдено'
    : 'У стрічці поки тихо';
  const emptyDescription = searchQuery.trim()
    ? 'Спробуйте змінити пошуковий запит або вибрати іншу категорію.'
    : 'Поділіться корисною інформацією про подорожі, щоб допомогти іншим мандрівникам.';

  return (
    <div className="flex flex-col gap-7">
      <StoriesBar />

      <section aria-label="Пошук і фільтри дописів" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex min-w-0 flex-1 items-center">
            <label htmlFor={searchId} className="sr-only">
              Пошук за маршрутом, містом або автором
            </label>
            <Search
              className="pointer-events-none absolute left-4 h-[18px] w-[18px] text-slate-500"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(event) => onSetSearchQuery(event.target.value)}
              placeholder="Маршрут, місто або автор"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] pl-11 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-500 hover:border-white/[0.14] focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSetSearchQuery('')}
                aria-label="Очистити пошук"
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="hidden h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 active:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] sm:flex"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Написати допис</span>
          </button>
        </div>

        <nav
          aria-label="Категорії дописів"
          className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(({ id, label, icon: Icon }) => {
            const isSelected = categoryFilter === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSetCategoryFilter(id)}
                aria-pressed={isSelected}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11] ${isSelected
                    ? 'border-white/[0.16] bg-white/[0.09] text-white'
                    : 'border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/[0.13] hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.07] pb-3">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Сортування дописів">
            <span className="mr-1 hidden text-xs text-slate-500 sm:inline">Сортувати:</span>
            {sortOptions.map(({ id, label, icon: Icon }) => {
              const isSelected = sortBy === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSortBy(id)}
                  aria-pressed={isSelected}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isSelected
                      ? 'bg-white/[0.08] text-slate-100'
                      : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500" aria-live="polite">
            {sortedPosts.length} {sortedPosts.length === 1 ? 'допис' : 'дописів'}
          </p>
        </div>
      </section>

      <section aria-label="Стрічка дописів" aria-busy={isLoading} className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4" aria-label="Завантаження дописів">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                aria-hidden="true"
                className="flex flex-col gap-5 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.08]" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.08]" />
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/[0.05]" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
                </div>
                <div className="h-40 animate-pulse rounded-2xl bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-14 text-center sm:py-16">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200">
              <Globe className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-white">{emptyTitle}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{emptyDescription}</p>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 active:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Створити допис</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSaved={savedPostIds.includes(post.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onDelete={onDeletePost}
                onReport={onReportPost}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
