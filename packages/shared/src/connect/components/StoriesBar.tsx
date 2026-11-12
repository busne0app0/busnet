import React, { useEffect, useId, useRef, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import type { ConnectStoryItem } from '../types/connect.types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export const StoriesBar: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeStory, setActiveStory] = useState<ConnectStoryItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const storyTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  const stories: ConnectStoryItem[] = [
    {
      id: 's1',
      author: 'BUSNET Radar',
      authorAvatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150',
      mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
      caption: 'Краківець — Корчова: черга легкових та автобусів до 3 годин. Працюють 4 смуги.',
      tag: 'Кордони Live',
      createdAt: '1 год тому',
    },
    {
      id: 's2',
      author: 'Олена (Рим)',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      mediaUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      caption: 'Приїхали до Рима на ранковому рейсі з Києва. Погода неймовірна +22°C!',
      tag: 'Рим & Мілан',
      createdAt: '3 год тому',
    },
    {
      id: 's3',
      author: 'Максим_Express',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      mediaUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
      caption: 'Завтра вирушаю Львів → Болонья. Є місце для 2 невеликих коробок.',
      tag: 'Посилки',
      createdAt: '5 год тому',
    },
    {
      id: 's4',
      author: 'Travel Family',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      caption: 'Лайфхак: де біля вокзалу в Мілані випити найкращий еспресо за 1 євро.',
      tag: 'Лайфхаки',
      createdAt: 'Вчора',
    },
  ];

  useEffect(() => {
    if (!activeStory) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveStory(null);
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      storyTriggerRef.current?.focus();
    };
  }, [activeStory]);

  const handleAddStory = () => {
    if (!isAuthenticated) {
      toast.error('Авторизуйтесь, щоб додати історію');
      return;
    }

    toast('Завантаження власних історій буде доступне в наступному релізі');
  };

  return (
    <section aria-label="Історії мандрівників" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Миті з доріг</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Історії спільноти BUSNET</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">{stories.length} історії</span>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={handleAddStory}
          aria-label="Додати власну історію"
          className="group flex w-[72px] shrink-0 flex-col items-center gap-2 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11]"
        >
          <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border border-dashed border-cyan-200/30 bg-white/[0.025] transition-colors group-hover:border-cyan-200/60 group-hover:bg-cyan-200/[0.05]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-slate-950 transition-transform group-hover:scale-105">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
          <span className="w-full truncate text-[11px] font-medium text-slate-400 transition-colors group-hover:text-white">
            Ваша історія
          </span>
        </button>

        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={(event) => {
              storyTriggerRef.current = event.currentTarget;
              setActiveStory(story);
            }}
            aria-label={`Відкрити історію ${story.author}: ${story.tag}`}
            className="group flex w-[72px] shrink-0 flex-col items-center gap-2 rounded-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b11]"
          >
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-cyan-200 via-sky-500 to-indigo-500 p-[2px] transition-transform duration-200 group-hover:scale-[1.04]">
              <span className="h-full w-full rounded-full bg-[#080b11] p-[2px]">
                <img
                  src={story.authorAvatar}
                  alt=""
                  loading="lazy"
                  className="h-full w-full rounded-full object-cover"
                />
              </span>
            </span>
            <span className="w-full truncate text-[11px] font-medium text-slate-400 transition-colors group-hover:text-white">
              {story.author}
            </span>
          </button>
        ))}
      </div>

      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            onClick={(event) => event.stopPropagation()}
            className="relative flex h-[min(82vh,760px)] min-h-[420px] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0c1420] shadow-2xl shadow-black/40"
          >
            <img
              src={activeStory.mediaUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/85" />

            <div className="relative z-10 flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={activeStory.authorAvatar}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border border-white/30 object-cover"
                />
                <div className="min-w-0">
                  <h3 id={dialogTitleId} className="truncate text-sm font-semibold text-white">
                    {activeStory.author}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-white/70">
                    {activeStory.tag} <span aria-hidden="true">·</span> {activeStory.createdAt}
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActiveStory(null)}
                aria-label="Закрити історію"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative z-10 mt-auto p-5 sm:p-6">
              <div className="mb-4 h-px w-10 rounded-full bg-cyan-200/80" aria-hidden="true" />
              <p id={dialogDescriptionId} className="max-w-sm text-base font-medium leading-7 text-white sm:text-lg">
                {activeStory.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
