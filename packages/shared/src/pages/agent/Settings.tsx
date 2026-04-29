/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Lock, Zap, Globe, Shield, 
  Mail, MessageSquare, History, Phone,
  ChevronRight, Smartphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('agent_settings');
      return saved ? JSON.parse(saved) : {
        booking: true, payout: true, push: true, chat: true, marketing: false, weekly: true, autoSave: true, reminder: true
      };
    } catch {
      return { booking: true, payout: true, push: true, chat: true, marketing: false, weekly: true, autoSave: true, reminder: true };
    }
  });

  const handleToggle = (id: string) => {
    const next = { ...toggles, [id]: !toggles[id] };
    setToggles(next);
    try { localStorage.setItem('agent_settings', JSON.stringify(next)); } catch {}
    toast.success('Налаштування оновлено');
  };

  const Switch = ({ id, on }: { id: string, on: boolean }) => (
    <button 
      onClick={() => handleToggle(id)}
      className={`
        relative w-9 h-5 rounded-full transition-all duration-300 shadow-inner
        ${on ? 'bg-[#7c5cfc]' : 'bg-[#121824] border border-white/10'}
      `}
    >
      <div className={`
        absolute top-1 w-3 h-3 rounded-full transition-all duration-300
        ${on ? 'left-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'left-1 bg-[#4a5c72]'}
      `} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="font-['Syne'] font-black text-2xl tracking-tighter uppercase italic text-white flex items-center gap-3">
          Налаштування
        </h1>
        <p className="text-[11px] text-[#4a5c72] uppercase tracking-[0.2em] font-bold mt-1">
          Персоналізація кабінету агента та безпека
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <Bell size={16} className="text-[#a28afd]" />
              <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Сповіщення</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'booking', label: 'Email про нове бронювання', sub: 'При підтвердженні квитка' },
                { id: 'payout', label: 'Email про виплату', sub: 'При зарахуванні комісії' },
                { id: 'push', label: 'Сповіщення в кабінеті', sub: 'Push від системи BUSNET' },
                { id: 'chat', label: 'Нові повідомлення', sub: 'Сповіщення в чаті' },
                { id: 'marketing', label: 'Маркетингові розсилки', sub: 'Акції та новини платформи' },
                { id: 'weekly', label: 'Щотижневий звіт', sub: 'Статистика по понеділках' },
              ].map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1 transition-all group">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-white tracking-tight">{s.label}</div>
                    <div className="text-[9px] text-[#4a5c72] font-medium uppercase tracking-widest leading-none">{s.sub}</div>
                  </div>
                  <Switch id={s.id} on={toggles[s.id]} />
                </div>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <Lock size={16} className="text-[#ff3d5a]" />
              <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Зміна паролю</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Поточний пароль', type: 'password' },
                { label: 'Новий пароль', type: 'password', sub: 'Мін. 8 символів' },
                { label: 'Підтвердіть новий', type: 'password' },
              ].map((f, i) => (
                <div key={i} className="space-y-1.5 text-xs">
                  <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-widest flex items-center gap-2 px-1">
                    {f.label} {f.sub && <span className="lowercase text-[8px] opacity-50">({f.sub})</span>}
                  </label>
                  <input type={f.type} className="w-full bg-[#121824] border border-white/5 rounded-xl py-2.5 px-4 font-bold text-white outline-none focus:border-[#ff3d5a] transition-all" placeholder="••••••••" />
                </div>
              ))}
              <button 
                onClick={() => toast.success('Пароль змінено')}
                className="w-full mt-4 py-3 bg-gradient-to-r from-[#ff3d5a] to-[#cc3300] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Змінити пароль
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Automation */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <Zap size={16} className="text-[#f5c842]" fill="currentColor" />
              <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Автоматизація</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'autoSave', label: 'Автозбереження клієнтів', sub: 'При бронюванні зберігати в базу' },
                { id: 'reminder', label: 'Нагадування за 24год', sub: 'Надіслати нагадування пасажиру' },
              ].map((s) => (
                <div key={s.id} className="flex justify-between items-center py-1 group transition-all">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-white tracking-tight">{s.label}</div>
                    <div className="text-[9px] text-[#4a5c72] font-medium uppercase tracking-widest leading-none">{s.sub}</div>
                  </div>
                  <Switch id={s.id} on={toggles[s.id]} />
                </div>
              ))}
            </div>
          </div>

          {/* Region */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <Globe size={16} className="text-[#00c4d4]" />
              <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Мова та регіон</h3>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: 'Мова інтерфейсу', options: ['Українська', 'English', 'Polski'] },
                { label: 'Валюта', options: ['EUR (€)', 'UAH (₴)', 'USD ($)'] },
                { label: 'Часовий пояс', options: ['Київ (UTC+3)', 'Варшава (UTC+2)'] },
              ].map((f, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[9px] font-black text-[#4a5c72] uppercase tracking-[0.2em] ml-1">{f.label}</label>
                  <select className="w-full bg-[#121824] border border-white/5 rounded-xl py-2.5 px-4 text-xs font-bold text-white outline-none focus:border-[#00c4d4] cursor-pointer appearance-none">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-[#151c28] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <Shield size={16} className="text-[#00d97e]" />
              <h3 className="font-['Syne'] font-bold text-xs uppercase tracking-tight">Безпека</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center py-1 transition-all group">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-white tracking-tight flex items-center gap-2">
                    Двофакторна автентифікація <Smartphone size={12} className="text-[#4a5c72]" />
                  </div>
                  <div className="text-[9px] text-[#4a5c72] font-medium uppercase tracking-widest leading-none">SMS або Google Authenticator</div>
                </div>
                <Switch id="2fa" on={false} />
              </div>
              <div className="h-px bg-white/5" />
              <button 
                onClick={() => toast.success('Всі сесії завершено')}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#7a8fa8] hover:text-[#ff3d5a] hover:bg-[#ff3d5a0a] hover:border-[#ff3d5a22] transition-all flex items-center justify-center gap-2 group"
              >
                <Lock size={12} className="group-hover:rotate-12 transition-transform" /> Завершити всі сесії
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
