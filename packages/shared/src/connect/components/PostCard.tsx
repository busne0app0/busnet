import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Copy,
  Flag,
  Heart,
  MapPin,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Package,
  Share2,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ConnectPost, ConnectPostType } from '../types/connect.types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: ConnectPost;
  isSaved?: boolean;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDelete?: (postId: string) => void;
  onReport?: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

type PostTypePresentation = {
  label: string;
  icon: LucideIcon;
};

const getTypePresentation = (type: ConnectPostType): PostTypePresentation => {
  switch (type) {
    case 'buddy':
      return { label: 'Попутники', icon: Users };
    case 'parcel':
      return { label: 'Посилка', icon: Package };
    case 'border':
      return { label: 'Кордон Live', icon: AlertTriangle };
    case 'review':
      return { label: 'Відгук', icon: CheckCircle2 };
    case 'tips':
      return { label: 'Порада', icon: CheckCircle2 };
    case 'news':
      return { label: 'Новина', icon: CheckCircle2 };
    default:
      return { label: 'Історія', icon: CheckCircle2 };
  }
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isSaved = false,
  onLike,
  onToggleSave,
  onOpenComments,
  onDelete,
  onReport,
  onNavigateToBooking,
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const lastTapRef = useRef(0);
  const heartTimeoutRef = useRef<number | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const openImageButtonRef = useRef<HTMLButtonElement>(null);
  const closeImageButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const isAuthor = user?.uid === post.userId;
  const hasLiked = Boolean(user && post.likedBy?.includes(user.uid));
  const typePresentation = getTypePresentation(post.postType);
  const TypeIcon = typePresentation.icon;

  const initials = (post.authorName || 'U')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const createdAt = new Date(post.createdAt);
  const hasValidDate = !Number.isNaN(createdAt.getTime());
  const formattedDate = hasValidDate
    ? new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(createdAt)
    : 'Щойно';

  useEffect(() => {
    return () => {
      if (heartTimeoutRef.current !== null) {
        window.clearTimeout(heartTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!isImageOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsImageOpen(false);
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        closeImageButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeImageButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      openImageButtonRef.current?.focus();
    };
  }, [isImageOpen]);

  const handleDoubleTap = () => {
    const now = Date.now();

    if (now - lastTapRef.current < 320) {
      if (!hasLiked) {
        onLike(post.id);
      }

      setShowHeartAnim(true);

      if (heartTimeoutRef.current !== null) {
        window.clearTimeout(heartTimeoutRef.current);
      }

      heartTimeoutRef.current = window.setTimeout(() => {
        setShowHeartAnim(false);
        heartTimeoutRef.current = null;
      }, 800);
    }

    lastTapRef.current = now;
  };

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Не вдалося скопіювати. Перевірте дозволи браузера.');
    }
  };

  const handleShare = () => {
    const postSlugOrId = encodeURIComponent(post.slug || post.id);
    const postUrl = `${window.location.origin}/connect/post/${postSlugOrId}`;
    void copyToClipboard(postUrl, 'Посилання на публікацію скопійовано');
  };

  const handleCopyText = () => {
    const fullText = `${post.title ? `${post.title}\n\n` : ''}${post.content}`;
    void copyToClipboard(fullText, 'Текст публікації скопійовано');
  };

  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(#[a-zA-Zа-яА-ЯіІїЇєЄ0-9_]+|@[a-zA-Z0-9_]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <button
            key={`${part}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toast(`Пошук за тегом ${part}`);
            }}
            className="font-semibold text-cyan-200 transition-colors hover:text-cyan-100 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {part}
          </button>
        );
      }

      if (part.startsWith('@')) {
        return (
          <span key={`${part}-${index}`} className="font-semibold text-sky-200">
            {part}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <article className="relative flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-[#0c1420] p-4 transition-colors hover:border-white/[0.13] sm:gap-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt=""
              loading="lazy"
              className="h-11 w-11 shrink-0 rounded-full border border-white/[0.1] object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-200/15 bg-cyan-200/[0.07] text-xs font-semibold text-cyan-100"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-white sm:text-[15px]">
                {post.authorName}
              </span>
              {post.authorVerified && (
                <span
                  aria-label="Верифікований мандрівник"
                  title="Верифікований мандрівник"
                  className="inline-flex shrink-0 text-cyan-200"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <time dateTime={hasValidDate ? createdAt.toISOString() : undefined}>{formattedDate}</time>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                <TypeIcon className="h-3.5 w-3.5 text-cyan-200" aria-hidden="true" />
                {typePresentation.label}
              </span>
            </div>
          </div>
        </div>

        <div ref={menuRootRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMenu((isOpen) => !isOpen)}
            aria-label="Дії з дописом"
            aria-expanded={showMenu}
            aria-controls={menuId}
            title="Дії з дописом"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>

          {showMenu && (
            <div
              id={menuId}
              aria-label="Дії з дописом"
              className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border border-white/[0.1] bg-[#111a27] p-1.5 shadow-2xl shadow-black/30"
            >
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleCopyText();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Copy className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Копіювати текст</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleShare();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Share2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Поділитися</span>
              </button>

              {user && onReport && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onReport(post);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-amber-200 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Flag className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  <span>Поскаржитися</span>
                </button>
              )}

              {isAuthor && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('Видалити цю публікацію?')) {
                      onDelete(post.id);
                    }
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300 transition-colors hover:bg-rose-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Видалити</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {(post.routeFrom || post.routeTo) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            <span className="max-w-[40%] truncate font-medium text-slate-100">
              {post.routeFrom || '—'}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span className="max-w-[40%] truncate font-medium text-slate-100">
              {post.routeTo || '—'}
            </span>
          </div>

          {onNavigateToBooking && post.routeFrom && post.routeTo && (
            <button
              type="button"
              onClick={() => onNavigateToBooking(post.routeFrom!, post.routeTo!)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-full px-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-200/[0.08] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:self-auto"
            >
              <span>Знайти квиток</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {post.postType === 'border' && (
        <aside className="flex items-start gap-2.5 rounded-2xl border border-amber-200/10 bg-amber-200/[0.035] p-3 text-xs leading-5 text-amber-100/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-amber-100">Повідомлення мандрівника.</strong>{' '}
            Інформація базується на особистому досвіді користувача та не є офіційними даними прикордонних служб.
          </p>
        </aside>
      )}

      <div className="flex flex-col gap-2">
        {post.title && (
          <h2 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-lg">
            {post.title}
          </h2>
        )}
        <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
          {renderFormattedContent(post.content)}
        </p>
      </div>

      {post.imageUrl && (
        <div
          onClick={handleDoubleTap}
          title="Двічі натисніть, щоб вподобати"
          className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20"
        >
          <img
            src={post.imageUrl}
            alt={post.title || 'Зображення публікації'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover/image:scale-[1.02]"
          />

          <button
            ref={openImageButtonRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsImageOpen(true);
            }}
            aria-label="Відкрити зображення на весь екран"
            title="Відкрити на весь екран"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white opacity-100 backdrop-blur transition-opacity hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </button>

          {showHeartAnim && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="h-20 w-20 animate-ping fill-rose-400 text-rose-400 drop-shadow-[0_0_24px_rgba(251,113,133,0.45)]" />
            </div>
          )}
        </div>
      )}

      <footer className="flex items-center justify-between border-t border-white/[0.07] pt-3 text-slate-400">
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => onLike(post.id)}
            aria-label={`${hasLiked ? 'Зняти вподобання' : 'Вподобати'} · ${post.likesCount || 0}`}
            aria-pressed={hasLiked}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${hasLiked ? 'font-semibold text-rose-300' : 'hover:text-rose-300'
              }`}
          >
            <Heart
              className={`h-[18px] w-[18px] ${hasLiked ? 'fill-rose-300' : ''}`}
              aria-hidden="true"
            />
            <span>{post.likesCount || 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenComments(post)}
            aria-label={`Коментарі · ${post.commentsCount || 0}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <MessageSquare className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>{post.commentsCount || 0}</span>
          </button>

          {post.viewsCount > 0 && (
            <span
              aria-label={`Перегляди · ${post.viewsCount}`}
              className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.viewsCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSave(post.id)}
            aria-label={isSaved ? 'Прибрати зі збереженого' : 'Зберегти допис'}
            aria-pressed={isSaved}
            title={isSaved ? 'Прибрати зі збереженого' : 'Зберегти допис'}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isSaved
                ? 'bg-cyan-200/[0.08] text-cyan-200'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-cyan-200' : ''}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="Поділитися посиланням на допис"
            title="Поділитися посиланням"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>

      {isImageOpen && post.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Перегляд фото"
          onClick={() => setIsImageOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            ref={closeImageButtonRef}
            type="button"
            onClick={() => setIsImageOpen(false)}
            aria-label="Закрити перегляд фото"
            title="Закрити"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition-colors hover:bg-white/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img
            src={post.imageUrl}
            alt={post.title || 'Фото публікації у повному розмірі'}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </article>
  );
};
