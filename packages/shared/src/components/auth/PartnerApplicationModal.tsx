import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Briefcase, User, Smartphone, Mail, Bus, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase/config';
import { toast } from 'react-hot-toast';

interface PartnerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerApplicationModal: React.FC<PartnerApplicationModalProps> = ({ isOpen, onClose }) => {
  const [partnerType, setPartnerType] = useState<'carrier' | 'agent'>('carrier');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fleetSize, setFleetSize] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setCompanyName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setFleetSize('');
    setNotes('');
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('partner_applications')
        .insert({
          type: partnerType,
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          fleet_size: partnerType === 'carrier' ? fleetSize.trim() : null,
          notes: notes.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Заявку успішно надіслано!');
    } catch (err: any) {
      console.error('[PartnerApplication] Error:', err);
      toast.error(err.message || 'Помилка надсилання заявки. Спробуйте пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = partnerType === 'carrier' ? '#FBBF24' : '#A855F7';
  const accentGlow = partnerType === 'carrier' ? 'rgba(251,191,36,0.3)' : 'rgba(168,85,247,0.3)';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[500px] overflow-hidden rounded-3xl bg-[#0b1221] border border-white/10 shadow-2xl z-10 p-6 sm:p-8"
            style={{
              boxShadow: `0 30px 90px rgba(0,0,0,0.8), 0 0 50px ${accentGlow}`,
            }}
          >
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
            />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center flex flex-col items-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                  Заявку надіслано!
                </h3>
                <p className="text-[13px] text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Дякуємо за інтерес до партнерства з BUSNET UA. Наш менеджер перевірить дані та зв'яжеться з вами за вказаним номером телефону для активації кабінету.
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Зрозуміло
                </button>
              </motion.div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5FF]">
                    ПАРТНЕРСЬКА ПРОГРАМА
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight mt-1">
                    Подати заявку на співпрацю
                  </h2>
                  <p className="text-[12px] text-slate-400 mt-1">
                    Приєднуйтесь до національної цифрової мережі BUSNET UA
                  </p>
                </div>

                {/* Partner Type Selector */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setPartnerType('carrier')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                      partnerType === 'carrier'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Building2 size={20} />
                    <div>
                      <div className="text-[12px] font-black uppercase">Перевізник</div>
                      <div className="text-[10px] opacity-70">Автопарк, рейси</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerType('agent')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                      partnerType === 'agent'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                        : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Briefcase size={20} />
                    <div>
                      <div className="text-[12px] font-black uppercase">Агент / Каса</div>
                      <div className="text-[10px] opacity-70">Продаж квитків</div>
                    </div>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={partnerType === 'carrier' ? "Назва компанії / ФОП (перевізник)" : "Назва турагентства / каси"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Контактна особа (ПІБ)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                    />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+380 (XX) XXX-XX-XX"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Робочий Email"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                    />
                    {partnerType === 'carrier' ? (
                      <input
                        type="text"
                        value={fleetSize}
                        onChange={(e) => setFleetSize(e.target.value)}
                        placeholder="К-сть автобусів у парку"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                      />
                    ) : (
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Місто / регіон продажу"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
                      />
                    )}
                  </div>

                  {partnerType === 'carrier' && (
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Основні маршрути або коментар (необов'язково)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-all resize-none"
                    />
                  )}

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full mt-2 py-3.5 rounded-xl text-white font-black uppercase tracking-wider text-[12px] flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${partnerType === 'carrier' ? '#D97706' : '#7C3AED'} 100%)`,
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Надіслати заявку на підключення</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
