/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Star, Wallet, Target, Clock, MapPin, Globe, CheckCircle2, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Марія',
    surname: 'Ковалець',
    nickname: 'mariya_k_kyiv',
    email: 'm.kovalets@busnet.ua',
    region: 'Київ',
    languages: 'Українська, Польська, Англійська'
  });

  const handleSave = () => {
    toast.loading('Збереження профілю...', { duration: 1500 });
    setTimeout(() => {
      toast.success('Налаштування профілю успішно оновлено!');
    }, 1500);
  };
  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
            Мій профіль
          </h1>
          <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
            Особисті дані та статистика агента
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#7c5cfc] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Зберегти зміни
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-[#151c28] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#7c5cfc08] blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 relative z-10">
              <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#7c5cfc] to-[#5533dd] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-purple-900/40 relative">
                МК
                <div className="absolute -bottom-2 -right-2 p-2 bg-[#151c28] border border-white/10 rounded-xl text-[#f5c842] shadow-lg">
                  <Star size={16} fill="currentColor" />
                </div>
              </div>
              <div className="text-center md:text-left space-y-2">
                <div className="font-['Syne'] font-black text-2xl text-white italic tracking-tighter">Марія Ковалець</div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">
                    <Shield size={12} className="text-[#a28afd]" /> TOP агент
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">
                    <MapPin size={12} className="text-[#a28afd]" /> Київ
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#4a5c72] font-black uppercase tracking-widest">
                    <Clock size={12} className="text-[#a28afd]" /> з 01.03.2024
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Ім'я</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Прізвище</label>
                  <input 
                    type="text" 
                    value={profile.surname}
                    onChange={(e) => setProfile({...profile, surname: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Нікнейм агента</label>
                  <input 
                    type="text" 
                    value={profile.nickname}
                    onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-[#a28afd] outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Email (логін)</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Регіон роботи</label>
                  <input 
                    type="text" 
                    value={profile.region}
                    onChange={(e) => setProfile({...profile, region: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Globe size={12} /> Мови спілкування
                  </label>
                  <input 
                    type="text" 
                    value={profile.languages}
                    onChange={(e) => setProfile({...profile, languages: e.target.value})}
                    className="w-full bg-[#121824] border border-white/5 rounded-xl py-3 px-6 text-sm font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] p-8 overflow-hidden group">
            <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-wider text-white mb-8 flex items-center gap-3">
              <Star size={16} className="text-[#f5c842]" fill="currentColor" /> Статистика агента
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Статус', val: 'TOP агент', type: 'gold' },
                { label: 'Поточна комісія', val: '8% / 10% (власні)', type: 'purple' },
                { label: 'Всього продажів', val: '347', type: 'bold' },
                { label: 'Зароблено всього', val: '€2,076', type: 'green' },
                { label: 'Пасажирів у базі', val: '54', type: 'bold' },
                { label: 'Конверсія', val: '34%', type: 'green' },
                { label: 'Рейтинг у платформі', val: '#1 з 47', type: 'gold' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] pb-4 border-b border-white/[0.02] last:border-0 last:pb-0">
                  <span className="text-[#4a5c72] uppercase font-bold tracking-widest text-[9px]">{item.label}</span>
                  <span className={`
                    font-black tracking-tight italic
                    ${item.type === 'green' ? 'text-[#00d97e]' : ''}
                    ${item.type === 'purple' ? 'text-[#a28afd]' : ''}
                    ${item.type === 'gold' ? 'text-[#f5c842]' : ''}
                    ${item.type === 'bold' ? 'text-white' : ''}
                  `}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-[#1a2234] border border-[#7c5cfc26] rounded-[32px] p-8 group">
            <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-wider text-[#a28afd] mb-8 flex items-center gap-3">
              <Wallet size={16} /> Реквізити для виплат
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">IBAN</label>
                <input type="text" defaultValue="UA12****7890" placeholder="UA + 27 цифр" className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">Банк</label>
                <input type="text" defaultValue="ПриватБанк" className="w-full bg-black/20 border border-white/5 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none focus:border-[#7c5cfc] transition-all" />
              </div>
              <p className="text-[9px] text-[#4a5c72] leading-relaxed italic border-l-2 border-[#7c5cfc33] pl-3">
                Зміна реквізитів потребує підтвердження адміном. Поточні реквізити залишаються активними до схвалення.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
