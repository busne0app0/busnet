import { create } from 'zustand';
import { ForumPost, BorderStatus } from '../busnet/types';
import { forumService } from '../services/forumService';
import { useAuthStore } from './useAuthStore';

interface ForumState {
  posts: ForumPost[];
  borderStatuses: BorderStatus[];
  isLoading: boolean;

  addPost:           (content: string, category: string) => Promise<void>;
  deletePost:        (postId: string) => Promise<void>;
  likePost:          (postId: string) => Promise<void>;
  addComment:        (postId: string, content: string) => Promise<void>;
  setPosts:          (posts: ForumPost[]) => void;
  setBorderStatuses: (statuses: BorderStatus[]) => void;
  initForum:         () => () => void;
}

export const useForumStore = create<ForumState>((set, get) => ({
  posts:          [],
  borderStatuses: [],
  isLoading:      false,

  setPosts:          (posts)    => set({ posts }),
  setBorderStatuses: (statuses) => set({ borderStatuses: statuses }),

  addPost: async (content, category) => {
    await forumService.createPost(content, category);
    // Realtime підхопить новий пост автоматично
  },

  deletePost: async (postId) => {
    await forumService.deletePost(postId);
    // Realtime видалить пост автоматично
  },

  addComment: async (postId, content) => {
    await forumService.addComment(postId, content);
  },

  likePost: async (postId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const posts = get().posts;
    const post  = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likedBy?.includes(user.uid) ?? false;

    // Оптимістичне оновлення UI
    set({
      posts: posts.map(p =>
        p.id !== postId ? p : {
          ...p,
          likes:   p.likes + (hasLiked ? -1 : 1),
          likedBy: hasLiked
            ? (p.likedBy || []).filter(id => id !== user.uid)
            : [...(p.likedBy || []), user.uid],
        }
      ),
    });

    // Виклик RPC (increment_likes захищений від повторного лайку)
    await forumService.likePost(postId);
  },

  initForum: () => {
    set({ isLoading: true });

    const unsubStatus = forumService.subscribeToBorderStatus((statuses) => {
      set({ borderStatuses: statuses });
    });

    const unsubPosts = forumService.subscribeToPosts((posts) => {
      set({ posts, isLoading: false });
    });

    return () => {
      unsubStatus();
      unsubPosts();
    };
  },
}));
