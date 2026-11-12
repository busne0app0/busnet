import React from 'react';
import { MessageSquare, Shield, Lock, Sparkles, Send, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export const MessagesView: React.FC = () => {
  const handleNotifyMe = () => {
    toast.success('Дякуємо! Ви першими отримаєте доступ до BUSNET MESSENGER.');
  };

  const features = [
    { title: 'Особисті та групові чати', desc: 'Зручне спілкування з попутниками та відправниками посилок' },
    { title: 'Чат з перевізником рейсу', desc: 'Прямий зв’язок із водієм та диспетчером після бронювання' },
    { title: 'Захист персональних даних', desc: 'Ваш номер телефону та email залишаються конфіденційними' },
    { title: 'Supabase Realtime синхронізація', desc: 'Миттєва доставка повідомлень, статус прочитання та вкладення' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-center space-y-6">
      <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-blue-500/5 border border-cyan-500/30 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
        <MessageSquare className="w-12 h-12 text-cyan-400" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ЕТАП 2 • ГОТУЄТЬСЯ ДО ЗАПУСКУ</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          BUSNET <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">MESSENGER</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Повноцінний вбудований месенджер для пасажирів, водіїв та перевізників Європи. Зв’язуйтесь напряму без сторонніх додатків.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-4">
        {features.map((f, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="text-xs font-bold text-white mb-1 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{f.title}</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={handleNotifyMe}
          className="px-6 py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(0,212,255,0.25)] inline-flex items-center space-x-2"
        >
          <Bell className="w-4 h-4" />
          <span>Сповістити мене про запуск чатів</span>
        </button>
      </div>
    </div>
  );
};

