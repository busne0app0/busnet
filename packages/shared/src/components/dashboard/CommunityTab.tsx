import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Search, Plus, Heart, MessageSquare, Bookmark, Share2, Inbox,
    X, Camera, MapPin, Send, Sparkles, Package, Users, Compass,
    HelpCircle, CheckCircle2, Star, AlertTriangle, Clock, ArrowRight,
    ShieldCheck, Eye, ThumbsUp, Filter, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export type CommunityCategory = 'all' | 'blog' | 'parcel' | 'buddy' | 'border' | 'review';

export interface CommunityPost {
    id: string;
    author: string;
    authorAvatar?: string;
    authorIsVerified?: boolean;
    type: 'blog' | 'parcel' | 'buddy' | 'border' | 'review';
    title: string;
    content: string;
    imageUrl?: string;
    routeFrom?: string;
    routeTo?: string;
    departureDate?: string;
    // Специфика для посылок
    parcelWeight?: string;
    parcelReward?: string;
    // Специфика для попутчиков
    buddySeats?: number;
    languages?: string[];
    // Специфика для границ
    borderCheckpoint?: string;
    borderQueueHours?: number;
    // Специфика для отзывов
    carrierName?: string;
    rating?: number;
    likes: number;
    commentsCount: number;
    tags?: string[];
    created_at: string;
}

export interface StoryItem {
    id: string;
    author: string;
    authorAvatar: string;
    mediaUrl: string;
    caption: string;
    tag: string;
    createdAt: string;
    isViewed?: boolean;
}

interface CommunityTabProps {
    initialPosts?: CommunityPost[];
    onNavigateToTicket?: (routeFrom: string, routeTo: string) => void;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
    initialPosts,
    onNavigateToTicket,
}) => {
    const { user } = useAuthStore();
    const { language } = useLanguage();
    const currentLang = (language || 'UK').toUpperCase();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Навигация внутри Community
    const [activeTab, setActiveTab] = useState<'feed' | 'buddies' | 'parcels' | 'borders' | 'saved'>('feed');
    const [feedCategory, setFeedCategory] = useState<CommunityCategory>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Модальные окна
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

    // Закладки и лайки (локально + синхронизация)
    const [likedPosts, setLikedPosts] = useState<string[]>([]);
    const [savedPosts, setSavedPosts] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('busnet_saved_community');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('busnet_saved_community', JSON.stringify(savedPosts));
        } catch (e) {
            console.error(e);
        }
    }, [savedPosts]);

    // Форма создания поста
    const [postType, setPostType] = useState<CommunityPost['type']>('blog');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newRouteFrom, setNewRouteFrom] = useState('');
    const [newRouteTo, setNewRouteTo] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newParcelWeight, setNewParcelWeight] = useState('');
    const [newBuddySeats, setNewBuddySeats] = useState('1');
    const [newBorderHours, setNewBorderHours] = useState('');
    const [newCarrierRating, setNewCarrierRating] = useState(5);
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Словник (UK / EN / IT)
    const t = {
        title: 'BUSNET COMMUNITY',
        tagline: currentLang === 'EN'
            ? 'European Travelers Social Network & Realtime Transit Hub'
            : currentLang === 'IT'
                ? 'Il Social Network dei Viaggiatori Internazionali e Servizi Tratte'
                : 'Соціальна мережа міжнародних мандрівників та онлайн-хаб рейсів',
        searchPlaceholder: currentLang === 'EN'
            ? 'Search destinations, parcel deliveries, travel buddies, border queues...'
            : currentLang === 'IT'
                ? 'Cerca destinazioni, pacchi, compagni di viaggio, frontiere...'
                : 'Пошук міст, посилок, попутників, ситуації на митницях...',
        newPost: currentLang === 'EN' ? 'Create Story' : currentLang === 'IT' ? 'Nuovo Post' : 'Створити допис',
        navFeed: currentLang === 'EN' ? 'Feed' : currentLang === 'IT' ? 'Bacheca' : 'Стрічка',
        navBuddies: currentLang === 'EN' ? 'Buddies' : currentLang === 'IT' ? 'Compagni' : 'Попутники',
        navParcels: currentLang === 'EN' ? 'Parcels' : currentLang === 'IT' ? 'Pacchi' : 'Посилки',
        navBorders: currentLang === 'EN' ? 'Borders Live' : currentLang === 'IT' ? 'Frontiere' : 'Кордони Live',
        navSaved: currentLang === 'EN' ? 'Bookmarks' : currentLang === 'IT' ? 'Salvati' : 'Збережене',
        // Категории
        catAll: currentLang === 'EN' ? 'All' : currentLang === 'IT' ? 'Tutti' : 'Всі події',
        catBlog: currentLang === 'EN' ? 'Blogs' : currentLang === 'IT' ? 'Blog' : 'Блоги',
        catParcel: currentLang === 'EN' ? 'Parcels' : currentLang === 'IT' ? 'Pacchi' : 'Посилки',
        catBuddy: currentLang === 'EN' ? 'Travel Buddies' : currentLang === 'IT' ? 'Compagni' : 'Попутники',
        catBorder: currentLang === 'EN' ? 'Borders' : currentLang === 'IT' ? 'Frontiere' : 'Митниці',
        catReview: currentLang === 'EN' ? 'Bus Reviews' : currentLang === 'IT' ? 'Recensioni' : 'Відгуки',
        queueTime: currentLang === 'EN' ? 'Wait time:' : currentLang === 'IT' ? 'Attesa:' : 'Черга на КПП:',
        hours: currentLang === 'EN' ? 'hours' : currentLang === 'IT' ? 'ore' : 'год.',
        seatsAvail: currentLang === 'EN' ? 'seats' : currentLang === 'IT' ? 'posti' : 'місць',
        findTickets: currentLang === 'EN' ? 'Find Tickets on BUSNET' : currentLang === 'IT' ? 'Trova Biglietti' : 'Знайти квитки на цей рейс',
        writeAuthor: currentLang === 'EN' ? 'Message' : currentLang === 'IT' ? 'Contatta' : 'Написати',
        emptyTitle: currentLang === 'EN' ? 'No posts yet' : currentLang === 'IT' ? 'Nessun post' : 'Публікацій поки немає',
        emptyDesc: currentLang === 'EN' ? 'Be the first to share an update or request!' : currentLang === 'IT' ? 'Sii il primo a condividere!' : 'Будьте першим, хто поділиться досвідом або створить запит!',
    };

    // Демо-истории (Stories)
    const stories: StoryItem[] = [
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

    // Стартовая база постов
    const [posts, setPosts] = useState<CommunityPost[]>(initialPosts || [
        {
            id: 'post-1',
            author: 'Диспетчер BUSNET',
            authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
            authorIsVerified: true,
            type: 'border',
            title: 'Оперативна ситуація: Шегині — Медика',
            content: 'Станом на вечір оформлення пасажирських автобусів займає близько 4.5 годин. Перевізники радять враховувати цей час при стиковках на потяги у Перемишлі.',
            borderCheckpoint: 'Шегині — Медика (UA / PL)',
            borderQueueHours: 4.5,
            routeFrom: 'Львів',
            routeTo: 'Краків / Перемишль',
            likes: 42,
            commentsCount: 9,
            tags: ['Митниця', 'Польща', 'Автобуси'],
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
            id: 'post-2',
            author: 'Оксана Мельник',
            authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            authorIsVerified: false,
            type: 'parcel',
            title: 'Терміново передати документи до Мілана',
            content: 'Шукаю пасажира на рейс Київ — Мілан на 14–15 числа. Потрібно передати конверт з документами (формат А4, вага 200 грамів). Зустрінуть прямо біля автобуса.',
            routeFrom: 'Київ',
            routeTo: 'Мілан (Lampugnano)',
            parcelWeight: '0.3 кг',
            parcelReward: '30 €',
            likes: 12,
            commentsCount: 4,
            tags: ['Посилка', 'Документи', 'Мілан'],
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
            id: 'post-3',
            author: 'Тарас & Анна',
            authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            authorIsVerified: true,
            type: 'buddy',
            title: 'Шукаємо попутників для веселої поїздки до Рима',
            content: 'Їдемо вдвох автобусом зі Львова до Рима на концерт. Будемо раді познайомитися з хлопцями або дівчатами, щоб разом провести час у дорозі та розділити трансфер по місту!',
            routeFrom: 'Львів',
            routeTo: 'Рим (Tiburtina)',
            departureDate: '18 Листопада',
            buddySeats: 2,
            languages: ['Українська', 'English', 'Italiano'],
            likes: 28,
            commentsCount: 7,
            tags: ['Попутники', 'Італія', 'Рим'],
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        {
            id: 'post-4',
            author: 'Валерій Дорошенко',
            authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
            authorIsVerified: true,
            type: 'blog',
            title: 'Нічний переїзд через Альпи: враження та поради',
            content: 'Щойно дісталися до Верони. Автобус відмінний: є розетки 220V біля кожного сидіння, стабільний Starlink Wi-Fi навіть у гірських тунелях. Ось кілька фото з ранкового світанку.',
            imageUrl: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=900',
            routeFrom: 'Івано-Франківськ',
            routeTo: 'Верона',
            likes: 85,
            commentsCount: 15,
            tags: ['Європа', 'Альпи', 'Подорож'],
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
            id: 'post-5',
            author: 'Ірина Соловей',
            authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            authorIsVerified: false,
            type: 'review',
            title: 'Відгук про рейс Львів — Болонья (VipBusline)',
            content: 'Водії дуже ввічливі, допомогли з важкими валізами. Кава безкоштовна, зупинки кожні 3.5 години на нормальних заправках Autogrill. 5 зірок із 5!',
            routeFrom: 'Львів',
            routeTo: 'Болонья',
            carrierName: 'VipBusline Express',
            rating: 5,
            likes: 31,
            commentsCount: 3,
            tags: ['Відгук', 'Перевізник', 'Болонья'],
            created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        },
    ]);

    // Фильтрация
    const filteredPosts = useMemo(() => {
        return posts.filter((p) => {
            // 1. Фильтр по верхним разделам
            if (activeTab === 'buddies' && p.type !== 'buddy') return false;
            if (activeTab === 'parcels' && p.type !== 'parcel') return false;
            if (activeTab === 'borders' && p.type !== 'border') return false;
            if (activeTab === 'saved' && !savedPosts.includes(p.id)) return false;

            // 2. Фильтр по категории ленты
            if (activeTab === 'feed' && feedCategory !== 'all' && p.type !== feedCategory) {
                return false;
            }

            // 3. Поиск
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const textToSearch = `${p.title} ${p.content} ${p.author} ${p.routeFrom || ''} ${p.routeTo || ''} ${p.tags?.join(' ') || ''}`.toLowerCase();
                return textToSearch.includes(q);
            }

            return true;
        });
    }, [posts, activeTab, feedCategory, searchQuery, savedPosts]);

    // Лайки
    const handleToggleLike = (id: string) => {
        setPosts((prev) =>
            prev.map((post) => {
                if (post.id === id) {
                    const isLiked = likedPosts.includes(id);
                    return {
                        ...post,
                        likes: isLiked ? post.likes - 1 : post.likes + 1,
                    };
                }
                return post;
            })
        );
        setLikedPosts((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Закладки
    const handleToggleSave = (id: string) => {
        setSavedPosts((prev) => {
            const exists = prev.includes(id);
            if (exists) {
                toast('Видалено із збереженого', { icon: '🔖' });
                return prev.filter((i) => i !== id);
            } else {
                toast.success('Збережено в обране!');
                return [...prev, id];
            }
        });
    };

    // Создание публикации
    const handleCreatePostSubmit = () => {
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error('Будь ласка, заповніть заголовок та опис');
            return;
        }

        setIsSubmitting(true);

        const newPost: CommunityPost = {
            id: `post-${Date.now()}`,
            author: (user as any)?.firstName || (user as any)?.name || 'Мандрівник BUSNET',
            authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((user as any)?.email || 'User')}`,
            authorIsVerified: false,
            type: postType,
            title: newTitle.trim(),
            content: newContent.trim(),
            routeFrom: newRouteFrom.trim() || undefined,
            routeTo: newRouteTo.trim() || undefined,
            departureDate: newDate.trim() || undefined,
            parcelWeight: postType === 'parcel' ? newParcelWeight.trim() || 'До 5 кг' : undefined,
            buddySeats: postType === 'buddy' ? parseInt(newBuddySeats, 10) || 1 : undefined,
            borderQueueHours: postType === 'border' ? parseFloat(newBorderHours) || 2 : undefined,
            rating: postType === 'review' ? newCarrierRating : undefined,
            imageUrl: newImagePreview || undefined,
            likes: 0,
            commentsCount: 0,
            tags: [postType.toUpperCase(), newRouteFrom, newRouteTo].filter(Boolean) as string[],
            created_at: new Date().toISOString(),
        };

        setPosts((prev) => [newPost, ...prev]);
        toast.success('Публікацію додано до Community!');

        // Очистка формы
        setNewTitle('');
        setNewContent('');
        setNewRouteFrom('');
        setNewRouteTo('');
        setNewImagePreview('');
        setShowCreateModal(false);
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans text-slate-100">

            {/* ---------------- 1. TOP HEADER & SEARCH ---------------- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF]">
                            <Compass size={20} />
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                            {t.title}
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                        {t.tagline}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00D2FF] to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,210,255,0.3)] active:scale-95 transition-all cursor-pointer"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>{t.newPost}</span>
                </button>
            </div>

            {/* ---------------- 2. INSTAGRAM-STYLE STORIES BAR ---------------- */}
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            onClick={() => setActiveStory(story)}
                            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group select-none"
                        >
                            <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-[#00D2FF] via-purple-500 to-amber-400 group-hover:scale-105 transition-transform shadow-lg">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[#070b12] bg-slate-900">
                                    <img
                                        src={story.authorAvatar}
                                        alt={story.author}
                                        className="w-full h-full object-cover group-hover:rotate-3 transition-transform"
                                    />
                                </div>
                            </div>
                            <span className="text-[11px] font-medium text-slate-300 max-w-[76px] truncate text-center group-hover:text-[#00D2FF] transition-colors">
                                {story.author}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ---------------- 3. MAIN SECTION TABS ---------------- */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.04] pb-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5">
                    {[
                        { id: 'feed', label: t.navFeed, icon: <Compass size={14} /> },
                        { id: 'buddies', label: t.navBuddies, icon: <Users size={14} /> },
                        { id: 'parcels', label: t.navParcels, icon: <Package size={14} /> },
                        { id: 'borders', label: t.navBorders, icon: <AlertTriangle size={14} /> },
                        { id: 'saved', label: t.navSaved, icon: <Bookmark size={14} /> },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                  px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap
                  ${isActive
                                        ? 'bg-white/[0.08] text-white border border-white/[0.12] shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                                    }
                `}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ---------------- 4. SEARCH & CATEGORY PILLS (FOR FEED) ---------------- */}
            <div className="space-y-3">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-11 pr-4 py-3 bg-[#0a0f18]/80 border border-white/[0.06] focus:border-[#00D2FF]/50 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                </div>

                {activeTab === 'feed' && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'all', label: t.catAll },
                            { id: 'blog', label: t.catBlog },
                            { id: 'border', label: t.catBorder },
                            { id: 'parcel', label: t.catParcel },
                            { id: 'buddy', label: t.catBuddy },
                            { id: 'review', label: t.catReview },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFeedCategory(cat.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${feedCategory === cat.id
                                    ? 'bg-[#00D2FF]/15 text-[#00D2FF] border border-[#00D2FF]/30 font-semibold'
                                    : 'bg-[#0b101b] hover:bg-white/[0.04] text-slate-400 border border-white/[0.04]'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ---------------- 5. POSTS STREAM ---------------- */}
            <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                    <div className="py-20 text-center rounded-3xl border border-dashed border-white/[0.06] bg-[#070b12]/40 p-6 space-y-2">
                        <Inbox size={32} strokeWidth={1.2} className="mx-auto text-slate-600 mb-2" />
                        <h3 className="text-base font-bold text-white">{t.emptyTitle}</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.emptyDesc}</p>
                    </div>
                ) : (
                    filteredPosts.map((post) => {
                        const isLiked = likedPosts.includes(post.id);
                        const isSaved = savedPosts.includes(post.id);

                        return (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0b101b]/80 border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-all hover:border-white/[0.12]"
                            >
                                {/* Шапка поста */}
                                <div className="p-5 flex items-center justify-between gap-3 border-b border-white/[0.03]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={post.authorAvatar}
                                            alt={post.author}
                                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover bg-slate-900 border border-white/[0.08]"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-bold text-white truncate">{post.author}</h4>
                                                {post.authorIsVerified && (
                                                    <CheckCircle2 size={13} className="text-[#00D2FF] shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                {post.routeFrom && post.routeTo && (
                                                    <>
                                                        <MapPin size={11} className="text-[#00D2FF]" />
                                                        <span className="font-semibold text-slate-200">
                                                            {post.routeFrom} → {post.routeTo}
                                                        </span>
                                                        <span>•</span>
                                                    </>
                                                )}
                                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Бейдж типа публикации */}
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${post.type === 'border'
                                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                            : post.type === 'parcel'
                                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                : post.type === 'buddy'
                                                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                                    : post.type === 'review'
                                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-[#00D2FF]/15 text-[#00D2FF] border-[#00D2FF]/30'
                                            }`}
                                    >
                                        {post.type === 'border' && '🚨 Кордон'}
                                        {post.type === 'parcel' && '📦 Посилка'}
                                        {post.type === 'buddy' && '🤝 Попутник'}
                                        {post.type === 'review' && '⭐ Відгук'}
                                        {post.type === 'blog' && '📸 Блог'}
                                    </span>
                                </div>

                                {/* СПЕЦИАЛЬНЫЙ БЛОК: СИТУАЦИЯ НА ГРАНИЦЕ */}
                                {post.type === 'border' && post.borderQueueHours && (
                                    <div className="mx-5 mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-rose-300 font-medium">{post.borderCheckpoint || 'КПП'}</div>
                                                <div className="text-base font-black text-white">
                                                    {t.queueTime} <span className="text-rose-400 font-mono">{post.borderQueueHours} {t.hours}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => onNavigateToTicket?.(post.routeFrom || '', post.routeTo || '')}
                                            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
                                        >
                                            {t.findTickets}
                                        </button>
                                    </div>
                                )}

                                {/* СПЕЦИАЛЬНЫЙ БЛОК: ПОПУТЧИКИ */}
                                {post.type === 'buddy' && (
                                    <div className="mx-5 mt-4 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-purple-300 font-medium">Рейс: {post.departureDate || 'Уточнюється'}</div>
                                                <div className="text-sm font-bold text-white">
                                                    Вільних місць: <span className="text-purple-400">{post.buddySeats || 1} {t.seatsAvail}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => toast.success('Чат із попутником відкрито')}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                                        >
                                            <MessageCircle size={14} /> {t.writeAuthor}
                                        </button>
                                    </div>
                                )}

                                {/* СПЕЦИАЛЬНЫЙ БЛОК: ПОСЫЛКИ */}
                                {post.type === 'parcel' && (
                                    <div className="mx-5 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-amber-300 font-medium">Вага: {post.parcelWeight || 'до 5 кг'}</div>
                                                <div className="text-sm font-bold text-white">
                                                    Винагорода: <span className="text-amber-400">{post.parcelReward || 'Договірна'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => toast.success('Зв’язок із відправником відкрито')}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md self-start sm:self-auto cursor-pointer"
                                        >
                                            {t.writeAuthor}
                                        </button>
                                    </div>
                                )}

                                {/* Фотография */}
                                {post.imageUrl && (
                                    <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden mt-4">
                                        <img
                                            src={post.imageUrl}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>
                                )}

                                {/* Тело поста */}
                                <div className="p-5 space-y-2.5">
                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                                        {post.content}
                                    </p>

                                    {/* Теги */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {post.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] font-semibold text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.04]"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Действия (Лайк, Комментарий, Поделиться, Сохранить) */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] mt-4">
                                        <div className="flex items-center gap-5">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleLike(post.id)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-rose-500 transition-colors active:scale-125 cursor-pointer"
                                            >
                                                <Heart
                                                    size={18}
                                                    className={isLiked ? 'fill-rose-500 text-rose-500' : ''}
                                                />
                                                <span>{post.likes}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => toast('Секція коментарів розгортається')}
                                                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#00D2FF] transition-colors cursor-pointer"
                                            >
                                                <MessageSquare size={18} />
                                                <span>{post.commentsCount}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard?.writeText(window.location.href);
                                                    toast.success('Посилання скопійовано!');
                                                }}
                                                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <Share2 size={17} />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleSave(post.id)}
                                            className="text-slate-400 hover:text-[#00D2FF] transition-colors cursor-pointer"
                                        >
                                            <Bookmark
                                                size={18}
                                                className={isSaved ? 'fill-[#00D2FF] text-[#00D2FF]' : ''}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })
                )}
            </div>

            {/* ---------------- 6. STORIES VIEWER MODAL ---------------- */}
            <AnimatePresence>
                {activeStory && (
                    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
                        <div className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 flex flex-col justify-between p-6">
                            <img
                                src={activeStory.mediaUrl}
                                alt="Story"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

                            {/* Верхняя строка сторис */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={activeStory.authorAvatar}
                                        alt={activeStory.author}
                                        className="w-10 h-10 rounded-full border-2 border-[#00D2FF]"
                                    />
                                    <div>
                                        <h4 className="text-sm font-bold text-white">{activeStory.author}</h4>
                                        <p className="text-[10px] text-slate-300">{activeStory.tag} • {activeStory.createdAt}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveStory(null)}
                                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Нижний текст */}
                            <div className="relative z-10 space-y-4">
                                <p className="text-sm text-white font-medium leading-relaxed drop-shadow-md">
                                    {activeStory.caption}
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Надіслати реакцію..."
                                        className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.success('Реакцію надіслано!');
                                            setActiveStory(null);
                                        }}
                                        className="px-4 py-2 bg-[#00D2FF] text-black font-bold text-xs rounded-xl"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* ---------------- 7. RICH CREATION MODAL ---------------- */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#0e1422] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl my-auto space-y-5"
                        >
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/[0.04] cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div>
                                <h3 className="text-xl font-black uppercase text-white tracking-tight">
                                    Створити публікацію в Community
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Оберіть розділ, маршрут та поділіться важливою інформацією
                                </p>
                            </div>

                            {/* Выбор типа */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                {[
                                    { id: 'blog', label: '📸 Блог' },
                                    { id: 'border', label: '🚨 Кордон' },
                                    { id: 'parcel', label: '📦 Посилка' },
                                    { id: 'buddy', label: '🤝 Попутник' },
                                    { id: 'review', label: '⭐ Відгук' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setPostType(item.id as any)}
                                        className={`py-2 px-1 text-[11px] font-bold uppercase rounded-xl transition-all cursor-pointer ${postType === item.id
                                            ? 'bg-[#00D2FF] text-black font-black shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                                            : 'bg-black/40 text-slate-400 border border-white/[0.06] hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {/* Маршрут (Откуда - Куда) */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={newRouteFrom}
                                    onChange={(e) => setNewRouteFrom(e.target.value)}
                                    placeholder="Звідки (Київ)"
                                    className="bg-black/40 border border-white/[0.06] focus:border-[#00D2FF]/50 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                                />
                                <input
                                    type="text"
                                    value={newRouteTo}
                                    onChange={(e) => setNewRouteTo(e.target.value)}
                                    placeholder="Куди (Мілан)"
                                    className="bg-black/40 border border-white/[0.06] focus:border-[#00D2FF]/50 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                                />
                            </div>

                            {/* Дополнительные поля по типу */}
                            {postType === 'border' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Час очікування на КПП (годин)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={newBorderHours}
                                        onChange={(e) => setNewBorderHours(e.target.value)}
                                        placeholder="Наприклад: 3.5"
                                        className="w-full bg-black/40 border border-white/[0.06] focus:border-rose-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                                    />
                                </div>
                            )}

                            {postType === 'parcel' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Вага та опис вантажу</label>
                                    <input
                                        type="text"
                                        value={newParcelWeight}
                                        onChange={(e) => setNewParcelWeight(e.target.value)}
                                        placeholder="Наприклад: Документи 0.5 кг або Валіза 15 кг"
                                        className="w-full bg-black/40 border border-white/[0.06] focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                                    />
                                </div>
                            )}

                            {postType === 'buddy' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Дата рейсу</label>
                                        <input
                                            type="text"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            placeholder="18 Листопада"
                                            className="w-full bg-black/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-purple-400 uppercase">Вільних місць</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={newBuddySeats}
                                            onChange={(e) => setNewBuddySeats(e.target.value)}
                                            className="w-full bg-black/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Заголовок */}
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Заголовок допису *"
                                className="w-full bg-black/40 border border-white/[0.06] focus:border-[#00D2FF]/50 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-bold"
                            />

                            {/* Текст */}
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Детальний опис події, враження, правила перевезення..."
                                rows={4}
                                className="w-full bg-black/40 border border-white/[0.06] focus:border-[#00D2FF]/50 rounded-2xl p-4 text-xs text-white outline-none resize-none"
                            />

                            {/* Превью фото */}
                            {newImagePreview && (
                                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
                                    <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setNewImagePreview(null)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Кнопки публикации */}
                            <div className="flex items-center justify-between pt-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            const r = new FileReader();
                                            r.onload = () => setNewImagePreview(r.result as string);
                                            r.readAsDataURL(f);
                                        }
                                    }}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.06]"
                                >
                                    <Camera size={15} className="text-[#00D2FF]" />
                                    <span>Фото</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCreatePostSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-gradient-to-r from-[#00D2FF] to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-40 cursor-pointer"
                                >
                                    {isSubmitting ? 'Публікація...' : 'Опублікувати'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunityTab;