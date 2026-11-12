import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  MapPin, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { ConnectPost, ConnectTabType } from '../../types/connect.types';
import { PostCard } from '../PostCard';
import { useAuthStore } from '../../../store/useAuthStore';

interface HomeViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onSelectTab: (tab: ConnectTabType) => void;
  onOpenCreateModal: () => void;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  posts,
  savedPostIds,
  onSelectTab,
  onOpenCreateModal,
  onLike,
  onToggleSave,
  onOpenComments,
  onNavigateToBooking,
}) => {
  const { user } = useAuthStore();
  const topTrending = posts.slice(0, 3);

  const stats = [
    { label: 'Спільнота', value: '14,200+', detail: 'Мандрівників у Європі' },
    { label: 'Маршрути', value: '180+', detail: 'Міст Україна — ЄС' },
    { label: 'Допомога', value: '24/7', detail: 'Взаємовиручка на дорогах' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c182d] via-[#091122] to-[#050a14] border border-cyan-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>СОЦІАЛЬНИЙ ХАБ МАНДРІВНИКІВ ЄВРОПИ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
            Вітаємо у <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">BUSNET CONNECT</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Перший український простір для тих, хто подорожує або живе в Європі. Знаходьте перевірених попутників, передавайте посилки, дізнавайтеся реальну ситуацію на кордонах та діліться власним досвідом.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center space-x-2 shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Створити публікацію</span>
            </button>

            <button
              onClick={() => onSelectTab('community')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <span>Відкрити стрічку</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
              <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs font-bold text-cyan-400">{s.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured / Trending Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Актуальні обговорення</h2>
          </div>
          <button
            onClick={() => onSelectTab('community')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Всі публікації</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topTrending.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
            Публікацій поки що немає. Будьте першим, хто поділиться історією!
          </div>
        ) : (
          <div className="space-y-4">
            {topTrending.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={savedPostIds.includes(p.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

