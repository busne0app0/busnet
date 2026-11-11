import React, { useState, useMemo, useRef } from 'react';
import {
  Search, Plus, Heart, MessageSquare, Bookmark, Share2,
  X, Camera, MapPin, Send, Sparkles, Package, Users, Compass,
  HelpCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export interface ForumPost {
  id: string;
  author: string;
  authorAvatar?: string;
  text?: string;
  content?: string;
  imageUrl?: string;
  routeTag?: string;
  type?: 'blog' | 'parcel' | 'buddy' | 'review' | 'question';
  likes: number;
  comments: number;
  tag: string;
  time?: string;
  commentsList?: Array<{ id: string; author: string; text: string; time: string }>;
}

interface ForumTabProps {
  forumPosts: ForumPost[];
  handleLike: (id: string) => void;
  onCreatePost?: (content: string, tag?: string) => Promise<void>;
}

export const ForumTab: React.FC<ForumTabProps> = ({ forumPosts, handleLike, onCreatePost }) => {
  const { user } = useAuthStore();
  const { language } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Стан створення публікації
  const [postType, setPostType] = useState<'blog' | 'parcel' | 'buddy' | 'question'>('blog');
  const [newPostText, setNewPostText] = useState('');
  const [newPostRoute, setNewPostRoute] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Словник перекладів
  const l = {
    title: 'BUSNET COMMUNITY',
    subtitle: currentLang === 'EN'
      ? 'Social hub of international travelers, parcels, and route blogs'
      : currentLang === 'IT'
        ? 'Il social network dei viaggiatori: tratte, pacchi e consigli'
        : 'Міжнародна спільнота мандрівників: блоги, посилки та попутники',
    searchPlaceholder: currentLang === 'EN' ? 'Search stories, routes, parcels...' : currentLang === 'IT' ? 'Cerca storie, tratte, pacchi...' : 'Пошук розповідей, рейсів, посилок...',
    createPostBtn: currentLang === 'EN' ? 'New Post' : currentLang === 'IT' ? 'Nuovo Post' : 'Створити допис',
    allCat: currentLang === 'EN' ? 'All' : currentLang === 'IT' ? 'Tutti' : 'Всі',
    blogCat: currentLang === 'EN' ? 'Travel Blogs' : currentLang === 'IT' ? 'Blog di Viaggio' : 'Блоги',
    parcelCat: currentLang === 'EN' ? 'Parcels' : currentLang === 'IT' ? 'Pacchi' : 'Посилки',
    buddyCat: currentLang === 'EN' ? 'Travel Buddies' : currentLang === 'IT' ? 'Compagni di Viaggio' : 'Попутники',
    reviewCat: currentLang === 'EN' ? 'Carrier Reviews' : currentLang === 'IT' ? 'Recensioni Vettori' : 'Перевізники',
    questionCat: currentLang === 'EN' ? 'Questions & Borders' : currentLang === 'IT' ? 'Domande e Frontiere' : 'Питання та Кордони',
    noPostsFound: currentLang === 'EN' ? 'No posts found in this category' : currentLang === 'IT' ? 'Nessun post trovato in questa categoria' : 'У цій категорії поки немає публікацій',
    beFirst: currentLang === 'EN' ? 'Be the first to share your story or parcel request!' : currentLang === 'IT' ? 'Sii il primo a condividere un post o richiesta pacco!' : 'Будьте першим, хто поділиться історією або запитом на посилку!',
    replyCount: currentLang === 'EN' ? 'replies' : currentLang === 'IT' ? 'risposte' : 'відповідей',
    writeComment: currentLang === 'EN' ? 'Write a friendly comment...' : currentLang === 'IT' ? 'Scrivi un commento gentile...' : 'Напишіть коментар...',
    shareSuccess: currentLang === 'EN' ? 'Link copied to clipboard!' : currentLang === 'IT' ? 'Link copiato negli appunti!' : 'Посилання скопійовано в буфер обміну!',
    savedSuccess: currentLang === 'EN' ? 'Post saved to bookmarks' : currentLang === 'IT' ? 'Post salvato nei preferiti' : 'Публікацію збережено в закладки',
    unsavedSuccess: currentLang === 'EN' ? 'Removed from bookmarks' : currentLang === 'IT' ? 'Rimosso dai preferiti' : 'Видалено із закладок',
    // Modal
    modalTitle: currentLang === 'EN' ? 'Create Travel Story' : currentLang === 'IT' ? 'Crea Storia di Viaggio' : 'Створити публікацію',
    modalSubtitle: currentLang === 'EN' ? 'Share route tips, parcel delivery or find travel buddies' : currentLang === 'IT' ? 'Condividi consigli, spedisci pacchi o cerca compagni' : 'Діліться враженнями, передавайте посилки або знаходьте попутників',
    typeBlog: currentLang === 'EN' ? 'Travel Blog' : currentLang === 'IT' ? 'Blog' : '📸 Блог',
    typeParcel: currentLang === 'EN' ? 'Send Parcel' : currentLang === 'IT' ? 'Spedisci Pacco' : '📦 Посилка',
    typeBuddy: currentLang === 'EN' ? 'Find Buddy' : currentLang === 'IT' ? 'Cerca Compagno' : '🤝 Попутник',
    typeQuestion: currentLang === 'EN' ? 'Question' : currentLang === 'IT' ? 'Domanda' : '❓ Питання',
    routeLabel: currentLang === 'EN' ? 'Route (e.g. Kyiv → Rome)' : currentLang === 'IT' ? 'Tratta (es. Kiev → Roma)' : 'Маршрут (наприклад, Київ → Рим)',
    textareaPlaceholder: currentLang === 'EN'
      ? 'Tell your story, ask for parcel help, describe luggage or border situation...'
      : currentLang === 'IT'
        ? 'Racconta la tua storia, chiedi aiuto per un pacco o descrivi la dogana...'
        : 'Розкажіть про поїздку, запитайте про передачу посилки або опишіть ситуацію на кордоні...',
    addPhoto: currentLang === 'EN' ? 'Add Photo' : currentLang === 'IT' ? 'Aggiungi Foto' : 'Додати фото',
    publishBtn: currentLang === 'EN' ? 'Publish Story' : currentLang === 'IT' ? 'Pubblica' : 'Опублікувати',
    publishing: currentLang === 'EN' ? 'Publishing...' : currentLang === 'IT' ? 'Pubblicazione...' : 'Публікація...',
    postSuccess: currentLang === 'EN' ? 'Story successfully posted!' : currentLang === 'IT' ? 'Storia pubblicata con successo!' : 'Публікацію додано до спільноти!',
    fillError: currentLang === 'EN' ? 'Please write something before posting' : currentLang === 'IT' ? 'Scrivi un messaggio prima di pubblicare' : 'Будь ласка, напишіть текст публікації',
  };

  // Сторіс / Хайлайтс у стилі Instagram
  const stories = [
    { id: 'borders', title: currentLang === 'EN' ? 'Borders Live' : currentLang === 'IT' ? 'Frontiere Live' : 'Кордони Live', icon: '🚨', active: true },
    { id: 'parcels', title: currentLang === 'EN' ? 'Parcels Hub' : currentLang === 'IT' ? 'Spedizioni' : 'Посилки', icon: '📦', active: false },
    { id: 'rome', title: currentLang === 'EN' ? 'Rome & Milan' : currentLang === 'IT' ? 'Roma & Milano' : 'Рим & Мілан', icon: '🇮🇹', active: false },
    { id: 'buddies', title: currentLang === 'EN' ? 'Travel Buddies' : currentLang === 'IT' ? 'Compagni' : 'Попутники', icon: '👥', active: false },
    { id: 'tips', title: currentLang === 'EN' ? 'Road Hacks' : currentLang === 'IT' ? 'Consigli' : 'Лайфхаки', icon: '💡', active: false },
  ];

  // Збагачуємо або мапимо пости
  const postsList: ForumPost[] = useMemo(() => {
    return (forumPosts || []).map((p, idx) => {
      return {
        ...p,
        authorAvatar: p.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.author || 'User')}`,
        routeTag: p.routeTag || (idx % 2 === 0 ? 'Київ → Рим' : 'Львів → Мілан'),
        type: p.type || (idx % 3 === 0 ? 'parcel' : idx % 2 === 0 ? 'buddy' : 'blog'),
        time: p.time || '15 хв тому',
        // Приклад якісного фото для демонстрації стилю Instagram
        imageUrl: p.imageUrl || (idx === 0
          ? 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop' // Рим
          : idx === 1
            ? 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?q=80&w=800&auto=format&fit=crop' // Автобусна траса в Європі
            : undefined),
        commentsList: p.commentsList || [
          { id: 'c1', author: 'Андрій М.', text: 'Дякую за корисну інформацію про митницю!', time: '10 хв' }
        ]
      };
    });
  }, [forumPosts]);

  // Фільтрація
  const filteredPosts = useMemo(() => {
    return postsList.filter(p => {
      const textContent = p.content || p.text || '';
      const matchSearch =
        textContent.toLowerCase().includes(search.toLowerCase()) ||
        (p.author || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.routeTag || '').toLowerCase().includes(search.toLowerCase());

      const matchCat =
        activeCat === 'all' ||
        (activeCat === 'blog' && p.type === 'blog') ||
        (activeCat === 'parcel' && p.type === 'parcel') ||
        (activeCat === 'buddy' && p.type === 'buddy') ||
        (activeCat === 'question' && p.type === 'question') ||
        (activeCat === 'review' && p.type === 'review');

      return matchSearch && matchCat;
    });
  }, [postsList, search, activeCat]);

  // Завантаження фото для нового посту
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) {
      toast.error(l.fillError);
      return;
    }
    setIsPosting(true);
    try {
      const combinedTag = `${postType.toUpperCase()}${newPostRoute ? ` | ${newPostRoute}` : ''}`;
      if (onCreatePost) {
        await onCreatePost(newPostText, combinedTag);
      }
      toast.success(l.postSuccess);
      setNewPostText('');
      setNewPostRoute('');
      setNewPostImage(null);
      setShowNewPostModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setIsPosting(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setSavedPosts(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast(l.unsavedSuccess, { icon: '🔖' });
        return prev.filter(item => item !== id);
      } else {
        toast.success(l.savedSuccess);
        return [...prev, id];
      }
    });
  };

  const handleShare = (post: ForumPost) => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success(l.shareSuccess);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 min-w-0">

      {/* Прихований інпут для фото */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Головний Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Compass size={18} />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{l.title}</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{l.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewPostModal(true)}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={16} /> {l.createPostBtn}
        </button>
      </div>

      {/* 📸 СТОРІС / ХАЙЛАЙТС (Instagram Style) */}
      <div className="flex gap-4 pb-2 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
        {stories.map(story => (
          <div
            key={story.id}
            onClick={() => {
              if (story.id === 'borders') setActiveCat('question');
              if (story.id === 'parcels') setActiveCat('parcel');
              if (story.id === 'buddies') setActiveCat('buddy');
              if (story.id === 'rome' || story.id === 'tips') setActiveCat('blog');
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 via-amber-400 to-blue-500 group-hover:scale-105 transition-transform">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center text-2xl shadow-inner">
                {story.icon}
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
              {story.title}
            </span>
          </div>
        ))}
      </div>

      {/* Пошук та фільтри-пігулки */}
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={l.searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 focus:border-cyan-400 rounded-2xl text-xs sm:text-sm text-white outline-none transition-all"
          />
        </div>

        {/* Категорії */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: l.allCat, icon: <Sparkles size={13} /> },
            { id: 'blog', label: l.blogCat, icon: <Compass size={13} /> },
            { id: 'parcel', label: l.parcelCat, icon: <Package size={13} /> },
            { id: 'buddy', label: l.buddyCat, icon: <Users size={13} /> },
            { id: 'question', label: l.questionCat, icon: <HelpCircle size={13} /> },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${activeCat === cat.id
                  ? 'bg-cyan-400 text-black font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📱 СОЦІАЛЬНА СТРІЧКА (FEED) */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 space-y-2">
            <p className="text-base font-bold text-white">{l.noPostsFound}</p>
            <p className="text-xs text-slate-400">{l.beFirst}</p>
          </div>
        ) : (
          filteredPosts.map((post, i) => {
            const isSaved = savedPosts.includes(post.id);
            const isCommentsOpen = activeCommentPostId === post.id;

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md"
              >
                {/* Шапка посту */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500 shrink-0">
                      <img
                        src={post.authorAvatar}
                        alt={post.author}
                        className="w-full h-full rounded-full object-cover bg-slate-950"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white truncate">{post.author}</h4>
                        <CheckCircle2 size={13} className="text-cyan-400 shrink-0" />
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-cyan-400" />
                        <span className="font-semibold text-slate-300">{post.routeTag}</span>
                        <span>•</span>
                        <span>{post.time}</span>
                      </p>
                    </div>
                  </div>

                  {/* Бейдж типу посту */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${post.type === 'parcel'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : post.type === 'buddy'
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                    {post.type === 'parcel' ? '📦 Посилка' : post.type === 'buddy' ? '🤝 Попутник' : '📸 Блог'}
                  </span>
                </div>

                {/* Фотографія посту (Instagram Style) */}
                {post.imageUrl && (
                  <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt="Post visual"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}

                {/* Текст посту */}
                <div className="p-4 sm:p-5 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {post.content || post.text}
                  </p>

                  {/* Дії (Лайк, Коментар, Зберегти, Поділитись) */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-4 sm:gap-6">

                      {/* Лайк */}
                      <button
                        type="button"
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-rose-500 transition-colors active:scale-125 cursor-pointer"
                      >
                        <Heart
                          size={18}
                          className={post.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}
                        />
                        <span>{post.likes || 0}</span>
                      </button>

                      {/* Відкрити коментарі */}
                      <button
                        type="button"
                        onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={18} />
                        <span>{post.commentsList?.length || post.comments || 0}</span>
                      </button>

                      {/* Поділитися */}
                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Поділитися"
                      >
                        <Share2 size={17} />
                      </button>
                    </div>

                    {/* Закладка */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(post.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Зберегти"
                    >
                      <Bookmark size={18} className={isSaved ? 'fill-cyan-400 text-cyan-400' : ''} />
                    </button>
                  </div>

                  {/* 💬 СЕКЦІЯ КОМЕНТАРІВ (Розгортається при кліку) */}
                  <AnimatePresence>
                    {isCommentsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-slate-800 space-y-3"
                      >
                        {/* Список коментарів */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                          {post.commentsList?.map(c => (
                            <div key={c.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span className="text-cyan-300">{c.author}</span>
                                <span>{c.time}</span>
                              </div>
                              <p className="text-slate-200 mt-1">{c.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Поле вводу коментаря */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder={l.writeComment}
                            className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!commentInput.trim()) return;
                              post.commentsList = post.commentsList || [];
                              post.commentsList.push({
                                id: Date.now().toString(),
                                author: user?.firstName || 'Я',
                                text: commentInput.trim(),
                                time: 'щойно'
                              });
                              setCommentInput('');
                              toast.success('Коментар додано!');
                            }}
                            className="p-2.5 bg-cyan-400 text-black hover:bg-cyan-300 rounded-xl transition-all cursor-pointer shrink-0"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      {/* 🚀 МОДАЛКА СТВОРЕННЯ ПУБЛІКАЦІЇ (INSTAGRAM + DRIBBBLE STYLE) */}
      <AnimatePresence>
        {showNewPostModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto space-y-5"
            >
              <button
                type="button"
                onClick={() => setShowNewPostModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{l.modalTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{l.modalSubtitle}</p>
              </div>

              {/* Тип публікації (Блог / Посилка / Попутник / Питання) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'blog', label: l.typeBlog },
                  { id: 'parcel', label: l.typeParcel },
                  { id: 'buddy', label: l.typeBuddy },
                  { id: 'question', label: l.typeQuestion },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${postType === t.id
                        ? 'bg-cyan-400 text-black font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Маршрут */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider pl-1">{l.routeLabel}</label>
                <input
                  type="text"
                  value={newPostRoute}
                  onChange={(e) => setNewPostRoute(e.target.value)}
                  placeholder="Київ → Рим"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none"
                />
              </div>

              {/* Текст */}
              <div className="space-y-1.5">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={l.textareaPlaceholder}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-2xl p-4 text-xs sm:text-sm text-white outline-none resize-none"
                />
              </div>

              {/* Прев'ю прикріпленого фото */}
              {newPostImage && (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-800 bg-black">
                  <img src={newPostImage} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewPostImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Дії та публікація */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  <Camera size={15} className="text-cyan-400" />
                  <span>{l.addPhoto}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={isPosting}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPosting ? l.publishing : l.publishBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForumTab;