/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Star, Bus, Map, ShieldCheck, 
  AlertTriangle, X, Check, Link as LinkIcon,
  Phone, Mail, Globe, Clock, History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CARRIERS_DATA } from './constants';

export default function Carriers() {
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [showJoinLink, setShowJoinLink] = useState(false);

  const handleViewOffers = (carrier: any) => {
    // Mock logic: some have offers, some don't
    const hasOffers = Math.random() > 0.5;
    if (hasOffers) {
      toast.success(`Знайдено 2 спеціальні пропозиції від ${carrier.name}`);
    } else {
      toast.error(
        <div>
          <p className="font-bold">Перевізник поки що не надав пропозицій</p>
          <p className="text-[10px] mt-1">Ви можете запропонувати співпрацю через підтримку</p>
        </div>
      );
    }
  };

  const generateJoinLink = () => {
    const link = `https://busnet.ua/join/carrier?ref=agent_mk_${Math.random().toString(36).substring(7)}`;
    navigator.clipboard.writeText(link);
    toast.success('Посилання для реєстрації скопійовано! Надішліть його перевізнику.');
    setShowJoinLink(true);
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          Перевізники
        </h1>
        <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
          Всі перевізники платформи BUSNET UA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {CARRIERS_DATA.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedCarrier(c)}
            className={`
              bg-[#151c28] border border-white/5 rounded-[32px] p-6 group hover:border-white/10 transition-all cursor-pointer relative overflow-hidden
            `}
          >
            {/* Background Icon */}
            <Building2 className="absolute -right-4 -bottom-4 text-white/[0.02] w-32 h-32 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
            
            <div className="flex items-start gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-xl shadow-black/40 group-hover:scale-110 transition-transform" style={{ backgroundColor: c.av }}>
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate flex items-center gap-2 group-hover:text-[#a28afd] transition-colors">
                  {c.name}
                  {c.status === 'active' && <ShieldCheck size={14} className="text-[#00d97e]" />}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1 text-[#f5c842]">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-black italic">{c.rating}</span>
                  </div>
                  <span className={`
                    px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border
                    ${c.status === 'active' ? 'bg-[#00d97e12] text-[#00d97e] border-[#00d97e26]' : 'bg-[#ff9d0012] text-[#ff9d00] border-[#ff9d0026]'}
                  `}>
                    {c.status === 'active' ? 'Активний' : 'Обережно'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-black/20 p-3 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[8px] text-[#4a5c72] font-black uppercase tracking-widest leading-none">
                  <Map size={10} /> Маршрутів
                </div>
                <div className="text-sm font-black text-white italic tracking-tighter leading-none">{c.routes}</div>
              </div>
              <div className="bg-black/20 p-3 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[8px] text-[#4a5c72] font-black uppercase tracking-widest leading-none">
                  <Bus size={10} /> Рейсів
                </div>
                <div className="text-sm font-black text-[#a28afd] italic tracking-tighter leading-none">{c.trips}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOffers(c);
                }}
                className="text-[10px] text-[#7a8fa8] hover:text-white font-bold uppercase tracking-widest transition-all"
              >
                Переглянути пропозиції
              </button>
              <div className="w-8 h-8 rounded-xl bg-[#7c5cfc] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-110 transition-transform">
                <Bus size={16} />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Info Card */}
        <div className="bg-gradient-to-br from-[#7c5cfc14] to-transparent border border-[#7c5cfc26] rounded-[32px] p-8 flex flex-col items-center justify-center text-center group md:col-span-2 lg:col-span-1">
          <div className="w-16 h-16 rounded-[24px] bg-[#7c5cfc1a] border border-[#7c5cfc33] flex items-center justify-center text-[#7c5cfc] mb-6 group-hover:rotate-12 transition-transform">
            <Building2 size={32} />
          </div>
          <h3 className="font-['Syne'] font-black text-lg text-white uppercase italic tracking-tighter mb-3 leading-tight">Бажаєте підключити нового перевізника?</h3>
          <p className="text-xs text-[#7a8fa8] leading-relaxed mb-6 font-medium">Отримуйте додаткові 2% комісії за кожного залученого перевізника до системи BUSNET</p>
          <div className="w-full space-y-3">
            <button 
              onClick={generateJoinLink}
              className="w-full py-3 bg-[#7c5cfc] text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LinkIcon size={14} /> {showJoinLink ? 'Лінк скопійовано' : 'Згенерувати лінк'}
            </button>
            <button className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Зв'язатись з підтримкою
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {selectedCarrier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="w-full max-w-2xl bg-[#0d1119] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative"
            >
              <button onClick={() => setSelectedCarrier(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#4a5c72] hover:text-white transition-all z-10">
                <X size={20} />
              </button>
              
              <div className="p-10">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-[32px] flex items-center justify-center font-black text-white text-3xl shadow-2xl" style={{ backgroundColor: selectedCarrier.av }}>
                    {selectedCarrier.name[0]}
                  </div>
                  <div>
                    <h2 className="font-['Syne'] font-black text-3xl text-white uppercase italic tracking-tighter leading-none mb-2">{selectedCarrier.name}</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[#f5c842]">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-black italic">{selectedCarrier.rating} Рейтинг</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${selectedCarrier.status === 'active' ? 'bg-[#00d97e12] text-[#00d97e] border-[#00d97e26]' : 'bg-[#ff9d0012] text-[#ff9d00] border-[#ff9d0026]'}`}>
                        {selectedCarrier.status === 'active' ? 'Перевірено BUSNET' : 'Потребує уваги'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Контакти</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><Phone size={14} className="text-[#a28afd]" /> +38 (067) 123-45-67</div>
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><Mail size={14} className="text-[#a28afd]" /> info@{selectedCarrier.name.toLowerCase().replace(/[\s"']+/g, '')}.ua</div>
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><Globe size={14} className="text-[#a28afd]" /> www.{selectedCarrier.name.toLowerCase().replace(/[\s"']+/g, '')}.ua</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Платформа</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><Map size={14} className="text-[#a28afd]" /> {selectedCarrier.routes} Активних маршрутів</div>
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><Clock size={14} className="text-[#a28afd]" /> Працює з 2024 року</div>
                      <div className="flex items-center gap-3 text-xs font-bold text-white"><History size={14} className="text-[#a28afd]" /> {selectedCarrier.trips} Виконаних рейсів</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em]">Послуги на борту</div>
                  <div className="flex flex-wrap gap-2">
                    {['Wi-Fi', 'USB', 'Кондиціонер', 'WC', 'Страхування'].map(s => (
                      <span key={s} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => handleViewOffers(selectedCarrier)} className="flex-1 py-4 bg-[#7c5cfc] text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all">
                    Переглянути пропозиції
                  </button>
                  <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10">
                    Написати в чат
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
