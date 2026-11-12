import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Globe, 
  Sparkles, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  X
} from 'lucide-react';
import { ConnectPost, ConnectPostType } from '../../types/connect.types';
import { StoriesBar } from '../StoriesBar';
import { PostCard } from '../PostCard';

interface CommunityViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  categoryFilter: ConnectPostType | 'all';
  searchQuery: string;
  isLoading: boolean;
  onSetCategoryFilter: (category: ConnectPostType | 'all') => void;
  onSetSearchQuery: (query: string) => void;
  onOpenCreateModal: () => void;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDeletePost: (postId: string) => void;
  onReportPost: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  savedPostIds,
  categoryFilter,
  searchQuery,
  isLoading,
  onSetCategoryFilter,
  onSetSearchQuery,
  onOpenCreateModal,
  onLike,
  onToggleSave,
  onOpenComments,
  onDeletePost,
  onReportPost,
  onNavigateToBooking,
}) => {
  const categories: { id: ConnectPostType | 'all'; label: string; icon: any }[] = [
    { id: 'all', label: 'Всі публікації', icon: Globe },
    { id: 'buddy', label: 'Попутники', icon: Users },
    { id: 'parcel', label: 'Посилки', icon: Package },
    { id: 'border', label: 'Кордони Live', icon: AlertTriangle },
    { id: 'blog', label: 'Історії', icon: Sparkles },
    { id: 'review', label: 'Відгуки', icon: CheckCircle2 },
    { id: 'tips', label: 'Поради', icon: CheckCircle2 },
    { id: 'questions', label: 'Запитання', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Stories Carousel */}
      <StoriesBar />

      {/* Control Bar: Search + Category Pills + Create Button */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              placeholder="Пошук за маршрутом, містом, автором..."
              className="w-full bg-[#0c1424] border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSetSearchQuery('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* New Post Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(0,212,255,0.25)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Написати допис</span>
          </button>
        </div>

        {/* Categories Horizontal Scrolling */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = categoryFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSetCategoryFilter(c.id)}
                className={`
                  flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all
                  ${isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.15)]'
                    : 'bg-[#0d1627] text-slate-400 border border-slate-800/80 hover:text-white hover:bg-slate-800/50'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Posts */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs">Завантаження публікацій...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-[#0c1424] rounded-2xl border border-slate-800 p-8 space-y-3">
          <Globe className="w-10 h-10 text-cyan-500/40 mx-auto" />
          <h3 className="text-base font-bold text-white">У цій категорії поки немає публікацій</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Будьте першим, хто розмістить оголошення або поділиться важливою інформацією з мандрівниками.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Створити першу публікацію</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isSaved={savedPostIds.includes(post.id)}
              onLike={onLike}
              onToggleSave={onToggleSave}
              onOpenComments={onOpenComments}
              onDelete={onDeletePost}
              onReport={onReportPost}
              onNavigateToBooking={onNavigateToBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

