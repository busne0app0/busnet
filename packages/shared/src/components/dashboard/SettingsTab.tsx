import React, { useState, useEffect } from 'react';
import { Lock, MessageSquare, Bell, Globe, Info, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';
import { Language } from '@busnet/shared/constants/translations';

interface SettingsTabProps {
  notifs: { email: boolean; sms: boolean; push: boolean; marketing: boolean };
  setNotifs: React.Dispatch<React.SetStateAction<{ email: boolean; sms: boolean; push: boolean; marketing: boolean }>>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ notifs, setNotifs }) => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase() as Language;

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Валюта з безпечною ініціалізацією
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('busnet_currency') || (currentLang === 'UK' ? 'UAH' : 'EUR');
    } catch {
      return 'EUR';
    }
  });

  // Локалізація
  const l = {
    title: currentLang === 'EN' ? 'Settings' : currentLang === 'IT' ? 'Impostazioni' : 'Налаштування',
    subtitle: currentLang === 'EN' ? 'Security and account preferences' : currentLang === 'IT' ? 'Sicurezza e preferenze account' : 'Безпека та налаштування акаунту',
    securityTitle: currentLang === 'EN' ? 'Security & Password' : currentLang === 'IT' ? 'Sicurezza e Password' : 'Безпека та пароль',
    securityNote: currentLang === 'EN'
      ? 'Note: Updating your password will require signing in again on other devices.'
      : currentLang === 'IT'
        ? 'Nota: La modifica della password richiederà un nuovo accesso sugli altri dispositivi.'
        : 'Примітка: Для зміни пароля може знадобитись повторна авторизація на інших пристроях.',
    newPassLabel: currentLang === 'EN' ? 'New password' : currentLang === 'IT' ? 'Nuova password' : 'Новий пароль',
    newPassPlaceholder: currentLang === 'EN' ? 'Minimum 8 characters' : currentLang === 'IT' ? 'Minimo 8 caratteri' : 'Мінімум 8 символів',
    confirmPassLabel: currentLang === 'EN' ? 'Confirm new password' : currentLang === 'IT' ? 'Conferma nuova password' : 'Підтвердіть новий пароль',
    changePassBtn: currentLang === 'EN' ? 'Update Password' : currentLang === 'IT' ? 'Aggiorna Password' : 'Змінити пароль',
    updatingPass: currentLang === 'EN' ? 'Updating...' : currentLang === 'IT' ? 'Aggiornamento...' : 'Оновлення...',
    passLengthError: currentLang === 'EN' ? 'Password must be at least 8 characters' : currentLang === 'IT' ? 'La password deve avere almeno 8 caratteri' : 'Пароль має бути не менше 8 символів',
    passMismatchError: currentLang === 'EN' ? 'Passwords do not match' : currentLang === 'IT' ? 'Le password non coincidono' : 'Паролі не співпадають',
    passSuccess: currentLang === 'EN' ? 'Password updated successfully!' : currentLang === 'IT' ? 'Password aggiornata con successo!' : 'Пароль успішно змінено!',
    emailCardTitle: currentLang === 'EN' ? 'Email & Login' : currentLang === 'IT' ? 'Email e Accesso' : 'Email та логін',
    yourEmail: currentLang === 'EN' ? 'Your email:' : currentLang === 'IT' ? 'La tua email:' : 'Ваш email:',
    changeEmailHint: currentLang === 'EN' ? 'To change email address contact support' : currentLang === 'IT' ? 'Per cambiare email contatta l\'assistenza' : 'Для зміни email зверніться до підтримки',
    yourHandle: currentLang === 'EN' ? 'Your account ID:' : currentLang === 'IT' ? 'ID account:' : 'Ваш логін:',
    notifsTitle: currentLang === 'EN' ? 'Notifications' : currentLang === 'IT' ? 'Notifiche' : 'Сповіщення',
    notifEmail: currentLang === 'EN' ? 'Email notifications' : currentLang === 'IT' ? 'Notifiche Email' : 'Email-сповіщення',
    notifEmailSub: currentLang === 'EN' ? 'Confirmations and tickets' : currentLang === 'IT' ? 'Conferme e biglietti' : 'Підтвердження, квитки',
    notifSms: currentLang === 'EN' ? 'SMS notifications' : currentLang === 'IT' ? 'Notifiche SMS' : 'SMS-сповіщення',
    notifSmsSub: currentLang === 'EN' ? 'Trip reminders and delays' : currentLang === 'IT' ? 'Promemoria e ritardi' : 'Нагадування про рейс',
    notifPush: currentLang === 'EN' ? 'Push alerts' : currentLang === 'IT' ? 'Notifiche Push' : 'Push-сповіщення',
    notifPushSub: currentLang === 'EN' ? 'Important platform updates' : currentLang === 'IT' ? 'Aggiornamenti importanti' : 'Важливі новини рейсів',
    notifMarketing: currentLang === 'EN' ? 'Discounts & Offers' : currentLang === 'IT' ? 'Offerte e Sconti' : 'Знижки та акції',
    notifMarketingSub: currentLang === 'EN' ? 'Special loyalty discounts' : currentLang === 'IT' ? 'Offerte speciali fedeltà' : 'Пропозиції та акції',
    langRegionTitle: currentLang === 'EN' ? 'Language & Region' : currentLang === 'IT' ? 'Lingua e Regione' : 'Мова та регіон',
    interfaceLang: currentLang === 'EN' ? 'Interface language' : currentLang === 'IT' ? 'Lingua interfaccia' : 'Мова інтерфейсу',
    currencyLabel: currentLang === 'EN' ? 'Preferred currency' : currentLang === 'IT' ? 'Valuta preferita' : 'Валюта',
    currencyEuro: currentLang === 'EN' ? '€ EUR (Euro)' : currentLang === 'IT' ? '€ EUR (Euro)' : '€ EUR (Євро)',
    currencyUah: currentLang === 'EN' ? '₴ UAH (Hryvnia)' : currentLang === 'IT' ? '₴ UAH (Grivnia)' : '₴ UAH (Гривня)',
    currencyUpdated: currentLang === 'EN' ? 'Currency updated' : currentLang === 'IT' ? 'Valuta aggiornata' : 'Валюту оновлено',
    dangerZoneTitle: currentLang === 'EN' ? 'Danger Zone' : currentLang === 'IT' ? 'Zona Pericolosa' : 'Небезпечна зона',
    deleteAccountTitle: currentLang === 'EN' ? 'Delete Account' : currentLang === 'IT' ? 'Elimina Account' : 'Видалення акаунту',
    deleteAccountDesc: currentLang === 'EN'
      ? 'Your account will be deactivated and you will be signed out. Your personal data will be removed according to our privacy policy.'
      : currentLang === 'IT'
        ? 'Il tuo account verrà disattivato e uscirai da tutti i dispositivi. I tuoi dati personali saranno rimossi secondo la nostra privacy policy.'
        : 'Ваш акаунт буде деактивовано, ви вийдете з усіх пристроїв. Персональні дані буде видалено відповідно до політики конфіденційності.',
    deleteAccountBtn: currentLang === 'EN' ? 'Delete Account' : currentLang === 'IT' ? 'Elimina Account' : 'Видалити акаунт',
    deleteModalTitle: currentLang === 'EN' ? 'Confirm Deletion' : currentLang === 'IT' ? 'Conferma Eliminazione' : 'Підтвердження видалення',
    deleteModalText: currentLang === 'EN'
      ? 'Are you sure you want to delete your BUSNET account?'
      : currentLang === 'IT'
        ? 'Sei sicuro di voler eliminare il tuo account BUSNET?'
        : 'Ви впевнені, що бажаєте видалити свій акаунт BUSNET?',
    deleteCancel: currentLang === 'EN' ? 'Cancel' : currentLang === 'IT' ? 'Annulla' : 'Скасувати',
    deleteConfirm: currentLang === 'EN' ? 'Yes, delete' : currentLang === 'IT' ? 'Sì, elimina' : 'Так, видалити',
    deleting: currentLang === 'EN' ? 'Deleting...' : currentLang === 'IT' ? 'Eliminazione...' : 'Видалення...',
    deleteSuccess: currentLang === 'EN' ? 'Account successfully closed' : currentLang === 'IT' ? 'Account chiuso con successo' : 'Акаунт успішно закрито',
    genericError: currentLang === 'EN' ? 'Operation failed. Please try again' : currentLang === 'IT' ? 'Operazione fallita. Riprova' : 'Помилка виконання операції'
  };

  // Закриття модалки по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal) {
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal]);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    try {
      localStorage.setItem('busnet_currency', newCurr);
    } catch { }
    toast.success(l.currencyUpdated);
  };

  const handlePasswordChange = async () => {
    if (!newPass || newPass.length < 8) {
      toast.error(l.passLengthError);
      return;
    }
    if (newPass !== confirmPass) {
      toast.error(l.passMismatchError);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;

      toast.success(l.passSuccess);
      setNewPass('');
      setConfirmPass('');
    } catch (e: any) {
      toast.error(e.message || l.genericError);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleNotif = (id: keyof typeof notifs) => {
    setNotifs(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('busnet_notifs', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // ✅ Реальне видалення акаунту (Soft Delete в БД + SignOut)
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase.rpc('request_account_deletion');
      if (error) throw error;

      await supabase.auth.signOut({ scope: 'global' });
      toast.success(l.deleteSuccess);
      setShowDeleteModal(false);

      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(l.genericError);
      setIsDeleting(false);
    }
  };

  const displayEmail = user?.email || '';
  const displayNickname = user?.firstName ? `@${user.firstName.toLowerCase()}` : (displayEmail ? `@${displayEmail.split('@')[0]}` : '@user');

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{l.title}</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{l.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

        {/* Left Column */}
        <div className="space-y-6 sm:space-y-8">

          {/* Security & Password */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Lock size={16} />
              </div>
              {l.securityTitle}
            </h3>

            <div className="space-y-4">
              <div className="text-slate-400 text-xs leading-relaxed p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                {l.securityNote}
              </div>

              {/* Новий пароль */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">{l.newPassLabel}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder={l.newPassPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white pr-11 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Підтвердження */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-1">{l.confirmPassLabel}</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm outline-none transition-all text-white font-mono"
                />
              </div>

              <button
                disabled={isUpdating}
                onClick={handlePasswordChange}
                className="w-full py-3.5 mt-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? l.updatingPass : l.changePassBtn}
              </button>
            </div>
          </div>

          {/* Email & Handle */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare size={16} />
              </div>
              {l.emailCardTitle}
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{l.yourEmail}</p>
                <p className="text-sm font-bold text-cyan-300 truncate">{displayEmail || '—'}</p>
                <p className="text-[10px] text-slate-500 mt-2">{l.changeEmailHint}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{l.yourHandle}</p>
                <p className="text-sm font-bold text-white font-mono">{displayNickname}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 sm:space-y-8">

          {/* Notifications */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell size={16} />
              </div>
              {l.notifsTitle}
            </h3>

            <div className="space-y-4">
              {(Object.keys(notifs) as Array<keyof typeof notifs>).map((key) => {
                const title = key === 'email' ? l.notifEmail : key === 'sms' ? l.notifSms : key === 'push' ? l.notifPush : l.notifMarketing;
                const subtitle = key === 'email' ? l.notifEmailSub : key === 'sms' ? l.notifSmsSub : key === 'push' ? l.notifPushSub : l.notifMarketingSub;

                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white tracking-tight">{title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotif(key)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer ${notifs[key]
                        ? 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-800 border border-slate-700'
                        }`}
                    >
                      {/* Чітка біла кругляшка на будь-якому фоні */}
                      <motion.div
                        animate={{ x: notifs[key] ? 28 : 4 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-md ${notifs[key] ? 'bg-black' : 'bg-white'}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Language & Currency */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe size={16} />
              </div>
              {l.langRegionTitle}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs sm:text-sm font-bold text-white">{l.interfaceLang}</span>
                <select
                  value={currentLang}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-cyan-300 outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="UK">🇺🇦 Українська</option>
                  <option value="EN">🇬🇧 English</option>
                  <option value="IT">🇮🇹 Italiano</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs sm:text-sm font-bold text-white">{l.currencyLabel}</span>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-cyan-300 outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="EUR">{l.currencyEuro}</option>
                  <option value="UAH">{l.currencyUah}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Info size={16} />
              </div>
              {l.dangerZoneTitle}
            </h3>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">{l.deleteAccountTitle}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {l.deleteAccountDesc}
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-3 rounded-xl border border-rose-500/40 text-xs font-black uppercase tracking-wider text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] active:scale-95 cursor-pointer"
              >
                {l.deleteAccountBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Безпечна модалка видалення акаунту */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative p-6 sm:p-8 rounded-3xl bg-slate-900 border border-rose-500/30 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-4">
                <ShieldAlert size={28} />
              </div>

              <h3 className="text-lg font-black text-white uppercase">{l.deleteModalTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-6">
                {l.deleteModalText}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? l.deleting : l.deleteConfirm}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {l.deleteCancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsTab;