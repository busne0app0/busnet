"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  MapPin,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Camera,
  Loader2,
  Trash2,
  Clock
} from 'lucide-react';
import type { ConnectPostType } from '../types/connect.types';
import { useAuthStore } from '../../store/useAuthStore';
import { uploadPostMedia } from '../services/connectMediaService';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title?: string;
    content: string;
    category: string;
    postType: ConnectPostType;
    imageUrl?: string;
    routeFrom?: string;
    routeTo?: string;
    meta?: Record<string, string | number>;
    isPublic?: boolean;
  }) => Promise<unknown>;
  isSubmitting?: boolean;
}

const POPULAR_CITIES = ['Київ', 'Львів', 'Рим', 'Мілан', 'Болонья', 'Варшава'];
const BORDER_CHECKPOINTS = ['Краківець', 'Шегині', 'Рава-Руська', 'Чоп', 'Порубне', 'Устилуг'];
const BORDER_HOURS = [
  { label: 'до 1 год', val: '1' },
  { label: '2–3 год', val: '2.5' },
  { label: '4–6 год', val: '5' },
  { label: '8+ год', val: '8' },
];


export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<ConnectPostType>('blog');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Meta attributes
  const [parcelWeight, setParcelWeight] = useState('');
  const [parcelReward, setParcelReward] = useState('');
  const [buddySeats, setBuddySeats] = useState<number>(1);
  const [checkpoint, setCheckpoint] = useState('');
  const [checkpointHours, setCheckpointHours] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(!isSubmitting);
  onCloseRef.current = onClose;
  canCloseRef.current = !isSubmitting;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const activeElement = document.activeElement;
    previousFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (canCloseRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]):not([type="file"]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Пункт 31 & 32: Завантаження фото прямо з файлової системи / камери
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Будь ласка, авторизуйтесь для прикріплення фото');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, оберіть файл зображення');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Розмір фото має бути не більше 10 МБ');
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading('Оптимізація та завантаження фото...');

    try {
      const { url, error } = await uploadPostMedia(user.uid, file);
      if (error || !url) throw new Error(error || 'Помилка завантаження фото');

      setImageUrl(url);
      toast.success('Фото додано!', { id: toastId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Не вдалося завантажити зображення';
      toast.error(message, { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Будь ласка, введіть текст публікації');
      return;
    }

    const meta: Record<string, string | number> = {};
    if (postType === 'parcel') {
      if (parcelWeight) meta.parcelWeight = parcelWeight;
      if (parcelReward) meta.parcelReward = parcelReward;
    } else if (postType === 'buddy') {
      meta.buddySeats = Number(buddySeats) || 1;
    } else if (postType === 'border') {
      if (checkpoint) meta.checkpoint = checkpoint;
      if (checkpointHours) meta.checkpointWaitHours = parseFloat(checkpointHours) || 0;
    }

    const categoryNames: Record<ConnectPostType, string> = {
      blog: 'Історії мандрівників',
      buddy: 'Пошук попутників',
      parcel: 'Посилки та передачі',
      border: 'Кордон Live',
      review: 'Відгуки про рейси',
      tips: 'Поради',
      questions: 'Питання та відповіді',
      news: 'Новини',
      general: 'Загальне',
    };

    try {
      await onSubmit({
        title: title.trim() || undefined,
        content: content.trim(),
        category: categoryNames[postType] || 'Загальне',
        postType,
        imageUrl: imageUrl.trim() || undefined,
        routeFrom: routeFrom.trim() || undefined,
        routeTo: routeTo.trim() || undefined,
        meta,
        isPublic,
      });

      setPostType('blog');
      setTitle('');
      setContent('');
      setImageUrl('');
      setRouteFrom('');
      setRouteTo('');
      setIsPublic(true);
      setParcelWeight('');
      setParcelReward('');
      setBuddySeats(1);
      setCheckpoint('');
      setCheckpointHours('');
      onClose();
    } catch (err) {
      // Error handled by store toast
    }
  };

  const types: { id: ConnectPostType; label: string; icon: LucideIcon }[] = [
    { id: 'blog', label: 'Історія / Блог', icon: Sparkles },
    { id: 'buddy', label: 'Попутники', icon: Users },
    { id: 'parcel', label: 'Посилка', icon: Package },
    { id: 'border', label: 'Кордон Live', icon: AlertTriangle },
    { id: 'tips', label: 'Порада', icon: CheckCircle2 },
    { id: 'questions', label: 'Запитання', icon: HelpCircle },
  ];

  return (
    <div
      role="presentation"
      onClick={() => {
        if (canCloseRef.current) onCloseRef.current();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        aria-describedby="create-post-description"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#0e1627] shadow-2xl outline-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <header className="flex items-center justify-between border-b border-slate-800 bg-[#0a101d] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="create-post-title" className="text-base font-semibold text-white sm:text-lg">Створити публікацію</h2>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 sm:text-xs">
              CONNECT
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрити форму створення публікації"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <p id="create-post-description" className="sr-only">Форма створення публікації для спільноти BUSNET Connect.</p>

        <form onSubmit={handleSubmit} aria-busy={isSubmitting || isUploadingImage} className="space-y-4 overflow-y-auto p-4 text-xs sm:p-5">
          <fieldset>
            <legend className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Тип публікації
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = postType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPostType(type.id)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Route Fields + Quick Autocomplete Cities (Пункт 33) */}
          {(postType === 'buddy' || postType === 'parcel' || postType === 'border' || postType === 'blog') && (
            <div className="space-y-2 p-3 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="post-route-from" className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Звідки (місто)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-3.5 text-cyan-300" aria-hidden="true" />
                    <input
                      id="post-route-from"
                      type="text"
                      autoComplete="off"
                      value={routeFrom}
                      onChange={(e) => setRouteFrom(e.target.value)}
                      placeholder="Київ, Львів, Рим..."
                      className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-[#0b1220] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="post-route-to" className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Куди (місто)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 size-3.5 text-cyan-300" aria-hidden="true" />
                    <input
                      id="post-route-to"
                      type="text"
                      autoComplete="off"
                      value={routeTo}
                      onChange={(e) => setRouteTo(e.target.value)}
                      placeholder="Мілан, Рим, Варшава..."
                      className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-[#0b1220] py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                    />
                  </div>
                </div>
              </div>

              {/* Швидкі підказки міст */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 mr-1">Швидкий вибір:</span>
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    aria-label={`Додати місто ${city}`}
                    onClick={() => {
                      if (!routeFrom) setRouteFrom(city);
                      else if (!routeTo) setRouteTo(city);
                      else setRouteTo(city);
                    }}
                    className="min-h-11 rounded-lg bg-slate-800/80 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-cyan-500/20 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                  >
                    + {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type-Specific Fields */}
          {postType === 'parcel' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/20">
              <div>
                <label htmlFor="parcel-weight" className="mb-1 block text-[11px] font-medium text-amber-200">Орієнтовна вага</label>
                <input
                  id="parcel-weight"
                  type="text"
                  value={parcelWeight}
                  onChange={(e) => setParcelWeight(e.target.value)}
                  placeholder="до 2 кг, документи, коробка"
                  className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-[#0b1220] px-3 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                />
              </div>
              <div>
                <label htmlFor="parcel-reward" className="mb-1 block text-[11px] font-medium text-amber-200">Винагорода (опціонально)</label>
                <input
                  id="parcel-reward"
                  type="text"
                  value={parcelReward}
                  onChange={(e) => setParcelReward(e.target.value)}
                  placeholder="25 €, 1000 грн, договірна"
                  className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-[#0b1220] px-3 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                />
              </div>
            </div>
          )}

          {postType === 'buddy' && (
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
              <p id="buddy-seats-label" className="mb-2 block text-[11px] font-medium text-emerald-200">Вільні місця в дорозі</p>
              <div role="group" aria-labelledby="buddy-seats-label" className="flex flex-wrap items-center gap-2">
                {[1, 2, 3, 4, 5, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    aria-pressed={buddySeats === num}
                    aria-label={`${num} ${num === 1 ? 'вільне місце' : 'вільних місця'}`}
                    onClick={() => setBuddySeats(num)}
                    className={`min-h-11 min-w-11 rounded-xl px-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 ${buddySeats === num
                      ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {postType === 'border' && (
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
              <div className="text-[11px] text-rose-300 font-semibold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Черга на пункті пропуску (фіксація в реальному часі)</span>
              </div>

              <div role="group" aria-label="Пункт пропуску" className="flex flex-wrap gap-1.5">
                {BORDER_CHECKPOINTS.map((cp) => (
                  <button
                    key={cp}
                    type="button"
                    aria-pressed={checkpoint === cp}
                    onClick={() => setCheckpoint(cp)}
                    className={`min-h-11 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${checkpoint === cp
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-rose-500/20'
                      }`}
                  >
                    {cp}
                  </button>
                ))}
              </div>

              <div role="group" aria-label="Орієнтовний час очікування" className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                {BORDER_HOURS.map((bh) => (
                  <button
                    key={bh.val}
                    type="button"
                    aria-pressed={checkpointHours === bh.val}
                    onClick={() => setCheckpointHours(bh.val)}
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${checkpointHours === bh.val
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{bh.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="post-title" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Заголовок (опціонально)
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Короткий зміст або тема..."
              maxLength={120}
              className="min-h-11 w-full rounded-xl border border-slate-700/80 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label htmlFor="post-content" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Текст публікації <span className="text-rose-300">*</span>
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Поділіться вашим маршрутом, досвідом або запитанням..."
              className="w-full resize-y rounded-xl border border-slate-700/80 bg-[#0b1220] p-3.5 text-sm leading-relaxed text-white placeholder-slate-500 transition-colors focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
              required
            />
          </div>

          {/* Пункт 31 & 32: Завантаження фото замість посилання */}
          <div>
            <p id="post-photo-label" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Фотографія допису
            </p>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 group">
                <img
                  src={imageUrl}
                  alt="Попередній перегляд фото допису"
                  className="h-44 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  aria-label="Видалити прикріплене фото"
                  className="absolute right-2 top-2 rounded-xl bg-black/75 p-2 text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                  title="Видалити фото"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-[#091122]/50 p-4 text-slate-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 group"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-cyan-300" aria-hidden="true" />
                    <span role="status" className="text-xs font-semibold text-cyan-200">Оптимізація та завантаження фото...</span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-colors">
                      <Camera className="size-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      Прикріпити фото з пристрою
                    </span>
                    <span className="text-[10px] text-slate-500">Автокомпресія у WebP</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Public / Private Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Публічний допис</div>
              <p id="public-post-description" className="text-[11px] leading-relaxed text-slate-400">
                {isPublic
                  ? 'Допис бачать усі мандрівники спільноти'
                  : 'Приватна чернетка: видно лише вам у профілі'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="public-post-toggle"
                type="checkbox"
                role="switch"
                aria-label="Публічний допис"
                aria-describedby="public-post-description"
                aria-checked={isPublic}
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="peer sr-only"
              />
              <div className="relative h-6 w-11 rounded-full bg-slate-800 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-transform after:content-[''] peer-checked:bg-cyan-500 peer-checked:after:translate-x-full peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-200 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || isUploadingImage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:from-cyan-300 hover:to-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              <span aria-live="polite">{isSubmitting ? 'Публікується...' : 'Опублікувати'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
