/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2, Star, Plus, X, Phone, Mail, ShieldCheck,
  UserCheck2, Clock, Loader2, Search, Trash2, AlertCircle,
  Lock, Eye, EyeOff, Ban, CheckCircle2, UserMinus, RotateCcw,
  Edit3, Key, ChevronDown, MoreVertical
} from 'lucide-react';
import { useDrivers, Driver } from '@busnet/shared/hooks/useDrivers';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { toast } from 'react-hot-toast';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Активний',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  on_trip:  { label: 'В рейсі',     color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  resting:  { label: 'Відпочинок',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  inactive: { label: 'Заблокований',color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  fired:    { label: 'Звільнений',  color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20' },
};

const getExperience = (driver: Driver) => {
  const trips = driver.tripsCount || 0;
  if (trips === 0)  return { label: 'НОВИЙ',        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (trips < 15)   return { label: 'МОЛОДШИЙ',     badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (trips < 50)   return { label: 'ДОСВІДЧЕНИЙ',  badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
  return             { label: 'ПРОФЕССІОНАЛ',        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
};

// ── Add Driver Modal ──────────────────────────────────────────────────────────
function AddDriverModal({ carrierId, onClose, onCreate }: {
  carrierId: string;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    licenseNumber: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Паролі не співпадають'); return; }
    if (form.password.length < 6) { toast.error('Пароль мінімум 6 символів'); return; }
    setLoading(true);
    try {
      await onCreate({ ...form, carrierId });
      toast.success('Водія додано! Він може увійти через busnet-driver.vercel.app');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Помилка створення акаунту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#0b1221] border border-white/10 rounded-3xl p-6 z-10 shadow-2xl"
        style={{ boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 0 40px rgba(0,229,255,0.08)' }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, #00E5FF, transparent)' }} />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Додати водія</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Система створить акаунт для входу в кабінет водія</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'firstName', placeholder: "Ім'я", icon: UserCheck2 },
              { key: 'lastName',  placeholder: 'Прізвище', icon: UserCheck2 },
            ].map(({ key, placeholder }) => (
              <input key={key} required value={form[key as keyof typeof form]}
                onChange={set(key)} placeholder={placeholder}
                className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />
            ))}
          </div>

          <input required type="email" value={form.email} onChange={set('email')}
            placeholder="Email (для входу в систему)"
            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />

          <div className="grid grid-cols-2 gap-3">
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Телефон"
              className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />
            <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="Номер посвідчення"
              className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />
          </div>

          <div className="pt-1 pb-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mb-2">
              <Lock size={10} /> Пароль для входу
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input required type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Пароль (мін. 6 символів)"
                  className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 pr-10 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <input required type={showPass ? 'text' : 'password'} value={form.confirmPassword}
                onChange={set('confirmPassword')} placeholder="Підтвердження пароля"
                className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/40 transition-all" />
            </div>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3 text-[11px] text-cyan-400/80">
            💡 Водій зможе увійти на <strong>busnet-driver.vercel.app</strong> з вказаним email і паролем
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-[12px] text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg, #00E5FF 0%, #0088CC 100%)', boxShadow: '0 0 20px rgba(0,229,255,0.25)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={15} />}
            {loading ? 'Створення акаунту...' : 'Створити акаунт водія'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Edit Driver Modal ─────────────────────────────────────────────────────────
function EditDriverModal({ driver, carrierId, onClose, onSave }: {
  driver: Driver; carrierId: string;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Driver>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: driver.firstName, lastName: driver.lastName,
    phone: driver.phone, licenseNumber: driver.licenseNumber,
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(driver.id, form);
      toast.success('Дані оновлено');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-[#0b1221] border border-white/10 rounded-3xl p-6 z-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, #FBBF24, transparent)' }} />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Редагувати водія</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.firstName} onChange={set('firstName')} placeholder="Ім'я"
              className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition-all" />
            <input required value={form.lastName} onChange={set('lastName')} placeholder="Прізвище"
              className="bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition-all" />
          </div>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Телефон"
            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition-all" />
          <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="Номер посвідчення"
            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-amber-500/40 transition-all" />
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-[12px] text-black flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 size={14} />}
            {loading ? 'Збереження...' : 'Зберегти зміни'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ driver, onClose, onReset }: {
  driver: Driver; onClose: () => void;
  onReset: (uid: string, newPass: string, carrierId: string) => Promise<void>;
}) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass !== confirm) { toast.error('Паролі не співпадають'); return; }
    if (pass.length < 6) { toast.error('Мінімум 6 символів'); return; }
    if (!driver.uid) { toast.error('Водій не має auth акаунту'); return; }
    setLoading(true);
    try {
      await onReset(driver.uid, pass, driver.carrierId);
      toast.success('Пароль змінено');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm bg-[#0b1221] border border-white/10 rounded-3xl p-6 z-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, #A855F7, transparent)' }} />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-white uppercase tracking-tight">Змінити пароль</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
        <p className="text-[12px] text-slate-400 mb-4">
          {driver.firstName} {driver.lastName} · <span className="text-slate-500">{driver.email}</span>
        </p>
        <form onSubmit={handleReset} className="space-y-3">
          <div className="relative">
            <input required type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Новий пароль (мін. 6 символів)"
              className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 pr-10 text-[13px] text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition-all" />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <input required type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Підтвердження"
            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 outline-none focus:border-purple-500/40 transition-all" />
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-xl font-black uppercase tracking-wider text-[12px] text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key size={14} />}
            {loading ? 'Оновлення...' : 'Змінити пароль'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Driver Card ───────────────────────────────────────────────────────────────
function DriverCard({ driver, onEdit, onBlock, onUnblock, onFire, onResetPassword, onDelete }: {
  driver: Driver;
  onEdit: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onFire: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const exp = getExperience(driver);
  const statusInfo = STATUS_LABELS[driver.status] || STATUS_LABELS.active;
  const isFired = driver.status === 'fired';
  const isBlocked = driver.status === 'inactive';
  const isActive = driver.status === 'active' || driver.status === 'on_trip' || driver.status === 'resting';

  const withLoading = (key: string, fn: () => void) => () => {
    setActionLoading(key);
    setMenuOpen(false);
    Promise.resolve(fn()).finally(() => setActionLoading(null));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-[#0d1526]/60 border rounded-[20px] p-4 flex flex-col gap-3 transition-all ${
        isFired ? 'border-slate-700/30 opacity-60' : isBlocked ? 'border-red-500/20' : 'border-white/6 hover:border-white/12'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-base border ${
            isFired ? 'bg-slate-700/30 border-slate-600/20' : isBlocked ? 'bg-red-500/15 border-red-500/20' : 'bg-[#00E5FF]/10 border-[#00E5FF]/20'
          }`}>
            {driver.firstName?.[0]}{driver.lastName?.[0]}
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">
              {driver.firstName} {driver.lastName}
            </div>
            <div className="text-[11px] text-slate-500">{driver.email || 'Email не вказано'}</div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(m => !m)}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <MoreVertical size={14} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-10 z-50 w-48 bg-[#0d1a2d] border border-white/10 rounded-2xl p-1.5 shadow-2xl"
              >
                {[
                  { key: 'edit', label: 'Редагувати', icon: Edit3, action: onEdit, show: !isFired },
                  { key: 'reset', label: 'Змінити пароль', icon: Key, action: onResetPassword, show: !!driver.uid && !isFired },
                  { key: 'block', label: 'Заблокувати', icon: Ban, action: onBlock, show: isActive, color: 'text-amber-400' },
                  { key: 'unblock', label: 'Розблокувати', icon: CheckCircle2, action: onUnblock, show: isBlocked, color: 'text-emerald-400' },
                  { key: 'fire', label: 'Звільнити', icon: UserMinus, action: onFire, show: !isFired, color: 'text-red-400' },
                  { key: 'delete', label: 'Видалити', icon: Trash2, action: onDelete, show: true, color: 'text-red-500' },
                ].filter(item => item.show).map(item => (
                  <button key={item.key}
                    onClick={withLoading(item.key, item.action)}
                    disabled={actionLoading === item.key}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all hover:bg-white/5 ${item.color || 'text-slate-300'}`}>
                    {actionLoading === item.key
                      ? <Loader2 size={13} className="animate-spin" />
                      : <item.icon size={13} />}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${exp.badge}`}>
          {exp.label}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {driver.uid && (
          <span className="text-[10px] text-cyan-500/70 px-2 py-0.5 rounded-full bg-cyan-500/5 border border-cyan-500/10">
            ✓ Auth акаунт
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex gap-4 text-[11px] text-slate-500">
        {driver.phone && (
          <span className="flex items-center gap-1"><Phone size={10} />{driver.phone}</span>
        )}
        {driver.licenseNumber && (
          <span className="flex items-center gap-1"><ShieldCheck size={10} />№{driver.licenseNumber}</span>
        )}
        <span className="flex items-center gap-1"><Star size={10} className="text-amber-400" />{driver.rating?.toFixed(1) || '5.0'}</span>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Drivers() {
  const { user } = useAuthStore();
  const {
    drivers, loading, fetchDrivers,
    createDriverWithAuth, updateDriver,
    blockDriver, unblockDriver, fireDriver,
    resetDriverPassword, deleteDriver
  } = useDrivers();

  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [resetPassDriver, setResetPassDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (user?.uid) fetchDrivers(user.uid);
  }, [user?.uid, fetchDrivers]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: any) => {
    await createDriverWithAuth({ ...data, carrierId: user!.uid });
    load();
  };

  const handleUpdate = async (id: string, updates: Partial<Driver>) => {
    await updateDriver(id, user!.uid, updates);
    load();
  };

  const handleBlock = async (driver: Driver) => {
    const tid = toast.loading('Блокування...');
    try { await blockDriver(driver.id, user!.uid); toast.success('Заблоковано', { id: tid }); }
    catch (e: any) { toast.error(e.message, { id: tid }); }
  };

  const handleUnblock = async (driver: Driver) => {
    const tid = toast.loading('Розблокування...');
    try { await unblockDriver(driver.id, user!.uid); toast.success('Розблоковано', { id: tid }); }
    catch (e: any) { toast.error(e.message, { id: tid }); }
  };

  const handleFire = async (driver: Driver) => {
    if (!confirm(`Звільнити ${driver.firstName} ${driver.lastName}?`)) return;
    const tid = toast.loading('Звільнення...');
    try { await fireDriver(driver.id, user!.uid); toast.success('Водія звільнено', { id: tid }); }
    catch (e: any) { toast.error(e.message, { id: tid }); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const tid = toast.loading('Видалення...');
    try {
      await deleteDriver(confirmDelete.id, user!.uid);
      toast.success('Видалено', { id: tid });
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = drivers.filter(d => {
    const s = search.toLowerCase();
    const matchName = `${d.firstName} ${d.lastName} ${d.email || ''}`.toLowerCase().includes(s);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchName && matchStatus;
  });

  const activeCount = drivers.filter(d => ['active', 'on_trip'].includes(d.status)).length;
  const blockedCount = drivers.filter(d => d.status === 'inactive').length;
  const firedCount = drivers.filter(d => d.status === 'fired').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Водії</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Управління персоналом компанії</p>
        </div>
        <motion.button onClick={() => setShowAdd(true)}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-wider text-black"
          style={{ background: 'linear-gradient(135deg, #00E5FF 0%, #0088CC 100%)', boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}>
          <Plus size={15} /> Додати водія
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всього', value: drivers.length, color: '#00E5FF' },
          { label: 'Активні', value: activeCount, color: '#10B981' },
          { label: 'Заблоковані', value: blockedCount, color: '#F59E0B' },
          { label: 'Звільнені', value: firedCount, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1526]/60 border border-white/6 rounded-2xl p-3 text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук водія..."
            className="w-full bg-black/30 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-[12px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/30 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-[12px] text-white outline-none focus:border-cyan-500/30 transition-all">
          <option value="all">Всі статуси</option>
          <option value="active">Активні</option>
          <option value="on_trip">В рейсі</option>
          <option value="resting">Відпочинок</option>
          <option value="inactive">Заблоковані</option>
          <option value="fired">Звільнені</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserCircle2 size={48} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">
            {drivers.length === 0
              ? 'Ви ще не додали жодного водія'
              : 'Нічого не знайдено за вашим запитом'}
          </p>
          {drivers.length === 0 && (
            <button onClick={() => setShowAdd(true)}
              className="mt-4 px-5 py-2 rounded-xl text-[12px] font-bold text-[#00E5FF] border border-[#00E5FF]/20 hover:bg-[#00E5FF]/5 transition-all uppercase tracking-wider">
              + Додати першого водія
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(driver => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onEdit={() => setEditDriver(driver)}
              onBlock={() => handleBlock(driver)}
              onUnblock={() => handleUnblock(driver)}
              onFire={() => handleFire(driver)}
              onResetPassword={() => setResetPassDriver(driver)}
              onDelete={() => setConfirmDelete(driver)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddDriverModal carrierId={user!.uid} onClose={() => setShowAdd(false)} onCreate={handleCreate} />
        )}
        {editDriver && (
          <EditDriverModal
            driver={editDriver} carrierId={user!.uid}
            onClose={() => setEditDriver(null)} onSave={handleUpdate}
          />
        )}
        {resetPassDriver && (
          <ResetPasswordModal
            driver={resetPassDriver}
            onClose={() => setResetPassDriver(null)}
            onReset={resetDriverPassword}
          />
        )}
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-sm bg-[#0b1221] border border-red-500/20 rounded-3xl p-6 z-10 text-center">
              <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
              <h3 className="text-base font-black text-white mb-1">Видалити водія?</h3>
              <p className="text-[12px] text-slate-400 mb-5">
                {confirmDelete.firstName} {confirmDelete.lastName} буде видалено з системи назавжди.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-[12px] font-bold uppercase hover:bg-white/5 transition-all">
                  Скасувати
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[12px] font-bold uppercase hover:bg-red-500/30 transition-all flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Видалити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
