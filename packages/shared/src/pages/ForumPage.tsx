import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  ShieldCheck,
  Zap,
  Bell,
  Search,
  Plus,
  Heart,
  Share2,
  ArrowLeft,
  Trash2,
  X,
  Send,
  User
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useForumStore } from '../store/useForumStore';
import { forumService } from '../services/forumService';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { supabase } from '../supabase/config';
import { ForumPost, ForumComment } from '../busnet/types';

const CATEGORIES = [
  { id: 'all', name: 'Всі теми', icon: Users },
  { id: 'news', name: 'Новини', icon: ShieldCheck },
  { id: 'tips', name: 'Поради', icon: Zap },
  { id: 'questions', name: 'Питання', icon: Search }
];

export default function ForumPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { posts, borderStatuses, addPost, likePost, deletePost, addComment, initForum, isLoading } = useForumStore();

  const [activeCategory, setActiveCategory] = useState('all');
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topAuthors, setTopAuthors] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    const unsubscribe = initForum();
    return () => unsubscribe();
  }, [initForum]);

  useEffect(() => {
    if (!activePostId) {
      setComments([]);
      return;
    }

    const unsubscribe = forumService.subscribeToComments(activePostId, (data) => {
      setComments(data);
    });

    return () => unsubscribe();
  }, [activePostId]);

  useEffect(() => {
    const fetchTopAuthors = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('loyaltyPoints', { ascending: false })
          .limit(3);

        if (error) throw error;
        setTopAuthors(data || []);
      } catch (e) {
        console.warn('Could not fetch top authors', e);
      }
    };

    fetchTopAuthors();
  }, []);

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      navigate(`/auth?from=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!postContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const categoryName = CATEGORIES.find(c => c.id === activeCategory)?.name || 'Загальне';
      await addPost(postContent, categoryName);
      setPostContent('');
      toast.success('Пост опубліковано!');
    } catch (e: any) {
      toast.error(e.message || 'Не вдалося створити пост');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toast.error('Потрібна авторизація');
      return;
    }
    if (!commentText.trim() || sendingComment || !activePostId) return;

    setSendingComment(true);
    try {
      await addComment(activePostId, commentText);
      setCommentText('');
      setActivePostId(activePostId);
    } catch (e: any) {
      toast.error('Помилка коментаря: ' + e.message);
    } finally {
      setSendingComment(false);
    }
  };

  const handleShare = async (post: ForumPost) => {
    try {
      const shareUrl = `${window.location.origin}/forum?post=${post.id}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Busnet Forum',
          text: post.content.substring(0, 50) + '...',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Посилання скопійовано', { icon: '🔗' });
      }
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Видалити цей пост?')) return;
    await deletePost(postId);
    toast.success('Пост видалено');
    setActiveDropdown(null);
  };

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === CATEGORIES.find(c => c.id === activeCategory)?.name);

  return (
    <div className="min-h-screen bg-[#06090f] text-[#f0f4ff] font-sans selection:bg-blue-500/30">
      {/* Header styled in authentic Busnet OS style */}
      <header className="sticky top-0 z-50 h-[70px] bg-[#06090f]/90 backdrop-blur-xl border-b border-blue-500/20 px-4 sm:px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-xl bg-white/5 hover:bg-[#00d4ff]/10 text-slate-300 hover:text-[#00d4ff] border border-white/10 hover:border-[#00d4ff]/40 transition-all"
            title="Назад"
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Authentic Logo */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
            <img 
              src="/icon.png" 
              alt="BUSNET UA" 
              className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-lg drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]" 
            />
            <span className="text-lg md:text-xl font-bold tracking-[0.14em] uppercase">
              <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">BUSNET</span>
              <span className="ml-1.5 text-[#00d4ff] drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]">FORUM</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => toast('Сповіщення активні', { icon: '🔔' })}
            className="p-2.5 rounded-full text-[#8b9dc3] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 border border-transparent hover:border-[#00d4ff]/20 transition-all"
          >
            <Bell size={18} />
          </button>

          {/* Authentic Login / Profile button in brand cyan style */}
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : `/auth?from=${encodeURIComponent(window.location.pathname)}`)}
            className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#00d4ff]/50 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 hover:border-[#00d4ff] text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(0,212,255,0.25)] hover:shadow-[0_0_22px_rgba(0,212,255,0.5)] transition-all backdrop-blur-sm"
          >
            <User className="w-4 h-4 text-[#00d4ff]" />
            {user ? (user.firstName || user.email?.split('@')[0].toUpperCase()) : 'УВІЙТИ'}
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_320px] min-h-[calc(100vh-70px)]">
        <aside className="hidden md:block p-6 border-r border-blue-500/10">
          <div className="text-[11px] font-black text-[#00d4ff] uppercase tracking-[0.2em] mb-6">Категорії</div>
          <nav className="space-y-2.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-sm font-bold border ${
                    isActive
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff] shadow-[0_0_18px_rgba(0,212,255,0.3)]'
                      : 'border-white/5 text-[#8b9dc3] hover:bg-white/5 hover:border-[#00d4ff]/30 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#00d4ff]' : ''} />
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* New post input with bright glowing primary button */}
            <div className="bg-[#0d121d] rounded-3xl p-5 border border-blue-500/20 shadow-2xl flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0072ff] flex items-center justify-center text-sm font-black text-black shadow-[0_0_12px_rgba(0,212,255,0.5)]">
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <input
                type="text"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePost()}
                placeholder={`Написати у "${CATEGORIES.find(c => c.id === activeCategory)?.name || 'Всі теми'}"...`}
                className="flex-1 bg-transparent border-none text-[15px] outline-none placeholder:text-[#506690] text-white"
              />
              <button
                onClick={handleCreatePost}
                disabled={isSubmitting || !postContent.trim()}
                className="bg-[#00c8ff] hover:bg-[#38d9ff] text-black text-xs font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.5)] hover:shadow-[0_0_28px_rgba(0,200,255,0.8)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
              >
                {isSubmitting ? '...' : 'Надіслати'}
              </button>
            </div>

            {/* Border statuses */}
            <AnimatePresence>
              {borderStatuses.length > 0 && activeCategory === 'news' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {borderStatuses.map(status => (
                    <div key={status.id} className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-[#3b9eff] uppercase tracking-wider mb-1">{status.name}</div>
                      <div className="text-xl font-bold">{status.waitTime}</div>
                      <div className={`text-[10px] font-bold mt-1 ${
                        status.trend === 'faster' ? 'text-green-400' :
                        status.trend === 'slower' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {status.trend === 'faster' ? '↓ Швидше' : status.trend === 'slower' ? '↑ Повільніше' : '→ Стабільно'}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts feed */}
            {isLoading ? (
              <div className="py-20 text-center text-[#506690] animate-pulse font-bold">Завантаження...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 text-center text-[#506690] font-bold italic">Ще немає постів у цій категорії</div>
            ) : filteredPosts.map(post => {
              const isOwner = user?.uid === post.authorId;
              const hasLiked = user?.uid && post.likedBy?.includes(user.uid);
              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0d121d] rounded-3xl p-6 border border-blue-500/10 hover:border-[#00d4ff]/40 transition-all shadow-lg"
                >
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 flex items-center justify-center text-xs font-black uppercase">
                        {post.authorInitials || post.authorName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-[15px] flex items-center gap-1.5">
                          {post.authorName}
                          {post.verified && <ShieldCheck size={14} className="text-[#00d4ff]" />}
                        </div>
                        <div className="text-[12px] text-[#8b9dc3]">
                          {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: uk })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleShare(post)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white">
                        <Share2 size={16} />
                      </button>
                      {isOwner && (
                        <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 text-sm leading-relaxed text-[#e2e8f0] whitespace-pre-wrap">{post.content}</div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b9dc3]">
                    <button
                      onClick={() => likePost(post.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <Heart size={14} className={hasLiked ? 'text-red-400 fill-red-400' : ''} />
                      {post.likes || 0}
                    </button>
                    <button
                      onClick={() => setActivePostId(post.id)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all hover:text-[#00d4ff]"
                    >
                      <MessageSquare size={14} /> {post.commentsCount || 0}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </main>

        {/* Right sidebar — top authors */}
        <aside className="hidden lg:block p-6 border-l border-blue-500/10 space-y-6">
          <div className="bg-[#0d121d] rounded-3xl p-5 border border-blue-500/15">
            <h2 className="text-xs font-black uppercase text-[#00d4ff] tracking-widest mb-4">Топ авторів</h2>
            <div className="space-y-3">
              {topAuthors.map(author => (
                <div key={author.uid || author.id} className="rounded-2xl p-3 bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="font-bold text-sm text-white">{author.firstName || author.email}</div>
                  <div className="text-[11px] font-black text-[#00d4ff] bg-[#00d4ff]/10 px-2.5 py-1 rounded-full border border-[#00d4ff]/30">
                    {author.loyaltyPoints || 0} балів
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Comments modal */}
      <AnimatePresence>
        {activePostId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-3xl bg-[#09101c] rounded-3xl p-6 border border-blue-500/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-black text-white">Коментарі</div>
                <button onClick={() => setActivePostId(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-[#8b9dc3] text-sm">Немає коментарів</div>
                ) : comments.map(comment => (
                  <div key={comment.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] flex items-center justify-center text-xs font-black uppercase">
                        {comment.authorInitials || comment.authorName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{comment.authorName}</div>
                        <div className="text-[11px] text-[#8b9dc3]">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: uk })}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-[#e2e8f0] whitespace-pre-wrap">{comment.content}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Написати коментар..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm placeholder:text-[#506690] text-white outline-none focus:border-[#00d4ff]/50"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || sendingComment}
                  className="bg-[#00c8ff] hover:bg-[#38d9ff] text-black font-black rounded-2xl px-5 py-3 shadow-[0_0_15px_rgba(0,200,255,0.4)] disabled:opacity-40"
                >
                  {sendingComment ? '...' : <Send size={16} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
