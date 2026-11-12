import { create } from 'zustand';
import { ConnectPost, ConnectComment, ConnectPostType, ConnectTabType, ConnectReportPayload } from '../types/connect.types';
import { connectFeedService } from '../services/connectFeedService';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

interface ConnectState {
  posts: ConnectPost[];
  userPrivatePosts: ConnectPost[];
  activeTab: ConnectTabType;
  categoryFilter: ConnectPostType | 'all';
  searchQuery: string;
  savedPostIds: string[];
  activePost: ConnectPost | null;
  comments: ConnectComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  cooldownSeconds: number;
  error: string | null;

  // Actions
  setActiveTab: (tab: ConnectTabType) => void;
  setCategoryFilter: (category: ConnectPostType | 'all') => void;
  setSearchQuery: (query: string) => void;
  setActivePost: (post: ConnectPost | null) => void;
  toggleSavePost: (postId: string) => void;
  fetchPosts: () => Promise<void>;
  fetchUserPrivatePosts: () => Promise<void>;
  createPost: (payload: {
    title?: string;
    content: string;
    category: string;
    postType: ConnectPostType;
    imageUrl?: string;
    routeFrom?: string;
    routeTo?: string;
    meta?: Record<string, any>;
    isPublic?: boolean;
  }) => Promise<string | undefined>;
  likePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  reportPost: (payload: ConnectReportPayload) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  startCooldown: (seconds: number) => void;
  initConnect: () => () => void;
}

let cooldownTimer: any = null;

export const useConnectStore = create<ConnectState>((set, get) => ({
  posts: [],
  userPrivatePosts: [],
  activeTab: 'community',
  categoryFilter: 'all',
  searchQuery: '',
  savedPostIds: (() => {
    try {
      const stored = localStorage.getItem('busnet_saved_connect');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  activePost: null,
  comments: [],
  isLoading: false,
  isSubmitting: false,
  cooldownSeconds: 0,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
    get().fetchPosts();
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchPosts();
  },
  setActivePost: (post) => set({ activePost: post }),

  toggleSavePost: (postId) => {
    const current = get().savedPostIds;
    const exists = current.includes(postId);
    const updated = exists ? current.filter(id => id !== postId) : [...current, postId];
    set({ savedPostIds: updated });
    try {
      localStorage.setItem('busnet_saved_connect', JSON.stringify(updated));
      toast.success(exists ? 'Видалено із збережених' : 'Збережено в закладки');
    } catch (e) {
      console.error(e);
    }
  },

  startCooldown: (seconds: number) => {
    if (cooldownTimer) clearInterval(cooldownTimer);
    set({ cooldownSeconds: seconds });
    cooldownTimer = setInterval(() => {
      const current = get().cooldownSeconds;
      if (current <= 1) {
        clearInterval(cooldownTimer);
        set({ cooldownSeconds: 0 });
      } else {
        set({ cooldownSeconds: current - 1 });
      }
    }, 1000);
  },

  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { categoryFilter, searchQuery } = get();
      const posts = await connectFeedService.fetchPosts({
        postType: categoryFilter,
        searchQuery,
      });
      set({ posts, isLoading: false });
    } catch (err: any) {
      console.error('[useConnectStore.fetchPosts] error:', err);
      set({ error: err.message || 'Помилка завантаження стрічки', isLoading: false });
    }
  },

  fetchUserPrivatePosts: async () => {
    try {
      const userPrivatePosts = await connectFeedService.fetchUserPrivatePosts();
      set({ userPrivatePosts });
    } catch (err: any) {
      console.error('[useConnectStore.fetchUserPrivatePosts] error:', err);
    }
  },

  createPost: async (payload) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      toast.error('Потрібна авторизація для створення публікації');
      return;
    }

    const { cooldownSeconds } = get();
    if (cooldownSeconds > 0) {
      toast.error(`Обмеження частоти: зачекайте ${cooldownSeconds} сек. перед наступною публікацією.`);
      return;
    }

    set({ isSubmitting: true });
    try {
      const postId = await connectFeedService.createPost(payload);
      toast.success('Публікацію успішно створено!');
      set({ isSubmitting: false });
      // B2: 60 seconds client-side cooldown on publish button
      get().startCooldown(60);
      await get().fetchPosts();
      return postId;
    } catch (err: any) {
      set({ isSubmitting: false });
      const msg = err.message || '';
      if (msg.startsWith('RATE_LIMIT:')) {
        const secs = parseInt(msg.split(':')[1], 10) || 60;
        get().startCooldown(secs);
        toast.error(`Обмеження частоти: зачекайте ${secs} сек. перед наступною публікацією.`);
      } else {
        toast.error(msg || 'Помилка створення публікації');
      }
      throw err;
    }
  },

  likePost: async (postId) => {
    // B1: For guest, show prompt to log in, do not call RPC
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error('Будь ласка, увійдіть у кабінет, щоб ставити вподобайки');
      return;
    }

    const posts = get().posts;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likedBy.includes(user.uid);
    // Optimistic UI update
    set({
      posts: posts.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          likesCount: p.likesCount + (hasLiked ? -1 : 1),
          likedBy: hasLiked
            ? p.likedBy.filter(uid => uid !== user.uid)
            : [...p.likedBy, user.uid],
        };
      }),
    });

    try {
      const updated = await connectFeedService.likePost(postId);
      // Sync real count returned from DB
      set({
        posts: get().posts.map(p =>
          p.id === postId ? { ...p, likesCount: updated.likesCount, likedBy: updated.likedBy } : p
        ),
      });
    } catch (e) {
      // Revert if failed
      await get().fetchPosts();
      toast.error('Не вдалося оновити вподобайку');
    }
  },

  deletePost: async (postId) => {
    try {
      await connectFeedService.deletePost(postId);
      toast.success('Публікацію видалено');
      set({ 
        posts: get().posts.filter(p => p.id !== postId),
        userPrivatePosts: get().userPrivatePosts.filter(p => p.id !== postId),
      });
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося видалити публікацію');
    }
  },

  deleteComment: async (commentId) => {
    try {
      await connectFeedService.deleteComment(commentId);
      toast.success('Коментар видалено');
      // DB trigger automatically updates forum_posts.comments count
      await get().fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося видалити коментар');
    }
  },

  reportPost: async (payload) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error('Увійдіть, щоб поскаржитися на публікацію');
      return;
    }
    try {
      await connectFeedService.reportPost(payload);
      toast.success('Скаргу надіслано модераторам');
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося надіслати скаргу');
      throw err;
    }
  },

  // B6: Comments counter is kept by DB trigger; do NOT manually increment commentsCount
  addComment: async (postId, content) => {
    if (!content.trim()) return;
    try {
      await connectFeedService.addComment(postId, content);
      toast.success('Коментар додано');
      // Re-fetch posts so DB-triggered comments count is reflected
      await get().fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Не вдалося додати коментар');
      throw err;
    }
  },

  initConnect: () => {
    get().fetchPosts();
    const unsubFeed = connectFeedService.subscribeToFeed(() => {
      get().fetchPosts();
    });
    return () => {
      unsubFeed();
    };
  },
}));
