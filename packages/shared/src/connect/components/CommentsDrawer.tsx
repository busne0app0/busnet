import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Trash2 } from 'lucide-react';
import { ConnectPost, ConnectComment } from '../types/connect.types';
import { connectFeedService } from '../services/connectFeedService';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface CommentsDrawerProps {
  post: ConnectPost | null;
  onClose: () => void;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  post,
  onClose,
  onAddComment,
  onDeleteComment,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<ConnectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }
    const unsub = connectFeedService.subscribeToComments(post.id, (data) => {
      setComments(data);
    });
    return () => unsub();
  }, [post]);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Авторизуйтесь для написання коментаря');
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(post.id, newComment.trim());
      setNewComment('');
    } catch (e) {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Видалити цей коментар?')) return;
    try {
      if (onDeleteComment) {
        await onDeleteComment(commentId);
      } else {
        await connectFeedService.deleteComment(commentId);
        toast.success('Коментар видалено');
      }
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося видалити коментар');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0a101d] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1627]">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm text-white">Коментарі ({comments.length})</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Post Snippet */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800/80 text-xs text-slate-300">
          <div className="font-bold text-white mb-1">{post.authorName}</div>
          <p className="line-clamp-2 text-slate-400">{post.content}</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-cyan-500" />
              <p className="text-xs">Коментарів поки немає. Будьте першим!</p>
            </div>
          ) : (
            comments.map((c) => {
              const isMyComment = user?.uid === c.userId;
              const initials = (c.authorName || 'U').charAt(0).toUpperCase();
              const dateStr = new Date(c.createdAt).toLocaleDateString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
              });
              return (
                <div key={c.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 text-xs relative group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-bold text-[10px] text-cyan-300">
                        {initials}
                      </div>
                      <span className="font-bold text-white">{c.authorName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500">{dateStr}</span>
                      {isMyComment && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-0.5 transition-opacity"
                          title="Видалити мій коментар"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed pl-8">{c.content}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-[#0e1627] flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Напишіть коментар..." : "Авторизуйтесь для відповіді..."}
            disabled={!isAuthenticated || isSubmitting}
            className="flex-1 bg-[#0b1220] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-40"
            title="Надіслати"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
