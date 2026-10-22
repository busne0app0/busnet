import { supabase } from '../supabase/config';
import { ForumPost, BorderStatus, ForumComment } from '../busnet/types';

export const forumService = {

  // ── POSTS ──────────────────────────────────────────────────────────────────

  async createPost(content: string, category: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація');

    // Rate limit: 1 post per minute
    try {
      const { data: recentPosts } = await supabase
        .from('forum_posts')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentPosts && recentPosts.length > 0) {
        const lastPostTime = new Date(recentPosts[0].created_at).getTime();
        if (Date.now() - lastPostTime < 60000) {
          throw new Error('Зачекайте 1 хвилину перед створенням нового посту.');
        }
      }
    } catch (e: any) {
      if (e.message?.includes('1 хвилину')) throw e;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('firstName, lastName, email')
      .eq('uid', user.id)
      .single();

    const authorName = userData?.firstName
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : (user.email?.split('@')[0] || 'Анонім');

    const payload = {
      id:          'FP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      user_id:     user.id,
      author_name: authorName,
      title:       content.slice(0, 50),
      content,
      category:    category || 'Загальне',
      likes_count: 0,
      liked_by:    [] as string[],
      comments:    0,
    };

    const { error, data } = await supabase
      .from('forum_posts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    return data?.id || payload.id;
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
    if (error) throw error;
  },

  // toggle лайк через RPC (захист від подвійного лайку всередині функції)
  async likePost(postId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Потрібна авторизація');
    const { error } = await supabase.rpc('increment_likes', { post_id: postId });
    if (error) console.warn('increment_likes:', error.message);
  },

  // ── COMMENTS ───────────────────────────────────────────────────────────────

  async addComment(postId: string, content: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація');

    const { data: userData } = await supabase
      .from('users')
      .select('firstName, lastName, email')
      .eq('uid', user.id)
      .single();

    const authorName = userData?.firstName
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : (user.email?.split('@')[0] || 'Анонім');

    const payload = {
      id:          'FC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      post_id:     postId,
      user_id:     user.id,
      author_name: authorName,
      content,
    };

    const { error, data } = await supabase
      .from('forum_comments')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    return data?.id || payload.id;
  },

  // ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────

  subscribeToComments(postId: string, callback: (comments: ForumComment[]) => void) {
    const mapComment = (row: any): ForumComment => ({
      id:             row.id,
      postId:         row.post_id || '',
      authorId:       row.user_id || '',
      authorName:     row.author_name || 'Користувач',
      authorInitials: (row.author_name || 'U').charAt(0).toUpperCase(),
      content:        row.content || '',
      createdAt:      row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    });

    const fetch = () =>
      supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)           // ✅ тільки post_id (старого postId немає)
        .order('created_at', { ascending: true })
        .then(({ data }) => { if (data) callback(data.map(mapComment)); });

    fetch();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_comments',
        filter: `post_id=eq.${postId}`,  // ✅
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeToPosts(callback: (posts: ForumPost[]) => void) {
    const mapPost = (row: any): ForumPost => ({
      id:            row.id,
      authorId:      row.user_id || '',
      authorName:    row.author_name || 'Користувач',
      authorInitials:(row.author_name || 'U').charAt(0).toUpperCase(),
      category:      row.category || 'Загальне',
      content:       row.content || '',
      likes:         row.likes_count || 0,
      likedBy:       Array.isArray(row.liked_by) ? row.liked_by : [], // ✅ liked_by
      commentsCount: row.comments || 0,
      verified:      Boolean(row.verified),
      coins:         row.coins || 0,
      createdAt:     row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    });

    const fetch = () =>
      supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => { if (data) callback(data.map(mapPost)); });

    fetch();

    const channel = supabase
      .channel('public-forum-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  subscribeToBorderStatus(callback: (status: BorderStatus[]) => void) {
    callback([]);
    return () => {};
  },

  async seedBorderStatus(): Promise<void> { /* skip */ },
};
