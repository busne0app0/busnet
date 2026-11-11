import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon, Phone, Mail, Calendar, Camera, ShieldCheck,
  X, Check, ZoomIn, ZoomOut, Lock, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { User } from '@busnet/shared/types';

const PREVIEW_SIZE = 256;
const EXPORT_SIZE = 320;

// Конвертер дати для поля <input type="date"> (очікує YYYY-MM-DD)
function toDateInputValue(val?: string): string {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // Якщо збережено як DD.MM.YYYY
  const parts = val.split('.');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

export const ProfileTab: React.FC = () => {
  const { user, updateUserProfile } = useAuthStore();
  const { language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();
  const dateLocale = currentLang === 'EN' ? 'en-GB' : currentLang === 'IT' ? 'it-IT' : 'uk-UA';

  // Локалізація
  const l = {
    title: currentLang === 'EN' ? 'My Profile' : currentLang === 'IT' ? 'Il Mio Profilo' : 'Мій профіль',
    subtitle: currentLang === 'EN' ? 'Personal details, avatar, and security' : currentLang === 'IT' ? 'Dati personali, avatar e sicurezza' : 'Особисті дані, аватарка та безпека',
    statusVerified: currentLang === 'EN' ? 'Verified' : currentLang === 'IT' ? 'Verificato' : 'Підтверджено',
    verificationLabel: currentLang === 'EN' ? 'Verification status' : currentLang === 'IT' ? 'Stato verifica' : 'Статус перевірки',
    joinedLabel: currentLang === 'EN' ? 'Member since' : currentLang === 'IT' ? 'Registrato dal' : 'Дата реєстрації',
    firstName: currentLang === 'EN' ? 'First Name' : currentLang === 'IT' ? 'Nome' : "Ім'я",
    lastName: currentLang === 'EN' ? 'Last Name' : currentLang === 'IT' ? 'Cognome' : 'Прізвище',
    email: 'Email',
    phone: currentLang === 'EN' ? 'Phone number' : currentLang === 'IT' ? 'Telefono' : 'Телефон',
    birthDate: currentLang === 'EN' ? 'Date of birth' : currentLang === 'IT' ? 'Data di nascita' : 'Дата народження',
    gender: currentLang === 'EN' ? 'Gender' : currentLang === 'IT' ? 'Genere' : 'Стать',
    genderNotSet: currentLang === 'EN' ? 'Not specified' : currentLang === 'IT' ? 'Non specificato' : 'Не вказано',
    genderMale: currentLang === 'EN' ? 'Male' : currentLang === 'IT' ? 'Uomo' : 'Чоловік',
    genderFemale: currentLang === 'EN' ? 'Female' : currentLang === 'IT' ? 'Donna' : 'Жінка',
    genderOther: currentLang === 'EN' ? 'Other' : currentLang === 'IT' ? 'Altro' : 'Інше',
    address: currentLang === 'EN' ? 'Residential address (optional)' : currentLang === 'IT' ? 'Indirizzo (opzionale)' : "Адреса проживання (необов'язково)",
    addressPlaceholder: currentLang === 'EN' ? 'Street, city, postal code...' : currentLang === 'IT' ? 'Via, città, CAP...' : 'Вулиця, будинок, місто...',
    placeholderFirst: currentLang === 'EN' ? 'e.g. Anna' : currentLang === 'IT' ? 'Es. Maria' : 'Ірина',
    placeholderLast: currentLang === 'EN' ? 'e.g. Smith' : currentLang === 'IT' ? 'Es. Rossi' : 'Сидоренко',
    saveBtn: currentLang === 'EN' ? 'Save Profile' : currentLang === 'IT' ? 'Salva Profilo' : 'Зберегти профіль',
    savingBtn: currentLang === 'EN' ? 'Saving...' : currentLang === 'IT' ? 'Salvataggio...' : 'Збереження...',
    cancelBtn: currentLang === 'EN' ? 'Reset' : currentLang === 'IT' ? 'Ripristina' : 'Скинути зміни',
    saveSuccess: currentLang === 'EN' ? 'Profile updated successfully!' : currentLang === 'IT' ? 'Profilo aggiornato con successo!' : 'Профіль успішно оновлено!',
    saveError: currentLang === 'EN' ? 'Failed to update profile' : currentLang === 'IT' ? 'Errore aggiornamento profilo' : 'Помилка оновлення профілю',
    cancelNotice: currentLang === 'EN' ? 'Changes discarded' : currentLang === 'IT' ? 'Modifiche ripristinate' : 'Зміни скасовано',
    twoFactorTitle: currentLang === 'EN' ? 'Two-Factor Authentication (2FA)' : currentLang === 'IT' ? 'Autenticazione a Due Fattori (2FA)' : 'Двофакторна автентифікація',
    twoFactorDesc: currentLang === 'EN' ? 'Protect your account with extra security.' : currentLang === 'IT' ? 'Proteggi il tuo account con sicurezza avanzata.' : 'Захистіть свій акаунт додатковим рівнем безпеки.',
    twoFactorSoon: currentLang === 'EN' ? 'Coming Soon' : currentLang === 'IT' ? 'In arrivo' : 'Незабаром',
    twoFactorModalTitle: currentLang === 'EN' ? '2FA Protection' : currentLang === 'IT' ? 'Protezione 2FA' : 'Захист акаунта (2FA)',
    twoFactorModalDesc: currentLang === 'EN'
      ? 'Two-factor authentication via SMS and Authenticator app is currently in development and will be available in the next security update.'
      : currentLang === 'IT'
        ? "L'autenticazione a due fattori tramite SMS e app Authenticator è in fase di rilascio e sarà attiva con il prossimo aggiornamento."
        : 'Двофакторна автентифікація через SMS та застосунок Authenticator перебуває у розробці та стане доступною у наступному оновленні безпеки.',
    twoFactorClose: currentLang === 'EN' ? 'Understood' : currentLang === 'IT' ? 'Ho capito' : 'Зрозуміло',
    cropTitle: currentLang === 'EN' ? 'Adjust Avatar' : currentLang === 'IT' ? 'Adatta Avatar' : 'Налаштування аватарки',
    cropDesc: currentLang === 'EN' ? 'Drag to position and use slider to zoom' : currentLang === 'IT' ? 'Trascina per centrare e usa lo slider per ingrandire' : 'Перетягуйте фото та регулюйте масштаб',
    cropSave: currentLang === 'EN' ? 'Apply Avatar' : currentLang === 'IT' ? 'Applica Avatar' : 'Застосувати аватарку',
    cropCancel: currentLang === 'EN' ? 'Cancel' : currentLang === 'IT' ? 'Annulla' : 'Скасувати',
    avatarSuccess: currentLang === 'EN' ? 'Avatar updated!' : currentLang === 'IT' ? 'Avatar aggiornato!' : 'Аватарку оновлено!',
    avatarTooltip: currentLang === 'EN' ? 'Click to change photo' : currentLang === 'IT' ? 'Clicca per cambiare foto' : 'Натисніть, щоб змінити фото',
    fileTypeError: currentLang === 'EN' ? 'Please select a valid image file (JPG, PNG, WEBP)' : currentLang === 'IT' ? 'Seleziona un file immagine valido (JPG, PNG, WEBP)' : 'Оберіть файл зображення (JPG, PNG, WEBP)',
    processError: currentLang === 'EN' ? 'Failed to process image' : currentLang === 'IT' ? 'Errore elaborazione immagine' : 'Помилка обробки фото',
    passengerFallback: currentLang === 'EN' ? 'Passenger' : currentLang === 'IT' ? 'Passeggero' : 'Пасажир',
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: toDateInputValue(user?.birthDate),
    gender: user?.gender || 'Не вказано',
    address: (user as any)?.address || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Стан кропера
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // ✅ Залежність суворо від user?.id, щоб не затирати форму під час вводу чи оновлення аватара
  useEffect(() => {
    if (user?.email) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: toDateInputValue(user.birthDate),
        gender: user.gender || 'Не вказано',
        address: (user as any)?.address || ''
      });
    }
  }, [user?.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: toDateInputValue(user.birthDate),
        gender: user.gender || 'Не вказано',
        address: (user as any)?.address || ''
      });
      toast(l.cancelNotice, { icon: '🔄' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // ✅ Не зберігаємо голий '+380', якщо користувач не ввів повний номер
      const cleanPhone = formData.phone.trim();
      const phoneToSave = cleanPhone === '+380' || cleanPhone === '+' ? '' : cleanPhone;

      await updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: phoneToSave,
        birthDate: formData.birthDate,
        gender: formData.gender as User['gender'],
        address: formData.address.trim()
      });
      toast.success(l.saveSuccess);
    } catch (error) {
      toast.error(l.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(l.fileTypeError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ✅ Розрахунок baseScale на завантаженні: фото будь-якої роздільності автоматично вписується в коло
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const minSide = Math.min(img.naturalWidth, img.naturalHeight);
    const fitScale = minSide > 0 ? PREVIEW_SIZE / minSide : 1;
    setBaseScale(fitScale);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  // ✅ Ідеально точний розрахунок Canvas: результат на 100% збігається з прев'ю
  const handleCropAndSave = async () => {
    if (!imageRef.current || !rawImageSrc) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imageRef.current;
      const k = EXPORT_SIZE / PREVIEW_SIZE;
      const effectiveScale = baseScale * zoom * k;

      ctx.beginPath();
      ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const drawWidth = img.naturalWidth * effectiveScale;
      const drawHeight = img.naturalHeight * effectiveScale;
      const centerX = EXPORT_SIZE / 2 + pan.x * k;
      const centerY = EXPORT_SIZE / 2 + pan.y * k;

      ctx.drawImage(
        img,
        centerX - drawWidth / 2,
        centerY - drawHeight / 2,
        drawWidth,
        drawHeight
      );

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      await updateUserProfile({ avatar: croppedDataUrl });
      toast.success(l.avatarSuccess);
      setRawImageSrc(null);
    } catch (err) {
      toast.error(l.processError);
    }
  };

  const userAvatarInitial = (formData.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const loyaltyPoints = user?.loyaltyPoints || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{l.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{l.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 sticky top-20 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="flex flex-col items-center text-center">
              <div
                className="relative group/avatar cursor-pointer"
                onClick={handleCameraClick}
                title={l.avatarTooltip}
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-black text-black shadow-[0_0_40px_rgba(6,182,212,0.35)] border-4 border-slate-900 overflow-hidden transition-transform group-hover/avatar:scale-105">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span>{userAvatarInitial}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCameraClick();
                  }}
                  className="absolute bottom-1 right-1 p-2.5 bg-cyan-400 text-black hover:bg-cyan-300 rounded-full shadow-lg border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title={l.avatarTooltip}
                >
                  <Camera size={16} />
                </button>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-5 truncate max-w-full">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : (user?.email?.split('@')[0] || l.passengerFallback)}
              </h4>

              <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mt-1">
                {loyaltyPoints >= 2000 ? 'Gold Member' : 'Silver Member'}
              </p>

              <div className="mt-6 pt-6 border-t border-slate-800/80 w-full space-y-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span className="uppercase text-[10px] tracking-wider">{l.verificationLabel}</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[11px]">
                    <ShieldCheck size={13} /> {l.statusVerified}
                  </span>
                </div>

                <div className="flex items-center justify-between font-bold text-slate-400">
                  <span className="uppercase text-[10px] tracking-wider">{l.joinedLabel}</span>
                  <span className="text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
                      : '2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <UserIcon size={13} className="text-cyan-400" /> {l.firstName}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={l.placeholderFirst}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <UserIcon size={13} className="text-cyan-400" /> {l.lastName}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={l.placeholderLast}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Mail size={13} className="text-cyan-400" /> {l.email}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-400 opacity-60 cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-cyan-400" /> {l.phone}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+380 98 000 00 00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-cyan-400" /> {l.birthDate}
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <UserIcon size={13} className="text-cyan-400" /> {l.gender}
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all cursor-pointer"
                >
                  <option value="Не вказано">{l.genderNotSet}</option>
                  <option value="Чоловік">{l.genderMale}</option>
                  <option value="Жінка">{l.genderFemale}</option>
                  <option value="Інше">{l.genderOther}</option>
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">
                {l.address}
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={l.addressPlaceholder}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl p-3.5 text-sm text-white outline-none transition-all resize-none"
              />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? l.savingBtn : l.saveBtn}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                {l.cancelBtn}
              </button>
            </div>
          </div>

          {/* 2FA без неправдивих обіцянок */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl shrink-0">
                <Lock size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{l.twoFactorTitle}</h4>
                  <span className="text-[9px] bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    {l.twoFactorSoon}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{l.twoFactorDesc}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShow2FAModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
            >
              <Clock size={13} /> {l.twoFactorSoon}
            </button>
          </div>
        </div>
      </div>

      {/* КРОПЕР З ТОЧНИМ ЦЕНТРУВАННЯМ ТА МАСШТАБОМ */}
      <AnimatePresence>
        {rawImageSrc && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 max-w-md w-full shadow-2xl flex flex-col items-center"
            >
              <button
                onClick={() => setRawImageSrc(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg font-black text-white uppercase tracking-tight">{l.cropTitle}</h3>
              <p className="text-xs text-slate-400 text-center mt-1 mb-5">{l.cropDesc}</p>

              {/* Кругле вікно перегляду */}
              <div
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                className="relative rounded-full border-4 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] overflow-hidden cursor-grab active:cursor-grabbing bg-black select-none touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={rawImageSrc}
                  alt="Crop preview"
                  onLoad={handleImgLoad}
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${baseScale * zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.08s ease-out'
                  }}
                  className="max-w-none pointer-events-none select-none max-h-none"
                />
              </div>

              {/* Повзунок масштабу від 1x до 3x */}
              <div className="w-full flex items-center gap-3 mt-6 px-4">
                <ZoomOut size={16} className="text-slate-400 shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <ZoomIn size={16} className="text-slate-400 shrink-0" />
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 w-full mt-6">
                <button
                  type="button"
                  onClick={handleCropAndSave}
                  className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check size={16} /> {l.cropSave}
                </button>
                <button
                  type="button"
                  onClick={() => setRawImageSrc(null)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 cursor-pointer active:scale-95"
                >
                  {l.cropCancel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модалка 2FA */}
      <AnimatePresence>
        {show2FAModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-4">
                <Lock size={26} />
              </div>

              <h3 className="text-lg font-black text-white uppercase">{l.twoFactorModalTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-6">
                {l.twoFactorModalDesc}
              </p>

              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {l.twoFactorClose}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileTab;