import React, { useState, useEffect } from 'react';
import { 
  Globe, Flag, Search, CheckCircle2, XCircle, 
  ExternalLink, Shield, AlertTriangle, Eye, EyeOff, 
  RefreshCw, Check, X, Filter
} from 'lucide-react';
import { supabase } from '@busnet/shared/supabase/config';
import { connectFeedService } from '@busnet/shared/connect/services/connectFeedService';
import toast from 'react-hot-toast';

export const ConnectAdminTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'posts' | 'reports'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSlugPostId, setEditingSlugPostId] = useState<string | null>(null);
  const [slugDraft, setSlugDraft] = useState('');

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${q},content.ilike.${q},category.ilike.${q}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (e: any) {
      toast.error('Помилка завантаження публікацій');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await connectFeedService.adminFetchReports(reportFilter);
      setReports(data || []);
    } catch (e: any) {
      toast.error('Помилка завантаження скарг');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'posts') {
      loadPosts();
    } else {
      loadReports();
    }
  }, [activeSection, reportFilter]);

  // D1: Toggle is_indexable
  const handleToggleIndexable = async (post: any) => {
    const nextVal = !post.is_indexable;
    try {
      await connectFeedService.adminUpdatePost(post.id, { is_indexable: nextVal });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_indexable: nextVal } : p));
      toast.success(nextVal ? 'Індексацію в Google увімкнено' : 'Індексацію вимкнено (noindex)');
    } catch (e: any) {
      toast.error('Помилка оновлення індексації');
    }
  };

  // D1: Toggle is_public
  const handleTogglePublic = async (post: any) => {
    const nextVal = !post.is_public;
    try {
      await connectFeedService.adminUpdatePost(post.id, { is_public: nextVal });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_public: nextVal } : p));
      toast.success(nextVal ? 'Публікація тепер публічна' : 'Публікацію приховано (приватна)');
    } catch (e: any) {
      toast.error('Помилка зміни видимості');
    }
  };

  // S5: Edit slug with unique error handling
  const handleSaveSlug = async (postId: string) => {
    if (!slugDraft.trim()) return;
    try {
      await connectFeedService.adminUpdatePost(postId, { slug: slugDraft.trim() });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, slug: slugDraft.trim() } : p));
      setEditingSlugPostId(null);
      toast.success('Slug успішно оновлено');
    } catch (e: any) {
      toast.error(e.message || 'Не вдалося зберегти slug');
    }
  };

  // D2: Update report status
  const handleReportAction = async (reportId: string, status: 'reviewed' | 'dismissed' | 'action_taken') => {
    try {
      await connectFeedService.adminUpdateReportStatus(reportId, status);
      toast.success(`Статус скарги змінено: ${status}`);
      loadReports();
    } catch (e: any) {
      toast.error('Не вдалося оновити статус скарги');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-black text-white">Модерація BUSNET CONNECT</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Керування індексацією Google (SEO), публічністю публікацій та розгляд скарг спільноти
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSection('posts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSection === 'posts'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Публікації ({posts.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSection === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Скарги</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: POSTS & SEO CONTROLS */}
      {activeSection === 'posts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                placeholder="Пошук публікацій за назвою, вмістом..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={loadPosts}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Оновити"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0a101d]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1627] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Автор / Допис</th>
                  <th className="p-3.5">Тип</th>
                  <th className="p-3.5">Slug (SEO)</th>
                  <th className="p-3.5 text-center">Індексація Google</th>
                  <th className="p-3.5 text-center">Публічність</th>
                  <th className="p-3.5 text-right">Статистика</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Завантаження публікацій...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Публікацій не знайдено
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-white truncate">{post.title || 'Без назви'}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{post.content}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {post.author_name} • {new Date(post.created_at).toLocaleDateString('uk-UA')}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          {post.post_type || 'general'}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        {editingSlugPostId === post.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={slugDraft}
                              onChange={(e) => setSlugDraft(e.target.value)}
                              className="bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-[11px] text-white w-full"
                            />
                            <button
                              onClick={() => handleSaveSlug(post.id)}
                              className="p-1 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                              title="Зберегти"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingSlugPostId(null)}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="Скасувати"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingSlugPostId(post.id);
                              setSlugDraft(post.slug || '');
                            }}
                            className="font-mono text-[11px] text-cyan-400 hover:underline cursor-pointer truncate"
                            title="Натисніть для редагування slug"
                          >
                            {post.slug || '— задати —'}
                          </div>
                        )}
                      </td>

                      {/* D1: is_indexable toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleIndexable(post)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            post.is_indexable
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-slate-800/80 text-slate-500 border-slate-700'
                          }`}
                        >
                          {post.is_indexable ? 'INDEX (Вкл)' : 'NOINDEX (Вимк)'}
                        </button>
                      </td>

                      {/* D1: is_public toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleTogglePublic(post)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            post.is_public !== false
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {post.is_public !== false ? 'Публічний' : 'Прихований'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right font-mono text-[11px] text-slate-400">
                        ❤️ {post.likes_count || 0} • 💬 {post.comments || 0} • 👁️ {post.views_count || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: REPORTS MANAGEMENT (D2) */}
      {activeSection === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold">Фільтр статусу:</span>
            {['pending', 'reviewed', 'action_taken', 'dismissed', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setReportFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  reportFilter === st
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {st === 'pending' ? 'Очікують розгляду' : 
                 st === 'reviewed' ? 'Переглянуто' : 
                 st === 'action_taken' ? 'Вжито заходів' : 
                 st === 'dismissed' ? 'Відхилено' : 'Всі'}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0a101d]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1627] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Дата</th>
                  <th className="p-3.5">Причина скарги</th>
                  <th className="p-3.5">Деталі / Пояснення</th>
                  <th className="p-3.5">Публікація, на яку поскаржились</th>
                  <th className="p-3.5">Статус</th>
                  <th className="p-3.5 text-right">Дії модератора</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Завантаження скарг...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Скарг у цій категорії немає
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => {
                    const post = r.forum_posts;
                    return (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {r.reason}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs text-slate-300">
                          {r.details || '—'}
                        </td>

                        <td className="p-3.5 max-w-xs">
                          {post ? (
                            <div>
                              <div className="font-bold text-white truncate">{post.title || 'Допис'}</div>
                              <div className="text-[10px] text-slate-400 truncate">{post.content}</div>
                              <a
                                href={`/connect/post/${post.slug || post.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-cyan-400 hover:underline inline-flex items-center space-x-1 mt-0.5"
                              >
                                <span>Відкрити публікацію</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Публікацію видалено</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            r.status === 'action_taken' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                            r.status === 'dismissed' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {r.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleReportAction(r.id, 'action_taken')}
                            className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-[10px] font-bold"
                            title="Вжити заходів (порушення підтверджено)"
                          >
                            Заходи
                          </button>
                          <button
                            onClick={() => handleReportAction(r.id, 'dismissed')}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 text-[10px]"
                            title="Відхилити скаргу (хибна)"
                          >
                            Відхилити
                          </button>
                          <button
                            onClick={() => handleReportAction(r.id, 'reviewed')}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-bold"
                            title="Позначити переглянутою"
                          >
                            Переглянуто
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectAdminTab;

