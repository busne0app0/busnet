import React, { useState } from 'react';
import { Search, MapPin, Users, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { ConnectPost } from '../../types/connect.types';
import { PostCard } from '../PostCard';

interface DiscoverViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  posts,
  savedPostIds,
  onLike,
  onToggleSave,
  onOpenComments,
  onNavigateToBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const popularRoutes = [
    { from: 'Київ', to: 'Рим', count: '14 публікацій' },
    { from: 'Львів', to: 'Мілан', count: '28 публікацій' },
    { from: 'Київ', to: 'Варшава', count: '35 публікацій' },
    { from: 'Івано-Франківськ', to: 'Болонья', count: '11 публікацій' },
  ];

  const filtered = searchTerm.trim()
    ? posts.filter(p => 
        p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.routeFrom && p.routeFrom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.routeTo && p.routeTo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : posts.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c1628] to-[#070e1c] border border-cyan-500/20 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Відкрийте нових людей та напрямки</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Знаходьте пасажирів, які їдуть вашим рейсом, корисні поради для перебування за кордоном та досвід інших.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введіть місто (Рим, Варшава), ім'я або тему..."
            className="w-full bg-[#070d18] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Popular Route Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center mr-1">
            <TrendingUp className="w-3 h-3 text-cyan-400 mr-1" /> Популярні напрямки:
          </span>
          {popularRoutes.map((r, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(r.to)}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors"
            >
              {r.from} → {r.to}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          {searchTerm ? `Результати за запитом "${searchTerm}" (${filtered.length})` : 'Рекомендовані публікації'}
        </h3>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
            Нічого не знайдено за вашим запитом. Спробуйте іншу назву міста або ключове слово.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(p => (
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

