import React, { useState } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  MoreHorizontal, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Package, 
  Users, 
  Trash2, 
  Flag,
  ArrowRight
} from 'lucide-react';
import { ConnectPost, ConnectPostType } from '../types/connect.types';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: ConnectPost;
  isSaved?: boolean;
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDelete?: (postId: string) => void;
  onReport?: (post: ConnectPost) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isSaved,
  onLike,
  onToggleSave,
  onOpenComments,
  onDelete,
  onReport,
  onNavigateToBooking,
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const isAuthor = user?.uid === post.userId;
  const hasLiked = user ? post.likedBy.includes(user.uid) : false;

  const handleShare = () => {
    const postSlugOrId = post.slug || post.id;
    const postUrl = `${window.location.origin}/connect/post/${postSlugOrId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      toast.success('Посилання на публікацію скопійовано');
    }
  };

  const getTypeBadge = (type: ConnectPostType) => {
    switch (type) {
      case 'buddy':
        return { label: 'Попутники', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Users };
      case 'parcel':
        return { label: 'Посилка', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Package };
      case 'border':
        return { label: 'Кордон Live', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: AlertTriangle };
      case 'review':
        return { label: 'Відгук', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30', icon: CheckCircle2 };
      case 'tips':
        return { label: 'Порада', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: CheckCircle2 };
      case 'news':
        return { label: 'Новина', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: CheckCircle2 };
      default:
        return { label: 'Історія', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: CheckCircle2 };
    }
  };

  const typeConfig = getTypeBadge(post.postType);
  const TypeIcon = typeConfig.icon;

  const initials = (post.authorName || 'U')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(post.createdAt).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="bg-[#0c1424]/90 backdrop-blur-md border border-slate-800/80 hover:border-cyan-500/25 rounded-2xl p-4 sm:p-5 transition-all duration-200 relative group shadow-lg">
      {/* Header: Author + Meta */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center space-x-3">
          {post.authorAvatar ? (
            <img 
              src={post.authorAvatar} 
              alt={post.authorName} 
              className="w-10 h-10 rounded-full object-cover border border-cyan-500/30" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300">
              {initials}
            </div>
          )}

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm sm:text-base text-slate-100">{post.authorName}</span>
              {post.authorVerified && (
                <CheckCircle2 className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${typeConfig.color}`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Options */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Опції"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-[#0d1627] border border-slate-700/80 rounded-xl shadow-2xl py-1 z-30 text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleShare();
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-slate-800/80 flex items-center space-x-2"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Поділитися</span>
              </button>

              {user && onReport && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReport(post);
                  }}
                  className="w-full px-3 py-2 text-left text-amber-300 hover:bg-slate-800/80 flex items-center space-x-2"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Поскаржитися</span>
                </button>
              )}

              {isAuthor && onDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm('Видалити цю публікацію?')) {
                      onDelete(post.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Видалити</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transit Route Pill (if specified) */}
      {(post.routeFrom || post.routeTo) && (
        <div className="mb-3 flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-white">{post.routeFrom || '—'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-white">{post.routeTo || '—'}</span>
          </div>
          {onNavigateToBooking && post.routeFrom && post.routeTo && (
            <button
              onClick={() => onNavigateToBooking(post.routeFrom!, post.routeTo!)}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1"
            >
              <span>Знайти квиток</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Border Radar Disclaimer */}
      {post.postType === 'border' && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[11px] flex items-start space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Повідомлення мандрівника.</strong> Інформація базується на особистому досвіді користувача та не є офіційними даними прикордонних служб.
          </span>
        </div>
      )}

      {/* Title */}
      {post.title && (
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
          {post.title}
        </h3>
      )}

      {/* Content text */}
      <p className="text-slate-200 text-sm leading-relaxed mb-3.5 whitespace-pre-line">
        {post.content}
      </p>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="mb-3.5 rounded-xl overflow-hidden border border-slate-800 max-h-96 bg-slate-950 flex items-center justify-center">
          <img 
            src={post.imageUrl} 
            alt={post.title || 'Зображення публікації'} 
            className="w-full h-auto object-cover max-h-96 hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      {/* Action Bar (Likes, Comments, Bookmark, Share) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-slate-400 text-xs">
        <div className="flex items-center space-x-4">
          {/* Like */}
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center space-x-1.5 transition-colors ${
              hasLiked ? 'text-rose-400 font-bold' : 'hover:text-rose-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => onOpenComments(post)}
            className="flex items-center space-x-1.5 hover:text-cyan-400 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentsCount}</span>
          </button>

          {/* Views */}
          {post.viewsCount > 0 && (
            <span className="hidden sm:inline-flex items-center text-slate-500">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {post.viewsCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Bookmark */}
          <button
            onClick={() => onToggleSave(post.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved ? 'text-cyan-400 bg-cyan-500/10' : 'hover:text-white hover:bg-slate-800/60'
            }`}
            title="Зберегти"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-cyan-400' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Поділитися посиланням"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

