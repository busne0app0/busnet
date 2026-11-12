import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { ConnectStoryItem } from '../types/connect.types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export const StoriesBar: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeStory, setActiveStory] = useState<ConnectStoryItem | null>(null);

  // Curated demo stories showcasing the vision for European travelers
  const stories: ConnectStoryItem[] = [
    {
      id: 's1',
      author: 'BUSNET Radar',
      authorAvatar: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150',
      mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
      caption: '🚨 Краківець — Корчова: черга легкових та автобусів до 3 годин. Працюють 4 смуги.',
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
      caption: '📦 Завтра вирушаю Львів → Болонья. Є місце для 2 невеликих коробок.',
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

  const handleAddStory = () => {
    if (!isAuthenticated) {
      toast.error('Авторизуйтесь, щоб додати історію');
      return;
    }
    toast('Функціонал завантаження власних Stories буде доступний у наступному релізі', {
      icon: '📸',
    });
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-2 px-1">
        {/* Add Story Button */}
        <button
          onClick={handleAddStory}
          className="flex-shrink-0 flex flex-col items-center space-y-1.5 focus:outline-none group"
        >
          <div className="w-16 h-16 rounded-full bg-[#0d1627] border-2 border-dashed border-cyan-500/40 group-hover:border-cyan-400 flex items-center justify-center transition-all group-hover:scale-105 shadow-[0_0_15px_rgba(0,212,255,0.1)]">
            <Plus className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Ваша історія</span>
        </button>

        {/* Stories List */}
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex-shrink-0 flex flex-col items-center space-y-1.5 focus:outline-none group"
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 group-hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]">
              <img
                src={story.authorAvatar}
                alt={story.author}
                className="w-full h-full rounded-full object-cover border-2 border-[#090e1a]"
              />
            </div>
            <span className="text-[11px] font-medium text-slate-300 truncate w-16 text-center group-hover:text-cyan-300">
              {story.author}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={activeStory.authorAvatar}
                  alt={activeStory.author}
                  className="w-8 h-8 rounded-full border border-cyan-400 object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-white">{activeStory.author}</div>
                  <div className="text-[10px] text-cyan-400 font-semibold">{activeStory.tag} • {activeStory.createdAt}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media */}
            <img
              src={activeStory.mediaUrl}
              alt="Story media"
              className="w-full h-[65vh] object-cover"
            />

            {/* Caption */}
            <div className="p-4 bg-[#0d1627] text-xs text-white leading-relaxed">
              {activeStory.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

