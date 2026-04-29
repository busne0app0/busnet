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
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForumStore } from '../store/useForumStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { supabase } from '../supabase/config';
import { ForumPost, ForumComment } from '../busnet/types';

const CATEGORIES = [
  { id: 'all', name: '??? ????', icon: Users },
  { id: 'news', name: '??????', icon: ShieldCheck },
  { id: 'tips', name: '??????', icon: Zap },
  { id: 'questions', name: '???????', icon: Search }
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

    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('forum_comments')
          .select('*')
          .eq('postId', activePostId)
          .order('createdAt', { ascending: false });

        if (error) throw error;
        setComments(data || []);
      } catch (e) {
        console.error('Error fetching comments:', e);
      }
    };

    fetchComments();
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
      const categoryName = CATEGORIES.find(c => c.id === activeCategory)?.name || '????????';
      await addPost(postContent, categoryName);
      setPostContent('');
      toast.success('???? ????????????!');
    } catch (e: any) {
      toast.error(e.message || '?? ??????? ???????? ????');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toast.error('???????? ???????????');
      return;
    }
    if (!commentText.trim() || sendingComment || !activePostId) return;

    setSendingComment(true);
    try {
      await addComment(activePostId, commentText);
      setCommentText('');
      setActivePostId(activePostId); // trigger refresh if needed
    } catch (e: any) {
      toast.error('??????? ??????????: ' + e.message);
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
        toast.success('????????? ???????????', { icon: '??' });
      }
    } catch (e) {
      console.log('Share failed', e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('???????? ?? ???????????')) return;
    await deletePost(postId);
    toast.success('?????????? ????????');
    setActiveDropdown(null);
  };

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === CATEGORIES.find(c => c.id === activeCategory)?.name);

  return (
    <div className="min-h-screen bg-[#06090f] text-[#f0f4ff] font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 h-[70px] bg-[#06090f]/80 backdrop-blur-xl border-b border-blue-500/10 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tight uppercase">BUSNET FORUM</span>
            <span className="text-sm text-[#8b9dc3]">??????????? ??????? ?? ????????</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => toast('????? ????? ?????????', { icon: '??' })} className="p-2 rounded-full text-[#8b9dc3] hover:text-[#3b9eff]">
            <Bell size={20} />
          </button>
          <button onClick={() => navigate(isAuthenticated ? '/dashboard' : `/auth?from=${encodeURIComponent(window.location.pathname)}`)} className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10">
            {user ? user.email?.split('@')[0].toUpperCase() : '??? ???????'}
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_320px] min-h-[calc(100vh-70px)]">
        <aside className="hidden md:block p-6 border-r border-blue-500/10">
          <div className="text-[11px] font-bold text-[#8b9dc3] uppercase tracking-[0.2em] mb-6">???????</div>
          <nav className="space-y-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${activeCategory === cat.id ? 'bg-blue-500/10 text-[#3b9eff]' : 'text-[#8b9dc3] hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={18} />
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#0d121d] rounded-3xl p-5 border border-blue-500/10 shadow-2xl flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#3b9eff] to-[#00d4ff] flex items-center justify-center text-sm font-bold">
                {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <input
                type="text"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePost()}
                placeholder={`???????? ? "${CATEGORIES.find(c => c.id === activeCategory)?.name || '??? ????'}"...`}
                className="flex-1 bg-transparent border-none text-[15px] outline-none placeholder:text-[#506690]"
              />
              <button onClick={handleCreatePost} disabled={isSubmitting || !postContent.trim()} className="bg-gradient-to-r from-[#3b9eff] to-[#00d4ff] text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                {isSubmitting ? '...' : '????????'}
              </button>
            </div>

            <AnimatePresence>
              {borderStatuses.length > 0 && activeCategory === 'news' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {borderStatuses.map(status => (
                    <div key={status.id} className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-[#3b9eff] uppercase tracking-wider mb-1">{status.name}</div>
                      <div className="text-xl font-bold">{status.waitTime}</div>
                      <div className={`text-[10px] font-bold mt-1 ${status.trend === 'faster' ? 'text-green-400' : status.trend === 'slower' ? 'text-red-400' : 'text-blue-400'}`}>
                        {status.trend === 'faster' ? '? ??????' : status.trend === 'slower' ? '? ????????' : '? ?????????'}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="py-20 text-center text-[#506690] animate-pulse font-bold">????????????...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 text-center text-[#506690] font-bold italic">?? ????? ?????? ? ??? ?????????</div>
            ) : filteredPosts.map(post => {
              const isOwner = user?.uid === post.authorId;
              const hasLiked = user?.uid && post.likedBy?.includes(user.uid);
              return (
                <motion.article key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d121d] rounded-3xl p-6 border border-blue-500/10 hover:border-blue-500/40 transition-all">
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#3b9eff] flex items-center justify-center text-xs font-bold uppercase">
                        {post.authorInitials || post.authorName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-[15px] flex items-center gap-1.5">
                          {post.authorName}
                          {post.verified && <ShieldCheck size={14} className="text-[#3b9eff]" />}
                        </div>
                        <div className="text-[12px] text-[#8b9dc3]">{formatDistanceToNow(post.createdAt, { addSuffix: true, locale: uk })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleShare(post)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
                        <Share2 size={16} />
                      </button>
                      {isOwner && (
                        <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-4 text-sm leading-relaxed text-[#e2e8f0] whitespace-pre-wrap">{post.content}</div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b9dc3]">
                    <button onClick={() => likePost(post.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10">
                      <Heart size={14} className={hasLiked ? 'text-red-400' : ''} />
                      {post.likes || 0}
                    </button>
                    <button onClick={() => setActivePostId(post.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10">
                      <MessageSquare size={14} /> {post.commentsCount || 0}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </main>

        <aside className="hidden lg:block p-6 border-l border-blue-500/10 space-y-6">
          <div className="bg-[#0d121d] rounded-3xl p-4 border border-blue-500/10">
            <h2 className="text-sm font-bold uppercase text-[#8b9dc3] mb-4">??? ??????</h2>
            <div className="space-y-3">
              {topAuthors.map(author => (
                <div key={author.id} className="rounded-2xl p-3 bg-white/5">
                  <div className="font-bold text-sm">{author.firstName || author.email}</div>
                  <div className="text-[11px] text-[#8b9dc3]">{author.loyaltyPoints || 0} ?????</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {activePostId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-3xl bg-[#09101c] rounded-3xl p-6 border border-blue-500/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">?????????</div>
                <button onClick={() => setActivePostId(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><X size={18} /></button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <div className="text-[#8b9dc3]">????? ??????????</div>
                ) : comments.map(comment => (
                  <div key={comment.id} className="bg-white/5 rounded-3xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold uppercase">{comment.authorInitials || comment.authorName?.[0] || 'U'}</div>
                      <div>
                        <div className="font-bold text-sm">{comment.authorName}</div>
                        <div className="text-[11px] text-[#8b9dc3]">{formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: uk })}</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#e2e8f0] whitespace-pre-wrap">{comment.content}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="???????? ????????..." className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-sm placeholder:text-[#506690] outline-none" />
                <button onClick={handleSendComment} disabled={!commentText.trim() || sendingComment} className="bg-gradient-to-r from-[#3b9eff] to-[#00d4ff] text-white rounded-2xl px-5 py-3 disabled:opacity-50">{sendingComment ? '...' : '??????????'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
