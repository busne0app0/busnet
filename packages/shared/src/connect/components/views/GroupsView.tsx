import React, { useState } from 'react';
import { Users, Lock, Globe, Sparkles, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const GroupsView: React.FC = () => {
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const groups = [
    {
      id: 'g1',
      title: 'Українці в Італії (Рим, Мілан, Неаполь)',
      members: '4,820 учасників',
      type: 'PUBLIC',
      desc: 'Спільнота взаємодопомоги: оренда, робота, документи, поради та маршрути в Італії.',
      icon: '🇮🇹',
    },
    {
      id: 'g2',
      title: 'Подорожі Європою & Пошук Попутників',
      members: '6,150 учасників',
      type: 'PUBLIC',
      desc: 'Шукаємо попутників для далеких поїздок, ділимо витрати на трансфери, ділимося знижками на квитки.',
      icon: '🚌',
    },
    {
      id: 'g3',
      title: 'Посилки та передачі (Україна ⇄ ЄС)',
      members: '3,940 учасників',
      type: 'PUBLIC',
      desc: 'Допомога з передачею документів, речей та подарунків рідним через перевірених пасажирів.',
      icon: '📦',
    },
    {
      id: 'g4',
      title: 'Перевізники & Диспетчери BUSNET',
      members: '280 учасників',
      type: 'PRIVATE',
      desc: 'Закрите ком’юніті ліцензованих перевізників: координація рейсів, автостанції, актуальні правила.',
      icon: '🛡️',
    },
  ];

  const handleToggleJoin = (id: string, title: string) => {
    if (joinedGroups.includes(id)) {
      setJoinedGroups(joinedGroups.filter(g => g !== id));
      toast('Ви покинули групу', { icon: '👋' });
    } else {
      setJoinedGroups([...joinedGroups, id]);
      toast.success(`Ви приєдналися до: ${title}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1628] to-[#070e1c] border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-2 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>СПІЛЬНОТИ ЗА ІНТЕРЕСАМИ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Тематичні групи BUSNET CONNECT</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Знаходьте однодумців за країною проживання, напрямком подорожей або сферою діяльності.
          </p>
        </div>

        <button
          onClick={() => toast('Створення власних груп буде відкрито на Етапі 3', { icon: '👥' })}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center space-x-2 transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Створити групу</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groups.map((g) => {
          const isJoined = joinedGroups.includes(g.id);
          return (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-[#0c1424] border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {g.type}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white mb-1.5">{g.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{g.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/70 text-xs">
                <span className="text-slate-500 font-medium">{g.members}</span>
                <button
                  onClick={() => handleToggleJoin(g.id, g.title)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center space-x-1.5 ${
                    isJoined
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ви учасник</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Приєднатися</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

