import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  Camera,
  Check,
  Copy,
  Edit3,
  FileText,
  Globe,
  Heart,
  Instagram,
  Loader2,
  Lock,
  MapPin,
  QrCode,
  Send,
  Share2,
  Shield,
  X,
} from 'lucide-react';
import type { ConnectPost } from '../../types/connect.types';
import { PostCard } from '../PostCard';
import { useAuthStore } from '../../../store/useAuthStore';
import { uploadUserAvatar } from '../../services/connectMediaService';
import toast from 'react-hot-toast';

interface ProfileViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDeletePost: (postId: string) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

const getSafeWebsiteUrl = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';

  try {
    const normalizedValue = /^https?:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;
    const url = new URL(normalizedValue);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  posts,
  savedPostIds,
  onLike,
  onToggleSave,
  onOpenComments,
  onDeletePost,
  onNavigateToBooking,
}) => {
  const { user, updateUserProfile } = useAuthStore();
  const [profileTab, setProfileTab] = useState<'my_posts' | 'saved' | 'private'>('my_posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogCloseButtonRef = useRef<HTMLButtonElement>(null);
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isEditing && !showQrModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogCloseButtonRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEditing(false);
        setShowQrModal(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleDialogKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDialogKeyDown);
      dialogTriggerRef.current?.focus();
    };
  }, [isEditing, showQrModal]);

  // Form state for profile editing (Instagram-like)
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || user?.address || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  useEffect(() => {
    if (isEditing) return;

    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setBio(user?.bio ?? '');
    setCity(user?.city || user?.address || '');
    setWebsite(user?.website ?? '');
    setInstagram(user?.instagram ?? '');
    setTelegram(user?.telegram ?? '');
    setAvatarUrl(user?.avatar ?? '');
  }, [
    isEditing,
    user?.uid,
    user?.firstName,
    user?.lastName,
    user?.bio,
    user?.city,
    user?.address,
    user?.website,
    user?.instagram,
    user?.telegram,
    user?.avatar,
  ]);

  useEffect(() => {
    setProfileUrl(`${window.location.origin}/connect?tab=profile`);
  }, []);

  const myPublicPosts = user ? posts.filter(p => p.userId === user.uid && p.isPublic !== false) : [];
  const myPrivatePosts = user ? posts.filter(p => p.userId === user.uid && p.isPublic === false) : [];
  const savedPosts = posts.filter(p => savedPostIds.includes(p.id));

  const totalLikes = myPublicPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.email?.split('@')[0] || 'Мандрівник BUSNET');

  const initials = (
    (user?.firstName?.[0] || user?.email?.[0] || 'U') +
    (user?.lastName?.[0] || '')
  ).toUpperCase();

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;
    if (!user) {
      input.value = '';
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error('Оберіть фото у форматі JPEG, PNG або WebP');
      input.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Розмір фото має бути не більшим за 10 МБ');
      input.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    const loadingToast = toast.loading('Оптимізація та завантаження фото...');

    try {
      const { url, error } = await uploadUserAvatar(user.uid, file);
      if (error || !url) throw new Error(error || 'Помилка отримання посилання на фото');

      await updateUserProfile({ avatar: url });
      setAvatarUrl(url);
      toast.success('Аватар успішно оновлено!', { id: loadingToast });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не вдалося завантажити фото';
      toast.error(message, { id: loadingToast });
    } finally {
      setIsUploadingAvatar(false);
      input.value = '';
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const normalizedWebsite = getSafeWebsiteUrl(website);
    if (website.trim() && !normalizedWebsite) {
      toast.error('Вкажіть коректне посилання з протоколом http або https');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        website: normalizedWebsite,
        instagram: instagram.trim().replace(/^@+/, ''),
        telegram: telegram.trim().replace(/^@+/, ''),
        avatar: avatarUrl.trim() || undefined,
      });
      setIsEditing(false);
      toast.success('Профіль успішно оновлено!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Помилка оновлення профілю';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const safeWebsiteUrl = getSafeWebsiteUrl(user?.website ?? '');

  const handleCopyProfileLink = async () => {
    if (!profileUrl || !navigator.clipboard) {
      toast.error('Копіювання посилання недоступне в цьому браузері');
      return;
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      toast.success('Посилання на профіль скопійовано');
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error('Не вдалося скопіювати посилання');
    }
  };

  return (
    <section aria-label="Профіль користувача" className="mx-auto w-full max-w-4xl space-y-6">
      {/* Прихований інпут для вибору файлу аватарки */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Обрати фото профілю"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* ── INSTAGRAM-STYLE PROFILE HEADER CARD ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c182d] via-[#091122] to-[#060a14] border border-cyan-500/25 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          {/* Avatar with status ring + direct upload button */}
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-cyan-400 p-0.5 shadow-[0_0_25px_rgba(0,212,255,0.35)]"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-slate-800 border-2 border-cyan-400/50 flex items-center justify-center font-black text-3xl text-cyan-300 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                {initials}
              </div>
            )}

            {/* Camera Overlay for quick direct upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label={isUploadingAvatar ? 'Фото завантажується' : 'Завантажити фото профілю'}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 hover:scale-110 active:scale-95 shadow-lg transition-transform border-2 border-[#091122] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              title="Завантажити фото з телефону"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Profile Bio Details */}
          <div className="space-y-2.5 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {fullName}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Мандрівник BUSNET
              </span>
            </div>

            {/* City / Location */}
            {(user?.city || user?.address) && (
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.city || user.address}</span>
              </div>
            )}

            {/* Custom Bio Description */}
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed whitespace-pre-line">
              {user?.bio || 'Мандрівник у просторі BUSNET CONNECT. Ділюся враженнями від поїздок Україна — Італія — ЄС, допомагаю попутникам та відстежую ситуацію на кордоні.'}
            </p>

            {/* Social Links (Instagram, Telegram, Web) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 text-xs">
              {user?.instagram && (
                <a
                  href={`https://www.instagram.com/${encodeURIComponent(user.instagram.replace(/^@+/, ''))}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-pink-400 hover:text-pink-300 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20"
                >
                  <Instagram className="w-3 h-3" />
                  <span>@{user.instagram.replace(/^@+/, '')}</span>
                </a>
              )}
              {user?.telegram && (
                <a
                  href={`https://t.me/${encodeURIComponent(user.telegram.replace(/^@+/, ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
                >
                  <Send className="w-3 h-3" />
                  <span>@{user.telegram}</span>
                </a>
              )}
              {user?.website && safeWebsiteUrl && (
                <a
                  href={safeWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                >
                  <Globe className="w-3 h-3" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {/* Stats Counter Bar (Posts, Likes, Saved, Points) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{myPublicPosts.length}</span>
                <span className="text-slate-400">д��писів</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white">{totalLikes}</span>
                <span className="text-slate-400">вподобань</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">{savedPosts.length}</span>
                <span className="text-slate-400">закладок</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{user?.loyaltyPoints ?? 0}</span>
                <span className="text-slate-400">бонусів</span>
              </div>
            </div>

            {/* Quick Action Buttons (Edit, QR-Code, Share) */}
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-2">
              <button
                type="button"
                onClick={(event) => {
                  dialogTriggerRef.current = event.currentTarget;
                  setIsEditing(true);
                }}
                aria-haspopup="dialog"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center space-x-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Редагувати профіль</span>
              </button>

              {/* Пункт 8: Кнопка QR-коду профілю */}
              <button
                type="button"
                onClick={(event) => {
                  dialogTriggerRef.current = event.currentTarget;
                  setShowQrModal(true);
                }}
                aria-label="Показати QR-код профілю"
                aria-haspopup="dialog"
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 hover:border-cyan-500/40 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                title="Показати QR-код профілю"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCopyProfileLink}
                aria-label={copiedLink ? 'Посилання скопійовано' : 'Поділитися профілем'}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                title="Поділитися профілем"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showQrModal && (
        <div
          role="presentation"
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-qr-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl border border-cyan-500/30 bg-[#0b1220] p-6 text-center shadow-2xl outline-none"
          >
            <button
              ref={dialogCloseButtonRef}
              type="button"
              onClick={() => setShowQrModal(false)}
              aria-label="Закрити QR-код"
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>

            <h2 id="profile-qr-title" className="text-base font-semibold text-white">
              QR-код мандрівника
            </h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-slate-400">
              Покажіть цей код попутнику, щоб він швидко перейшов до вашого профілю.
            </p>

            <div className="inline-block rounded-2xl border border-cyan-500/15 bg-[#060a12] p-3 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}&bgcolor=6-10-18&color=00d4ff`}
                alt={`QR-код для переходу до профілю ${fullName}`}
                referrerPolicy="no-referrer"
                className="h-48 w-48 rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyProfileLink}
              className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Скопіювати посилання</span>
            </button>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditing && (
        <div
          role="presentation"
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#0e1627] shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#0a101d] px-5 py-4 sm:px-6">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span id="profile-edit-title" className="text-white">Редагування профілю</span>
              </div>
              <button
                ref={dialogCloseButtonRef}
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Закрити редагування профілю"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="max-h-[calc(100dvh-8rem)] space-y-4 overflow-y-auto p-5 text-xs sm:p-6">
              {/* Фото кнопка всередині форми */}
              <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`Аватар профілю ${fullName}`} className="w-12 h-12 rounded-full object-cover border border-cyan-400" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-300 font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Обрати нове фото профілю"
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold hover:bg-cyan-500/30 transition-all flex items-center space-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Обрати фото з пристрою</span>
                  </button>
                  <span className="text-[10px] text-slate-500 block mt-1">Автоматичне стиснення у WebP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-first-name" className="mb-1 block font-bold text-slate-400">Ім&apos;я</label>
                  <input
                    id="profile-first-name"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder="Ваше ім'я"
                  />
                </div>
                <div>
                  <label htmlFor="profile-last-name" className="mb-1 block font-bold text-slate-400">Прізвище</label>
                  <input
                    id="profile-last-name"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder="Прізвище"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-city" className="mb-1 block font-bold text-slate-400">Місто проживання / Маршрут</label>
                <input
                  id="profile-city"
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  placeholder="Мілан, Рим, Львів, Київ..."
                />
              </div>

              <div>
                <label htmlFor="profile-bio" className="mb-1 block font-bold text-slate-400">Опис профілю (Bio)</label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={250}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 resize-none leading-relaxed"
                  placeholder="Розкажіть трохи про себе, ваші подорожі чи чим можете бути корисні іншим..."
                />
                <div aria-live="polite" className="text-right text-[10px] text-slate-500">{bio.length}/250</div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-instagram" className="mb-1 block font-bold text-slate-400">Instagram (нікнейм)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">@</span>
                    <input
                      id="profile-instagram"
                      type="text"
                      autoComplete="off"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full bg-[#080d17] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                      placeholder="username"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="profile-telegram" className="mb-1 block font-bold text-slate-400">Telegram (нікнейм)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">@</span>
                    <input
                      id="profile-telegram"
                      type="text"
                      autoComplete="off"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full bg-[#080d17] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="profile-website" className="mb-1 block font-bold text-slate-400">Веб-сайт або посилання</label>
                <input
                  id="profile-website"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  aria-busy={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Збереження...</span>
                    </>
                  ) : (
                    'Зберегти зміни'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        role="group"
        aria-label="Публікації профілю"
        className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0c1424] p-1"
      >
        <button
          type="button"
          aria-pressed={profileTab === 'my_posts'}
          onClick={() => setProfileTab('my_posts')}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:px-4 ${profileTab === 'my_posts'
            ? 'bg-cyan-300 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            }`}
        >
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Мої публікації ({myPublicPosts.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={profileTab === 'private'}
          onClick={() => setProfileTab('private')}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:px-4 ${profileTab === 'private'
            ? 'bg-cyan-300 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            }`}
        >
          <Lock className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
          <span>Приватні дописи ({myPrivatePosts.length})</span>
        </button>

        <button
          type="button"
          aria-pressed={profileTab === 'saved'}
          onClick={() => setProfileTab('saved')}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:px-4 ${profileTab === 'saved'
            ? 'bg-cyan-300 text-slate-950 shadow-sm'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
            }`}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Збережені закладки ({savedPosts.length})</span>
        </button>
      </div>

      {/* ── POSTS LIST ── */}
      <div className="space-y-4">
        {profileTab === 'my_posts' && (
          myPublicPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас поки немає публічних дописів. Поділіться своєю першою історією в розділі «Спільнота»!
            </div>
          ) : (
            myPublicPosts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={savedPostIds.includes(p.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onDelete={onDeletePost}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))
          )
        )}

        {profileTab === 'private' && (
          myPrivatePosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас немає приватних публікацій. При створенні допису ви можете вимкнути тумблер «Публічна публікація», і допис бачитимете лише ви.
            </div>
          ) : (
            myPrivatePosts.map(p => (
              <div key={p.id} className="relative">
                <div className="mb-1 text-[10px] text-amber-400 font-bold flex items-center space-x-1 pl-2">
                  <Lock className="w-3 h-3" />
                  <span>Приватний допис (не відображається в загальній стрічці)</span>
                </div>
                <PostCard
                  post={p}
                  isSaved={savedPostIds.includes(p.id)}
                  onLike={onLike}
                  onToggleSave={onToggleSave}
                  onOpenComments={onOpenComments}
                  onDelete={onDeletePost}
                  onNavigateToBooking={onNavigateToBooking}
                />
              </div>
            ))
          )
        )}

        {profileTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас немає збережених публікацій. Натисніть на значок закладки в будь-якому дописі, щоб зберегти його тут.
            </div>
          ) : (
            savedPosts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={true}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onDelete={onDeletePost}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))
          )
        )}
      </div>
    </section>
  );
};
