import React, { useState } from 'react';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

interface Passenger {
  id: string;
  name: string;
  role: string;
  doc: string;
  avatar: string;
}

interface PassengersTabProps {
  passengers: Passenger[];
  onDelete: (id: string) => void;
  onAdd: (name: string, doc: string) => void;
}

const DOC_PREFIX_REGEX = /^(Паспорт|Passport|Documento):\s*/i;

export const PassengersTab: React.FC<PassengersTabProps> = ({ passengers, onDelete, onAdd }) => {
  const { language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();

  const l = {
    title: currentLang === 'EN' ? 'Passengers' : currentLang === 'IT' ? 'Passeggero' : 'Пасажири',
    subtitle: currentLang === 'EN'
      ? 'Saved passenger profiles for fast 1-click booking'
      : currentLang === 'IT'
        ? 'Profili salvati per prenotazioni veloci in 1 clic'
        : 'Збережені профілі для швидкого бронювання в один клік',
    addBtn: currentLang === 'EN' ? 'Add Passenger' : currentLang === 'IT' ? 'Aggiungi Passeggero' : 'Додати пасажира',
    editModalTitle: currentLang === 'EN' ? 'Edit Passenger' : currentLang === 'IT' ? 'Modifica Passeggero' : 'Редагувати пасажира',
    addModalTitle: currentLang === 'EN' ? 'New Passenger' : currentLang === 'IT' ? 'Nuovo Passeggero' : 'Новий пасажир',
    nameLabel: currentLang === 'EN' ? 'First and Last Name' : currentLang === 'IT' ? 'Nome e Cognome' : "Ім'я та Прізвище",
    namePlaceholder: currentLang === 'EN' ? 'Anna Smith' : currentLang === 'IT' ? 'Maria Rossi' : 'Ірина Сидоренко',
    docLabel: currentLang === 'EN' ? 'Passport / Document #' : currentLang === 'IT' ? 'N. Documento / Passaporto' : 'Номер документа / паспорта',
    saveBtn: currentLang === 'EN' ? 'Save Passenger' : currentLang === 'IT' ? 'Salva Passeggero' : 'Зберегти пасажира',
    updateBtn: currentLang === 'EN' ? 'Update Passenger' : currentLang === 'IT' ? 'Aggiorna Passeggero' : 'Оновити пасажира',
    fillAllError: currentLang === 'EN' ? 'Please fill in all fields' : currentLang === 'IT' ? 'Compila tutti i campi' : 'Заповніть всі поля',
    updateSuccess: currentLang === 'EN' ? 'Passenger updated' : currentLang === 'IT' ? 'Passeggero aggiornato' : 'Профіль оновлено',
    updateError: currentLang === 'EN' ? 'Failed to update' : currentLang === 'IT' ? 'Errore di aggiornamento' : 'Помилка оновлення',
    primaryEditHint: currentLang === 'EN' ? 'Edit primary profile in the Profile tab' : currentLang === 'IT' ? 'Modifica il profilo principale nella scheda Profilo' : 'Редагуйте основний профіль у вкладці «Профіль»',
    meBadge: currentLang === 'EN' ? 'Me' : currentLang === 'IT' ? 'Io' : 'Я',
    editTooltip: currentLang === 'EN' ? 'Edit' : currentLang === 'IT' ? 'Modifica' : 'Редагувати',
    deleteTooltip: currentLang === 'EN' ? 'Delete' : currentLang === 'IT' ? 'Elimina' : 'Видалити',
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Passenger | null>(null);
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');

  const [editName, setEditName] = useState('');
  const [editDoc, setEditDoc] = useState('');

  // Очищення тільки номеру документа для інпута
  const cleanDocNumber = (rawDoc: string) => {
    return (rawDoc || '').replace(DOC_PREFIX_REGEX, '').trim();
  };

  // Відображення локалізованого префікса документа на екрані (без зміни самої бази)
  const displayDoc = (rawDoc: string) => {
    if (!rawDoc) return '';
    const numberOnly = cleanDocNumber(rawDoc);
    const prefix = currentLang === 'EN' ? 'Passport: ' : currentLang === 'IT' ? 'Documento: ' : 'Паспорт: ';
    return `${prefix}${numberOnly}`;
  };

  const handleEditClick = (p: Passenger) => {
    // Якщо це віртуальний 'primary' пасажир, нагадуємо редагувати в Профілі
    if (p.id === 'primary') {
      toast(l.primaryEditHint, { icon: '👤' });
      return;
    }
    setEditName(p.name);
    setEditDoc(cleanDocNumber(p.doc));
    setShowEditModal(p);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editName.trim() || !editDoc.trim()) {
      toast.error(l.fillAllError);
      return;
    }

    const cleanName = editName.trim();
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      // ✅ Зберігаємо завжди стабільний канонічний префікс 'Паспорт: '
      const canonicalDoc = `Паспорт: ${cleanDocNumber(editDoc)}`;

      const { error } = await supabase
        .from('passengers')
        .update({
          name: cleanName,
          first_name: firstName,
          last_name: lastName,
          doc: canonicalDoc
        })
        .eq('id', showEditModal.id);

      if (error) throw error;

      // Локально оновлюємо дані у вибраного пасажира
      showEditModal.name = cleanName;
      showEditModal.doc = canonicalDoc;

      toast.success(l.updateSuccess);
      setShowEditModal(null);
    } catch (e) {
      toast.error(l.updateError);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDoc.trim()) {
      toast.error(l.fillAllError);
      return;
    }
    onAdd(newName.trim(), cleanDocNumber(newDoc));
    setNewName('');
    setNewDoc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{l.title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{l.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-400 hover:bg-cyan-300 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> {l.addBtn}
        </button>
      </div>

      {/* Список карток */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {passengers.map((p) => {
            const isPrimary = p.id === 'primary' || p.role === 'Основний';
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center gap-4 group hover:border-cyan-500/40 transition-all shadow-xl shadow-black/40"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black text-lg sm:text-xl shadow-lg border border-white/10 shrink-0 ${isPrimary ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-black' : 'bg-slate-800 text-white'
                  }`}>
                  {p.avatar || p.name?.[0] || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white tracking-tight truncate">{p.name}</h4>
                    {isPrimary && (
                      <span className="text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {l.meBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{displayDoc(p.doc)}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditClick(p)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-xl border border-slate-700 transition-all active:scale-90 cursor-pointer"
                    title={l.editTooltip}
                  >
                    <Settings size={15} />
                  </button>
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all active:scale-90 cursor-pointer"
                      title={l.deleteTooltip}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Модалка редагування */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-black uppercase text-white mb-6">{l.editModalTitle}</h3>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{l.nameLabel}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={l.namePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{l.docLabel}</label>
                  <input
                    type="text"
                    value={editDoc}
                    onChange={(e) => setEditDoc(e.target.value)}
                    placeholder="AA 123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
                >
                  {l.updateBtn}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модалка додавання */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-black uppercase text-white mb-6">{l.addModalTitle}</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{l.nameLabel}</label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={l.namePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{l.docLabel}</label>
                  <input
                    type="text"
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    placeholder="AA 123456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer"
                >
                  {l.saveBtn}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PassengersTab;