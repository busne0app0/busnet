import React, { useState } from 'react';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';

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

const PassengersTab: React.FC<PassengersTabProps> = ({ passengers, onDelete, onAdd }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Passenger | null>(null);
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');

  const [editName, setEditName] = useState('');
  const [editDoc, setEditDoc] = useState('');

  const handleEditClick = (p: Passenger) => {
    setEditName(p.name);
    setEditDoc(p.doc.replace('Паспорт: ', ''));
    setShowEditModal(p);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editName.trim() || !editDoc.trim()) {
      toast.error('Заповніть всі поля');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('passengers')
        .update({
          name: editName,
          doc: `Паспорт: ${editDoc}`
        })
        .eq('id', showEditModal.id);
      
      if (error) throw error;
      
      toast.success('Профіль оновлено');
      setShowEditModal(null);
    } catch (e) {
      toast.error('Помилка оновлення');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDoc.trim()) {
      toast.error('Заповніть всі поля');
      return;
    }
    onAdd(newName, newDoc);
    setNewName('');
    setNewDoc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Пасажири</h2>
          <p className="text-sm text-[#7a9ab5]">Збережені профілі для швидкого бронювання в один клік</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#00c8ff] text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,200,255,0.3)]"
        >
          <Plus size={16} /> Додати пасажира
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {passengers.map((p) => (
            <motion.div 
              key={p.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141c2e] border border-[#1e3a5f] rounded-2xl p-6 flex items-center gap-4 group hover:border-[#00c8ff]/30 transition-all shadow-lg"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/5
                ${p.id === 'primary' ? 'bg-gradient-to-br from-[#00c8ff] to-[#0099cc]' : 'bg-gradient-to-br from-[#1e2a40] to-[#141c2e]'}
              `}>
                {p.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-white tracking-tight">{p.name}</h4>
                    {p.role === 'Основний' && (
                      <span className="text-[8px] bg-[#00c8ff]/20 text-[#00c8ff] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-[0_0_10px_rgba(0,200,255,0.1)]">
                        Me
                      </span>
                    )}
                </div>
                <p className="text-xs text-[#7a9ab5] font-medium mt-0.5 italic">{p.doc}</p>
              </div>
              <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditClick(p)}
                  className="p-2 bg-[#1a2235] text-[#7a9ab5] hover:text-[#00c8ff] rounded-lg border border-[#1e3a5f] transition-all active:scale-90"
                >
                    <Settings size={14} />
                </button>
                {p.id !== 'primary' && (
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-2 bg-[#1a2235] text-[#7a9ab5] hover:text-[#f44336] rounded-lg border border-[#1e3a5f] transition-all active:scale-90"
                  >
                      <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Passenger Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111827] border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setShowEditModal(null)}
                className="absolute top-6 right-6 text-[#4a6a85] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-8">Редагувати профіль</h3>
              
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4a6a85] mb-2 tracking-widest pl-1">Ім'я та Прізвище</label>
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Прізвище Ім'я"
                    className="w-full bg-black/20 border border-[#1e3a5f] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#4a6a85]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4a6a85] mb-2 tracking-widest pl-1">Номер документа</label>
                  <input 
                    value={editDoc}
                    onChange={(e) => setEditDoc(e.target.value)}
                    placeholder="AA 123456"
                    className="w-full bg-black/20 border border-[#1e3a5f] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#4a6a85]"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#00c8ff] text-black text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,200,255,0.2)]"
                >
                  Оновити пасажира
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Passenger Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111827] border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-[#4a6a85] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-8">Новий пасажир</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4a6a85] mb-2 tracking-widest pl-1">Ім'я та Прізвище</label>
                  <input 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Прізвище Ім'я"
                    className="w-full bg-black/20 border border-[#1e3a5f] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#4a6a85]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4a6a85] mb-2 tracking-widest pl-1">Номер документа</label>
                  <input 
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    placeholder="AA 123456"
                    className="w-full bg-black/20 border border-[#1e3a5f] rounded-2xl px-5 py-4 text-white text-sm focus:border-[#00c8ff] outline-none transition-all placeholder:text-[#4a6a85]"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#00c8ff] text-black text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_10px_20px_rgba(0,200,255,0.2)]"
                >
                  Зберегти пасажира
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
