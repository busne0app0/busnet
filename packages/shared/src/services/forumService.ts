import { supabase } from '../supabase/config';
import { ForumPost, BorderStatus, ForumComment } from '../busnet/types';

export const forumService = {
  // Posts
  async createPost(content: string, category: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація');

    // Rate limit check (1 post per minute)
    const { data: recentPosts } = await supabase
      .from('forum_posts')
      .select('created_at')
      .eq('authorId', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentPosts && recentPosts.length > 0) {
       const lastPostTime = new Date(recentPosts[0].created_at).getTime();
       if (Date.now() - lastPostTime < 60000) {
         throw new Error('Зачекайте 1 хвилину перед створенням нового посту.');
       }
    }

    // In Supabase, the user metadata is stored in user.user_metadata or a separate users table
    const { data: userData } = await supabase.from('users').select('firstName, lastName, email').eq('uid', user.id).single();
    
    const authorName = userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.email?.split('@')[0] || 'Анонім');
    const authorInitials = authorName.charAt(0).toUpperCase();

    const payload = {
      id: "FP-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      authorId: user.id,
      title: 'Post', // Add generic title as schema expects it
      content,
      // The schema currently does not have likes/commentsCount/verified/coins/category but we can just use what the schema supports, 
      // or we can add a 'metadata' JSONB column if they were there. 
      // According to the provided SQL schema:
      // authorId TEXT, title TEXT, content TEXT, created_at TIMESTAMP
    };

    try {
      const { error, data } = await supabase.from('forum_posts').insert(payload).select().single();
      if (error) throw error;
      
      // Update loyalty points
      const currentPoints = (await supabase.from('users').select('loyaltyPoints').eq('uid', user.id).single()).data?.loyaltyPoints || 0;
      await supabase.from('users').update({ loyaltyPoints: currentPoints + 10 }).eq('uid', user.id);

      return data.id;
    } catch (error: any) {
      console.error('Forum Post Error:', error.message);
      return '';
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await supabase.from('forum_posts').delete().eq('id', postId);
    } catch (error: any) {
      console.error('Forum Post Delete Error:', error.message);
    }
  },

  async likePost(postId: string, likedByCurrent: string[]): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація');

    // Supabase schema doesn't have likes yet according to the SQL snippet, skipping for now or needs JSONB update
  },

  // Comments
  async addComment(postId: string, content: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація');

    const payload = {
      id: "FC-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      postId,
      authorId: user.id,
      content,
    };

    try {
      const { error, data } = await supabase.from('forum_comments').insert(payload).select().single();
      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error('Forum Comment Error:', error.message);
      return '';
    }
  },

  subscribeToComments(postId: string, callback: (comments: ForumComment[]) => void) {
    // Initial fetch
    supabase.from('forum_comments').select('*').eq('postId', postId).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) callback(data as any); });

    // Realtime subscription
    const channel = supabase.channel(`comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments', filter: `postId=eq.${postId}` }, (payload) => {
        // Refresh all comments for simplicity, or manage state properly
        supabase.from('forum_comments').select('*').eq('postId', postId).order('created_at', { ascending: true })
          .then(({ data }) => { if (data) callback(data as any); });
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  },

  // Real-time listeners
  subscribeToPosts(callback: (posts: ForumPost[]) => void) {
    // Initial fetch
    supabase.from('forum_posts').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) callback(data as any); });

    // Realtime subscription
    const channel = supabase.channel('public-forum-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
        supabase.from('forum_posts').select('*').order('created_at', { ascending: false }).limit(50)
          .then(({ data }) => { if (data) callback(data as any); });
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  },

  subscribeToBorderStatus(callback: (status: BorderStatus[]) => void) {
    // The schema does not have border_status table defined. 
    // We will simulate it for now.
    callback([]);
    return () => {};
  },

  // Seed initial data if empty (Admin only)
  async seedBorderStatus(): Promise<void> {
    // Skip for Supabase unless table is added
  }
};

