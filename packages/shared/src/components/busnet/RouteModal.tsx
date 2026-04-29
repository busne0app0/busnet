import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronRight, ChevronLeft, Save, Trash2, MapPin, 
  Plus, Copy, Calculator, Info, AlertCircle, CheckCircle2,
  Calendar, Clock, Landmark, Navigation2
} from 'lucide-react';
import { PricingMode, RouteStatus, RouteTemplate } from '../../busnet/types';
import { useRouteMachine } from '../../busnet/useRouteMachine';
import { BUSNET_RX } from '../../busnet/constants';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RouteTemplate) => Promise<void>;
  initialData?: Partial<RouteTemplate>;
}

const STEPS = [
  { id: 1, title: 'Загальне' },
  { id: 2, title: 'Маршрут Туди' },
  { id: 3, title: 'Маршрут Назад' },
  { id: 4, title: 'Ціни' }
];

export default function RouteModal({ isOpen, onClose, onSave, initialData }: RouteModalProps) {
  const {
    data,
    setData,
    updateField,
    handleParse,
    mirrorRoute,
    updateStop,
    addStop,
    removeStop,
    moveStop,
    recalculatePrices,
    loadDraft,
    clearDraft,
    errors,
    setErrors
  } = useRouteMachine(initialData);

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState<'there' | 'back' | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Reset state with initialData
        const defaultData: RouteTemplate = {
          name: '',
          direction: 'roundtrip',
          seats: 42,
          currency: 'UAH',
          status: RouteStatus.DRAFT,
          comment: '',
          activeDays: [],
          stopsThere: [],
          stopsBack: [],
          pricesThere: {},
          pricesBack: {},
          pricingMode: PricingMode.SINGLE,
          singlePrice: 0,
          kmRate: 0,
          borderStopIndex: 0,
          zoneAPrice: 0,
          zoneBPrice: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          carrierId: '',
          ...initialData,
        };
        setData(defaultData);
      } else {
        // Load draft if creating new
        loadDraft();
      }
      setStep(1); // Reset to first step
    }
  }, [isOpen, initialData, loadDraft, setData]);

  if (!isOpen) return null;

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(data);
      clearDraft();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-[#0a0d16] border border-white/10 rounded-[24px] sm:rounded-[40px] shadow-2xl shadow-cyan-500/10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-syne font-black text-2xl italic tracking-tighter uppercase text-white flex items-center gap-3">
              <Navigation2 className="text-cyan-400" />
              {initialData ? 'Редагування маршруту' : 'Новий маршрут'}
            </h2>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                  {STEPS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStep(s.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        step === s.id 
                        ? 'bg-cyan-500 text-black' 
                        : step > s.id 
                          ? 'text-cyan-400 opacity-60' 
                          : 'text-[#5a6a85]'
                      }`}
                    >
                      {s.id}. {s.title}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#5a6a85] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Назва маршруту</label>
                    <input 
                      value={data.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Київ — Варшава"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Напрямок</label>
                    <select 
                      value={data.direction}
                      onChange={(e) => updateField('direction', e.target.value)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-cyan-500/50 appearance-none transition-all font-medium"
                    >
                      <option value="roundtrip" className="bg-[#0a0d16]">Туди і назад</option>
                      <option value="oneway" className="bg-[#0a0d16]">Тільки туди</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Кількість місць</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={data.seats}
                        onChange={(e) => updateField('seats', parseInt(e.target.value))}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                      />
                      <Clock className="absolute right-6 top-1/2 -translate-y-1/2 text-[#5a6a85]" size={18} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Валюта</label>
                    <select 
                      value={data.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-cyan-500/50 appearance-none transition-all font-medium"
                    >
                      <option value="UAH" className="bg-[#0a0d16]">UAH — Гривня</option>
                      <option value="EUR" className="bg-[#0a0d16]">EUR — Євро</option>
                      <option value="PLN" className="bg-[#0a0d16]">PLN — Злотий</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Статус</label>
                    <select 
                      value={data.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-cyan-500/50 appearance-none transition-all font-medium text-cyan-400"
                    >
                      <option value="draft" className="bg-[#0a0d16]">📝 Чернетка</option>
                      <option value="pending" className="bg-[#0a0d16]">⏳ На модерації</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Дні відправлення</label>
                  <div className="flex flex-wrap gap-3">
                    {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const days = [...data.activeDays];
                          if (days.includes(i)) {
                            updateField('activeDays', days.filter(d => d !== i));
                          } else {
                            updateField('activeDays', [...days, i]);
                          }
                        }}
                        className={`w-14 h-14 rounded-2xl border transition-all text-sm font-bold flex items-center justify-center ${
                          data.activeDays.includes(i)
                            ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                            : 'bg-white/5 border-white/10 text-[#5a6a85] hover:border-white/20'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(step === 2 || step === 3) && (
              <motion.div 
                key={step === 2 ? "step2" : "step3"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold uppercase italic tracking-tight">
                       Зупинки ({step === 2 ? 'Туди' : 'Назад'})
                    </h3>
                    <p className="text-[#5a6a85] text-[10px] font-black uppercase tracking-widest mt-1">
                      {step === 2 ? data.stopsThere.length : data.stopsBack.length} зупинок знайдено
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {step === 3 && data.stopsBack.length === 0 && (
                      <button 
                        onClick={mirrorRoute}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Copy size={14} /> Дзеркало
                      </button>
                    )}
                    <button 
                      onClick={() => setShowPaste(step === 2 ? 'there' : 'back')}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Імпорт з тексту
                    </button>
                  </div>
                </div>

                {showPaste === (step === 2 ? 'there' : 'back') && (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[28px] p-6 space-y-4">
                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                      <Info size={14} /> Вставте розклад з Viber/WhatsApp
                    </p>
                    <textarea 
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/30"
                      placeholder="08:30 Київ АС Центральна&#10;12:00 Львів АС-2 800грн&#10;16:30 Краків"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          handleParse(pasteText, step === 2 ? 'there' : 'back');
                          setPasteText('');
                          setShowPaste(null);
                        }}
                        className="px-6 py-2 bg-cyan-500 text-black rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-900/20"
                      >
                        Розпізнати
                      </button>
                      <button 
                        onClick={() => setShowPaste(null)}
                        className="px-6 py-2 bg-white/5 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-white/10"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                )}

                {/* Stops Table */}
                <div className="space-y-3">
                  {(step === 2 ? data.stopsThere : data.stopsBack).map((stop, i) => (
                    <motion.div 
                      key={i}
                      layout
                      className="bg-[#1a2235] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 group hover:border-white/10 transition-all"
                    >
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#5a6a85] text-xs font-black">
                          {i + 1}
                        </div>
                        <input 
                          value={stop.time}
                          onChange={(e) => updateStop(step === 2 ? 'there' : 'back', i, 'time', e.target.value)}
                          className="w-20 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-center font-bold"
                          placeholder="00:00"
                        />
                        <select
                          value={stop.dayOffset}
                          onChange={(e) => updateStop(step === 2 ? 'there' : 'back', i, 'dayOffset', parseInt(e.target.value))}
                          className="bg-black/30 border border-white/10 rounded-xl px-2 py-2 text-[#5a6a85] text-xs font-bold appearance-none"
                        >
                          <option value={0}>+0д</option>
                          <option value={1}>+1д</option>
                          <option value={2}>+2д</option>
                        </select>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <input 
                          value={stop.city}
                          onChange={(e) => updateStop(step === 2 ? 'there' : 'back', i, 'city', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-bold"
                          placeholder="Місто"
                        />
                        <input 
                          value={stop.address}
                          onChange={(e) => updateStop(step === 2 ? 'there' : 'back', i, 'address', e.target.value)}
                          className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-[#8899b5] text-sm"
                          placeholder="Адреса / орієнтир"
                        />
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            stop.lat ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-[#5a6a85] border border-white/10 hover:border-white/20'
                          }`}
                          title="Координати"
                        >
                          <MapPin size={18} />
                        </button>
                        <button 
                          onClick={() => removeStop(step === 2 ? 'there' : 'back', i)}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  <button 
                    onClick={() => addStop(step === 2 ? 'there' : 'back')}
                    className="w-full py-4 border border-dashed border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest text-[#5a6a85] hover:text-white hover:border-white/20 transition-all"
                  >
                    + Додати зупинку вручну
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { mode: PricingMode.SINGLE, label: 'Єдина ціна', sub: 'для всіх' },
                    { mode: PricingMode.SEGMENT, label: 'По сегментах', sub: 'A→B + B→C' },
                    { mode: PricingMode.ZONES, label: 'По зонах', sub: 'До/Після' },
                    { mode: PricingMode.KM, label: 'За км', sub: 'GPS-розрахунок' },
                    { mode: PricingMode.MATRIX, label: 'Матриця', sub: 'Вручну' }
                  ].map((pm) => (
                    <button
                      key={pm.mode}
                      onClick={() => updateField('pricingMode', pm.mode)}
                      className={`p-4 rounded-3xl border transition-all text-center flex flex-col items-center gap-1 ${
                        data.pricingMode === pm.mode
                          ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 border-white/10 text-[#5a6a85] hover:border-white/20'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">{pm.label}</span>
                      <span className="text-[8px] font-bold opacity-60 uppercase">{pm.sub}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-[#1a2235] border border-white/5 rounded-[40px] p-8">
                  {data.pricingMode === PricingMode.SINGLE && (
                    <div className="flex flex-col sm:flex-row items-end gap-4 sm:gap-6">
                      <div className="space-y-4 flex-1 w-full">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6a85]">Базова ціна ({data.currency})</label>
                        <input 
                          type="number"
                          value={data.singlePrice}
                          onChange={(e) => updateField('singlePrice', parseInt(e.target.value))}
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-3xl font-syne font-black italic focus:outline-none focus:border-cyan-500/50 appearance-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={recalculatePrices}
                        className="w-full sm:w-auto h-14 px-8 bg-cyan-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-900/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <Calculator size={18} /> Розрахувати матрицю
                      </button>
                    </div>
                  )}

                  {/* Pricing Info Banner */}
                  <div className="mt-8 bg-cyan-500/5 border border-cyan-500/20 rounded-[28px] p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-cyan-400 font-bold text-sm uppercase tracking-tight">Порада для перевізника</h4>
                      <p className="text-[#8899b5] text-xs mt-1 leading-relaxed">
                        Використовуйте "Матрицю" для точного контролю цін між невеликими містами. Пасажири бачать лише один варіант ціни для свого сегменту.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-8 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex gap-3">
            {step > 1 && (
              <button 
                onClick={prevStep}
                className="px-6 py-3 bg-white/5 text-white rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={18} /> Назад
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="px-8 py-3 bg-cyan-500 text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-cyan-900/20 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                Далі <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-10 py-4 bg-emerald-500 text-black rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isSaving ? '⏳ Збереження...' : <><Save size={20} /> Створити маршрут</>}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
