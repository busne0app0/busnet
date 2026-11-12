import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { connectFeedService } from '../connect/services/connectFeedService';
import { ConnectPost, ConnectComment } from '../connect/types/connect.types';
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export default function ConnectPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost] = useState<ConnectPost | null>(null);
  const [comments, setComments] = useState<ConnectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);

    // S2 & S3: Resolve by slug or ID
    connectFeedService.resolvePost(id).then((data) => {
      if (!isMounted) return;
      
      if (data) {
        // S2: If URL has ID but post has a slug, redirect to canonical slug URL
        if (data.slug && id !== data.slug && (id.startsWith('BC-') || id.startsWith('FP-') || id === data.id)) {
          navigate(`/connect/post/${data.slug}`, { replace: true });
        }

        setPost(data);
        setIsLoading(false);

        // B3: Increment view count deduplicated via sessionStorage & bot filtered
        connectFeedService.incrementViews(data.id);

        // Dynamic Document Meta
        const pageTitle = `${data.title || data.content.slice(0, 60)} | BUSNET CONNECT`;
        document.title = pageTitle;

        // Meta Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', data.content.slice(0, 160));

        // C2 & S4: Robots Meta Tag - strictly "index, follow" if isIndexable, else "noindex, follow"
        let metaRobots = document.querySelector('meta[name="robots"]');
        if (!metaRobots) {
          metaRobots = document.createElement('meta');
          metaRobots.setAttribute('name', 'robots');
          document.head.appendChild(metaRobots);
        }
        metaRobots.setAttribute('content', data.isIndexable ? 'index, follow' : 'noindex, follow');

        // S4: Canonical URL strictly by slug (fallback to id if no slug)
        const canonicalSlug = data.slug || data.id;
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.setAttribute('rel', 'canonical');
          document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', `https://busnetua.it/connect/post/${canonicalSlug}`);

        // OpenGraph Tags
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', pageTitle);

        // S4: Schema.org JSON-LD (DiscussionForumPosting) using slug
        let scriptTag = document.getElementById('schema-post-ld') as HTMLScriptElement | null;
        if (!scriptTag) {
          scriptTag = document.createElement('script');
          scriptTag.id = 'schema-post-ld';
          scriptTag.type = 'application/ld+json';
          document.head.appendChild(scriptTag);
        }

        const schemaJson = {
          '@context': 'https://schema.org',
          '@type': 'DiscussionForumPosting',
          'mainEntityOfPage': `https://busnetua.it/connect/post/${canonicalSlug}`,
          'headline': data.title || data.content.slice(0, 80),
          'articleBody': data.content,
          'author': {
            '@type': 'Person',
            'name': data.authorName,
          },
          'datePublished': new Date(data.createdAt).toISOString(),
          'dateModified': new Date(data.updatedAt || data.createdAt).toISOString(),
          'interactionStatistic': [
            {
              '@type': 'InteractionCounter',
              'interactionType': 'https://schema.org/LikeAction',
              'userInteractionCount': data.likesCount,
            },
            {
              '@type': 'InteractionCounter',
              'interactionType': 'https://schema.org/CommentAction',
              'userInteractionCount': data.commentsCount,
            },
          ],
          'publisher': {
            '@type': 'Organization',
            'name': 'BUSNET UA',
            'url': 'https://busnetua.it',
          },
        };
        scriptTag.text = JSON.stringify(schemaJson);

        // Subscribe to comments for this post
        const unsub = connectFeedService.subscribeToComments(data.id, (cList) => {
          if (isMounted) setComments(cList);
        });

        return () => unsub();
      } else {
        setPost(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      const ldTag = document.getElementById('schema-post-ld');
      if (ldTag) ldTag.remove();
    };
  }, [id, navigate]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Посилання на публікацію скопійовано');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Будь ласка, увійдіть у кабінет, щоб ставити вподобайки');
      return;
    }
    if (!post) return;

    try {
      const res = await connectFeedService.likePost(post.id);
      setPost(prev => prev ? { ...prev, likesCount: res.likesCount, likedBy: res.likedBy } : null);
    } catch {
      toast.error('Не вдалося оновити вподобайку');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Авторизуйтесь, щоб додати коментар');
      return;
    }
    if (!newComment.trim() || !post || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await connectFeedService.addComment(post.id, newComment.trim());
      setNewComment('');
      toast.success('Коментар додано');
      // Comments list updates via realtime subscription; also update post counter
      const updated = await connectFeedService.getPostById(post.id);
      if (updated) setPost(updated);
    } catch (err: any) {
      toast.error(err.message || 'Помилка надсилання коментаря');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Видалити цей коментар?')) return;
    try {
      await connectFeedService.deleteComment(commentId);
      toast.success('Коментар видалено');
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (post) {
        const updated = await connectFeedService.getPostById(post.id);
        if (updated) setPost(updated);
      }
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося видалити коментар');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="pt-24 min-h-screen bg-[#070b14] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="pt-24 min-h-screen bg-[#070b14] flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-xl font-bold text-white mb-2">Публікацію не знайдено</h2>
          <p className="text-sm text-slate-400 mb-6">Можливо, автор видалив цей допис або посилання застаріло.</p>
          <Link
            to="/connect"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            Перейти до BUSNET CONNECT
          </Link>
        </div>
      </MainLayout>
    );
  }

  const hasLiked = user ? post.likedBy.includes(user.uid) : false;
  const formattedDate = new Date(post.createdAt).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <MainLayout>
      <div className="pt-24 pb-16 min-h-screen bg-[#070b14] text-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Back Navigation */}
          <Link
            to="/connect"
            className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад до стрічки CONNECT</span>
          </Link>

          {/* Main Article Card */}
          <article className="bg-[#0c1424] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header: Author & Date */}
            <header className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-950 to-slate-800 border border-cyan-500/30 flex items-center justify-center font-bold text-sm text-cyan-300">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-base text-white">{post.authorName}</span>
                    {post.authorVerified && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <time dateTime={new Date(post.createdAt).toISOString()} className="text-xs text-slate-400">
                    {formattedDate}
                  </time>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors"
                title="Поділитися"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </header>

            {/* Route pill if set */}
            {(post.routeFrom || post.routeTo) && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-2 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{post.routeFrom || '—'}</span>
                <span>→</span>
                <span className="font-bold text-white">{post.routeTo || '—'}</span>
              </div>
            )}

            {/* Border disclaimer */}
            {post.postType === 'border' && (
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Повідомлення мандрівника.</strong> Дані черги є особистим досвідом автора на момент публікації і не є офіційними даними ДПСУ.
                </span>
              </div>
            )}

            {/* Post Title */}
            {post.title && (
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {post.title}
              </h1>
            )}

            {/* Post Content */}
            <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {post.content}
            </div>

            {/* Post Image */}
            {post.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[500px] flex items-center justify-center bg-black">
                <img 
                  src={post.imageUrl} 
                  alt={post.title || 'Зображення публікації'} 
                  className="w-full h-auto object-cover" 
                />
              </div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center space-x-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1.5 transition-colors ${
                  hasLiked ? 'text-rose-400 font-bold' : 'hover:text-rose-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span>{post.likesCount} вподобань</span>
              </button>
              <span className="flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>{post.commentsCount} коментарів</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{post.viewsCount} переглядів</span>
              </span>
            </div>
          </article>

          {/* Comments Section */}
          <section className="mt-8 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Коментарі та обговорення ({comments.length})</span>
            </h2>

            {/* Add Comment Box */}
            <form onSubmit={handleAddComment} className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? "Напишіть відповідь або пораду..." : "Авторизуйтесь, щоб долучитися до обговорення..."}
                disabled={!isAuthenticated || isSubmitting}
                className="flex-1 bg-[#070b14] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((c) => {
                const isMyComment = user?.uid === c.userId;
                return (
                  <div key={c.id} className="p-4 rounded-2xl bg-[#0c1424] border border-slate-800 text-xs relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{c.authorName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMyComment && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-opacity p-0.5"
                            title="Видалити мій коментар"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
