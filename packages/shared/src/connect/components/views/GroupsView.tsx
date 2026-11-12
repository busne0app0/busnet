"use client";

import React, { useState } from 'react';
import { Bus, Check, Globe, Lock, MapPin, Package, Plus, ShieldCheck, Sparkles, Users } from 'lucide-react';
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
      icon: MapPin,
    },
    {
      id: 'g2',
      title: 'Подорожі Європою & Пошук Попутників',
      members: '6,150 учасників',
      type: 'PUBLIC',
      desc: 'Шукаємо попутників для далеких поїздок, ділимо витрати на трансфери, ділимося знижками на квитки.',
      icon: Bus,
    },
    {
      id: 'g3',
      title: 'Посилки та передачі (Україна ⇄ ЄС)',
      members: '3,940 учасників',
      type: 'PUBLIC',
      desc: 'Допомога з передачею документів, речей та подарунків рідним через перевірених пасажирів.',
      icon: Package,
    },
    {
      id: 'g4',
      title: 'Перевізники & Диспетчери BUSNET',
      members: '280 учасників',
      type: 'PRIVATE',
      desc: 'Закрите ком’юніті ліцензованих перевізників: координація рейсів, автостанції, актуальні правила.',
      icon: ShieldCheck,
    },
  ];

  const handleToggleJoin = (id: string, title: string) => {
    const isJoining = !joinedGroups.includes(id);

    setJoinedGroups((currentGroups) =>
      currentGroups.includes(id)
        ? currentGroups.filter((groupId) => groupId !== id)
        : [...currentGroups, id],
    );

    if (isJoining) {
      toast.success(`Ви приєдналися до: ${title}`);
    } else {
      toast.success('Ви покинули групу');
    }
  };

  return (
    <section aria-label="Тематичні групи BUSNET Connect" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Intro */}
      <header aria-labelledby="groups-title" className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1628] to-[#070e1c] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>СПІЛЬНОТИ ЗА ІНТЕРЕСАМИ</span>
          </div>
          <h2 id="groups-title" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Тематичні групи BUSNET CONNECT</h2>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
            Знаходьте однодумців за країною проживання, напрямком подорожей або сферою діяльності.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast('Створення власних груп буде відкрито на Етапі 3')}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <Plus className="size-4 text-cyan-300" aria-hidden="true" />
          <span>Створити групу</span>
        </button>
      </header>

      <section aria-label="Список тематичних груп" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const isJoined = joinedGroups.includes(group.id);
          const GroupIcon = group.icon;
          const isPrivate = group.type === 'PRIVATE';

          return (
            <article
              key={group.id}
              className="flex min-h-64 flex-col justify-between gap-6 rounded-2xl border border-slate-800/80 bg-[#0c1424] p-5 transition-colors hover:border-cyan-500/30 sm:p-6"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-200">
                    <GroupIcon className="size-5" aria-hidden="true" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isPrivate
                    ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200'
                    : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200'
                    }`}>
                    {isPrivate ? (
                      <>
                        <Lock className="size-3" aria-hidden="true" />
                        <span>Закрита</span>
                      </>
                    ) : (
                      <>
                        <Globe className="size-3" aria-hidden="true" />
                        <span>Відкрита</span>
                      </>
                    )}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-semibold leading-snug text-white sm:text-base">{group.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{group.desc}</p>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Users className="size-3.5 text-slate-500" aria-hidden="true" />
                  {group.members}
                </span>
                <button
                  type="button"
                  aria-pressed={isJoined}
                  aria-label={isJoined ? `Покинути групу ${group.title}` : `Приєднатися до групи ${group.title}`}
                  onClick={() => handleToggleJoin(group.id, group.title)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${isJoined
                      ? 'border-emerald-500/30 bg-slate-800 text-emerald-300 hover:bg-slate-700'
                      : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                    }`}
                >
                  {isJoined ? (
                    <Check className="size-3.5 text-emerald-300" aria-hidden="true" />
                  ) : (
                    <Plus className="size-3.5" aria-hidden="true" />
                  )}
                  <span>{isJoined ? 'Ви учасник' : 'Приєднатися'}</span>
                </button>
              </footer>
            </article>
          );
        })}
      </section>
    </section>
  );
};
