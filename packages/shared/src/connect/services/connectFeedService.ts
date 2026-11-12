import { supabase } from '../../supabase/config';
import { ConnectPost, ConnectComment, ConnectPostType, ConnectReportPayload } from '../types/connect.types';

// Safe mapper for existing forum_posts rows -> ConnectPost
export function mapRowToConnectPost(row: any): ConnectPost {
  let meta: Record<string, any> = {};
  if (typeof row.meta === 'string') {
    try {
      meta = JSON.parse(row.meta);
    } catch {
      meta = {};
    }
  } else if (row.meta && typeof row.meta === 'object') {
    meta = row.meta;
  }
  
  // Intelligent fallback for legacy posts
  let postType: ConnectPostType = row.post_type || 'general';
  if (!row.post_type && row.category) {
    const cat = String(row.category).toLowerCase();
    if (cat.includes('новин') || cat.includes('news')) postType = 'news';
    else if (cat.includes('порад') || cat.includes('tip')) postType = 'tips';
    else if (cat.includes('питан') || cat.includes('quest')) postType = 'questions';
    else if (cat.includes('кордон') || cat.includes('border')) postType = 'border';
    else if (cat.includes('посилк') || cat.includes('parcel')) postType = 'parcel';
    else if (cat.includes('попут') || cat.includes('buddy')) postType = 'buddy';
    else if (cat.includes('відгук') || cat.includes('review')) postType = 'review';
    else if (cat.includes('історі') || cat.includes('blog') || cat.includes('story')) postType = 'blog';
  }

  const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();
  const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : createdAt;

  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    authorName: row.author_name || 'Мандрівник BUSNET',
    authorAvatar: row.author_avatar || row.avatar || undefined,
    authorVerified: Boolean(row.verified || row.author_verified),
    title: row.title || '',
    content: row.content || '',
    category: row.category || 'Загальне',
    postType,
    imageUrl: row.image_url || undefined,
    routeFrom: row.route_from || meta.routeFrom || undefined,
    routeTo: row.route_to || meta.routeTo || undefined,
    meta,
    likesCount: Number(row.likes_count || row.likes || 0),
    likedBy: Array.isArray(row.liked_by) ? row.liked_by : (Array.isArray(row.likedBy) ? row.likedBy : []),
    commentsCount: Number(row.comments || row.commentsCount || 0),
    viewsCount: Number(row.views_count || 0),
    isPublic: row.is_public !== false,
    isIndexable: Boolean(row.is_indexable), // STRICT: default false
    slug: row.slug || undefined,
    createdAt,
    updatedAt,
  };
}

// Sanitize user search input to prevent breaking .or() filters in PostgREST
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[,()%\_\\\"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export const connectFeedService = {
  // ── GET POSTS (FEED: is_public = true) ─────────────────────────────────────
  async fetchPosts(options?: {
    postType?: ConnectPostType | 'all';
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }): Promise<ConnectPost[]> {
    let query = supabase
      .from('forum_posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (options?.postType && options.postType !== 'all') {
      query = query.eq('post_type', options.postType);
    }

    if (options?.searchQuery) {
      const clean = sanitizeSearchQuery(options.searchQuery);
      if (clean) {
        const q = `%${clean}%`;
        query = query.or(`title.ilike.${q},content.ilike.${q},category.ilike.${q}`);
      }
    }

    if (options?.limit) {
      const from = options.offset || 0;
      query = query.range(from, from + options.limit - 1);
    } else {
      query = query.limit(40);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[connectFeedService.fetchPosts] error:', error);
      throw error;
    }

    return (data || []).map(mapRowToConnectPost);
  },

  // ── GET USER'S PRIVATE POSTS (A7) ──────────────────────────────────────────
  async fetchUserPrivatePosts(): Promise<ConnectPost[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_public', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[connectFeedService.fetchUserPrivatePosts] error:', error);
      throw error;
    }

    return (data || []).map(mapRowToConnectPost);
  },

  // ── GET SINGLE POST BY ID ──────────────────────────────────────────────────
  async getPostById(postId: string): Promise<ConnectPost | null> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToConnectPost(data);
  },

  // ── GET SINGLE POST BY SLUG (S3) ───────────────────────────────────────────
  async getPostBySlug(slug: string): Promise<ConnectPost | null> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToConnectPost(data);
  },

  // ── RESOLVE POST BY SLUG OR ID (S2) ────────────────────────────────────────
  async resolvePost(slugOrId: string): Promise<ConnectPost | null> {
    // First try by slug
    let post = await this.getPostBySlug(slugOrId);
    if (post) return post;
    // Fallback: search by id
    return await this.getPostById(slugOrId);
  },

  // ── CREATE POST ────────────────────────────────────────────────────────────
  // S1: Never send slug (auto-generated by DB)
  async createPost(payload: {
    title?: string;
    content: string;
    category: string;
    postType: ConnectPostType;
    imageUrl?: string;
    routeFrom?: string;
    routeTo?: string;
    meta?: Record<string, any>;
    isPublic?: boolean;
  }): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація для публікації');

    // Fetch author details from users table
    const { data: userData } = await supabase
      .from('users')
      .select('firstName, lastName, email, avatar')
      .eq('uid', user.id)
      .maybeSingle();

    const authorName = userData?.firstName
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : (user.email?.split('@')[0] || 'Мандрівник');

    const postId = 'BC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // SAFE INSERT: never send user_id, likes_count, liked_by, comments, views_count,
    // is_indexable, created_at, slug
    const insertPayload: Record<string, any> = {
      id: postId,
      author_name: authorName,
      title: payload.title?.trim() || payload.content.slice(0, 60),
      content: payload.content.trim(),
      category: payload.category || 'Загальне',
      post_type: payload.postType || 'general',
      image_url: payload.imageUrl || null,
      route_from: payload.routeFrom || null,
      route_to: payload.routeTo || null,
      meta: payload.meta || {},
      is_public: payload.isPublic !== undefined ? payload.isPublic : true,
    };

    const { data, error } = await supabase
      .from('forum_posts')
      .insert(insertPayload)
      .select('id, slug')
      .single();

    if (error) {
      console.error('[connectFeedService.createPost] error:', error);
      // A1: Rate limit regexp: match "зачекайте N сек."
      if (error.message && (error.message.includes('Обмеження частоти') || error.message.includes('зачекайте'))) {
        const match = error.message.match(/(\d+)\s*сек/);
        const seconds = match ? parseInt(match[1], 10) : 60;
        throw new Error(`RATE_LIMIT:${seconds}`);
      }
      throw error;
    }

    return data?.id || postId;
  },

  // ── UPDATE POST (STRICTLY AUTHOR ONLY) ─────────────────────────────────────
  // S1: Never send slug, likes_count, liked_by, comments, views_count, is_indexable, user_id, created_at
  // A5: Add .select('id') and verify >= 1 row returned
  async updatePost(postId: string, updates: {
    title?: string;
    content?: string;
    imageUrl?: string;
    category?: string;
    postType?: ConnectPostType;
    routeFrom?: string;
    routeTo?: string;
    meta?: Record<string, any>;
    isPublic?: boolean;
  }): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Потрібна авторизація');

    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.postType !== undefined) payload.post_type = updates.postType;
    if (updates.routeFrom !== undefined) payload.route_from = updates.routeFrom;
    if (updates.routeTo !== undefined) payload.route_to = updates.routeTo;
    if (updates.meta !== undefined) payload.meta = updates.meta;
    if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;

    if (Object.keys(payload).length === 0) return;

    const { data, error } = await supabase
      .from('forum_posts')
      .update(payload)
      .eq('id', postId)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Немає прав або публікацію не знайдено');
    }
  },

  // ── DELETE POST (A5: .select('id') check) ─────────────────────────────────
  async deletePost(postId: string): Promise<void> {
    const { data, error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', postId)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Немає прав або публікацію не знайдено');
    }
  },

  // ── DELETE COMMENT ─────────────────────────────────────────────────────────
  async deleteComment(commentId: string): Promise<void> {
    const { data, error } = await supabase
      .from('forum_comments')
      .delete()
      .eq('id', commentId)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Немає прав або коментар не знайдено');
    }
  },

  // ── LIKE POST (VIA RPC INCREMENT_LIKES — toggle, auth-only) ─────────────────
  async likePost(postId: string): Promise<{ likesCount: number; likedBy: string[] }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('AUTH_REQUIRED');

    const { error } = await supabase.rpc('increment_likes', { post_id: postId });
    if (error) {
      console.warn('[connectFeedService.likePost] rpc error:', error.message);
      throw error;
    }

    // RPC returns void — re-fetch post to get actual state
    const { data: row } = await supabase
      .from('forum_posts')
      .select('likes_count, liked_by')
      .eq('id', postId)
      .maybeSingle();

    return {
      likesCount: Number(row?.likes_count || 0),
      likedBy: Array.isArray(row?.liked_by) ? row.liked_by : [],
    };
  },

  // ── INCREMENT VIEWS (B3: deduplicated per session) ─────────────────────────
  async incrementViews(postId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Check if client is a bot
    const userAgent = navigator.userAgent || '';
    const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(userAgent);
    if (isBot) return;

    // Deduplication via sessionStorage
    const sessionKey = `bc_viewed_${postId}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // storage unavailable
    }

    try {
      await supabase.rpc('increment_post_views', { target_post_id: postId });
    } catch (e) {
      // Soft failure for views
    }
  },

  // ── REPORT POST (A4: no reporter_id sent, 23505 handled) ───────────────────
  async reportPost(payload: ConnectReportPayload): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Потрібна авторизація для подання скарги');

    const { error } = await supabase
      .from('community_reports')
      .insert({
        post_id: payload.postId,
        reason: payload.reason,
        details: payload.details || null,
      });

    if (error) {
      if (error.code === '23505' || (error.message && error.message.includes('duplicate'))) {
        throw new Error('Ви вже надіслали скаргу на цю публікацію');
      }
      console.error('[connectFeedService.reportPost] error:', error);
      throw error;
    }
  },

  // ── COMMENTS (ADD & SUBSCRIBE) ─────────────────────────────────────────────
  async addComment(postId: string, content: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) throw new Error('Потрібна авторизація для коментування');

    const { data: userData } = await supabase
      .from('users')
      .select('firstName, lastName, email')
      .eq('uid', user.id)
      .maybeSingle();

    const authorName = userData?.firstName
      ? `${userData.firstName} ${userData.lastName || ''}`.trim()
      : (user.email?.split('@')[0] || 'Мандрівник');

    const commentId = 'CC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const { error, data } = await supabase
      .from('forum_comments')
      .insert({
        id: commentId,
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        content: content.trim(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || commentId;
  },

  subscribeToComments(postId: string, callback: (comments: ConnectComment[]) => void) {
    const fetch = () => {
      supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) {
            callback(data.map(row => ({
              id: String(row.id),
              postId: String(row.post_id),
              userId: String(row.user_id),
              authorName: row.author_name || 'Мандрівник',
              content: row.content || '',
              createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            })));
          }
        });
    };

    fetch();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_comments',
        filter: `post_id=eq.${postId}`,
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // ── REALTIME FEED SUBSCRIPTION (A2: only INSERT and DELETE, avoid update spam) ─
  subscribeToFeed(callback: () => void) {
    const channel = supabase
      .channel('public-connect-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, callback)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'forum_posts' }, callback)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  // ── ADMIN: UPDATE POST (D1: is_indexable, is_public, slug) ──────────────────
  async adminUpdatePost(postId: string, updates: {
    is_indexable?: boolean;
    is_public?: boolean;
    slug?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('forum_posts')
      .update(updates)
      .eq('id', postId);

    if (error) {
      if (error.code === '23505' || (error.message && error.message.includes('slug'))) {
        throw new Error('Такий slug вже існує');
      }
      throw error;
    }
  },

  // ── ADMIN: REPORTS (D2: list & change status) ──────────────────────────────
  async adminFetchReports(statusFilter?: string): Promise<any[]> {
    let query = supabase
      .from('community_reports')
      .select(`
        id,
        post_id,
        reporter_id,
        reason,
        details,
        status,
        created_at,
        reviewed_at,
        forum_posts (
          id,
          title,
          content,
          author_name,
          user_id,
          is_public,
          is_indexable,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[connectFeedService.adminFetchReports] error:', error);
      throw error;
    }
    return data || [];
  },

  async adminUpdateReportStatus(
    reportId: string, 
    status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  ): Promise<void> {
    const { error } = await supabase
      .from('community_reports')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) throw error;
  },
};
