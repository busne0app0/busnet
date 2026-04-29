import { create } from 'zustand';
import { ForumPost, BorderStatus } from '../busnet/types';
import { forumService } from '../services/forumService';
import { useAuthStore } from './useAuthStore';

interface ForumState {
  posts: ForumPost[];
  borderStatuses: BorderStatus[];
  isLoading: boolean;
  
  // Actions
  addPost: (content: string, category: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  setPosts: (posts: ForumPost[]) => void;
  setBorderStatuses: (statuses: BorderStatus[]) => void;
  initForum: () => () => void; // Returns unsubscribe function
}

export const useForumStore = create<ForumState>((set, get) => ({
  posts: [],
  borderStatuses: [],
  isLoading: false,

  setPosts: (posts) => set({ posts }),
  setBorderStatuses: (statuses) => set({ borderStatuses: statuses }),

  addPost: async (content, category) => {
    try {
      await forumService.createPost(content, category);
    } catch (error) {
      console.error('Failed to create post', error);
      throw error;
    }
  },

  deletePost: async (postId) => {
    try {
      await forumService.deletePost(postId);
    } catch (error) {
      console.error('Failed to delete post', error);
    }
  },

  addComment: async (postId, content) => {
    try {
      await forumService.addComment(postId, content);
    } catch (error) {
      console.error('Failed to add comment', error);
      throw error;
    }
  },

  likePost: async (postId) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;
      const currentPosts = get().posts;
      const post = currentPosts.find(p => p.id === postId);
      if (!post) return;
      
      const likedByCurrent = post.likedBy || [];
      const hasLiked = likedByCurrent.includes(user.uid);

      // Optimistic update
      set({
        posts: currentPosts.map(p => {
          if (p.id === postId) {
            return { 
               ...p, 
               likes: p.likes + (hasLiked ? -1 : 1), 
               likedBy: hasLiked ? p.likedBy?.filter(id => id !== user.uid) : [...(p.likedBy || []), user.uid] 
            };
          }
          return p;
        })
      });
      await forumService.likePost(postId, likedByCurrent);
    } catch (error) {
      console.error('Failed to like post', error);
    }
  },

  initForum: () => {
    set({ isLoading: true });
    
    // Subscribe to statuses
    const unsubStatus = forumService.subscribeToBorderStatus((statuses) => {
      set({ borderStatuses: statuses });
      if (statuses.length === 0) {
        forumService.seedBorderStatus();
      }
    });

    // Subscribe to posts
    const unsubPosts = forumService.subscribeToPosts((posts) => {
      set({ posts, isLoading: false });
    });

    return () => {
      unsubStatus();
      unsubPosts();
    };
  },
}));
