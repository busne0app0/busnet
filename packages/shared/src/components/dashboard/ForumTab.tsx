import React, { useState, useMemo } from 'react';
import { Search, Plus, Heart, MessageSquare, ArrowUpRight, X, Image as ImageIcon, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

interface ForumPost {
  id: string;
  author: string;
  text: string;
  likes: number;
  comments: number;
  tag: string;
}

interface ForumTabProps {
  forumPosts: ForumPost[];
  handleLike: (id: string) => void;
}

const ForumTab: React.FC<ForumTabProps> = ({ forumPosts, handleLike }) => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Всі теми');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('Поради');
  const [isPosting, setIsPosting] = useState(false);

  const filteredPosts = useMemo(() => {
    return forumPosts.filter(p => {
      const matchSearch = p.text.toLowerCase().includes(search.toLowerCase()) || 
                          p.author.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat === 'Всі теми' || p.tag.toLowerCase() === activeCat.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [forumPosts, search, activeCat]);

  const handleCreatePost = async () => {
    if (!newPostText.trim() || !user) return;
    setIsPosting(true);
    try {
      const { error } = await supabase.from('forum_posts').insert({
        id: `PST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        authorId: user.uid,
        author: `${user.firstName} ${user.lastName || ''}`.trim(),
        title: newPostText.slice(0, 50),
        content: newPostText,
        tag: newPostTag,
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      toast.success('Пост опубліковано!');
      setNewPostText('');
      setShowNewPostModal(false);
    } catch (e) {
      toast.error('Помилка публікації');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Спільнота Busnet</h2>
          <p className="text-sm text-[#7a9ab5]">Діліться досвідом та запитуйте поради у мандрівників</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a6a85]" size={16} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук тем..." 
              className="pl-12 pr-4 py-3 bg-[#141c2e] border border-[#1e3a5f] rounded-2xl text-xs text-white focus:border-[#00c8ff] outline-none w-full transition-all" 
            />
          </div>
          <button 
            onClick={() => setShowNewPostModal(true)}
            className="p-3.5 bg-[#00c8ff] text-black rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar no-scrollbar text-white">
        {['Всі теми', 'Поради', 'Маршрути', 'Правила', 'Відгуки', 'Допомога'].map((cat, i) => (
          <button 
            key={i} 
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
              ${activeCat === cat ? 'bg-white text-black border-white' : 'bg-white/5 text-[#7a9ab5] border-white/10 hover:border-white/20'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPosts.map((post, i) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#141c2e] border border-[#1e3a5f] rounded-3xl p-6 hover:border-[#00c8ff]/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <ArrowUpRight size={20} className="text-[#00c8ff]" />
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1e2a40] to-[#141c2e] flex items-center justify-center text-[12px] font-black border border-white/5 text-[#00c8ff] uppercase">
                  {post.author.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-[#00c8ff] transition-colors">{post.author}</p>
                  <p className="text-[10px] text-[#4a6a85] font-black uppercase tracking-widest">Сьогодні о 11:20 · <span className="text-white/40">Загальне</span></p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/5 backdrop-blur-md text-[9px] font-black uppercase rounded-full border border-white/10 text-white transition-all group-hover:border-[#00c8ff]/40">
                🚀 {post.tag}
              </span>
            </div>

            <h4 className="text-lg font-bold text-white leading-relaxed mb-6 group-hover:translate-x-1 transition-transform">{post.text}</h4>

            <div className="flex items-center gap-8 border-t border-white/5 pt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7a9ab5] hover:text-[#f44336] transition-all active:scale-125"
              >
                <Heart 
                  size={16} 
                  className={post.likes > 24 ? 'fill-red-500 text-red-500' : 'group-hover:text-red-400'} 
                /> 
                <span className={post.likes > 24 ? 'text-white' : ''}>{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#7a9ab5] hover:text-[#00c8ff] transition-all">
                <MessageSquare size={16} className="group-hover:text-[#00c8ff]" /> 
                <span>{post.comments} Відповідей</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showNewPostModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowNewPostModal(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="relative w-full max-w-lg bg-[#141c2e] border border-[#1e3a5f] rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent" />
               <button 
                 onClick={() => setShowNewPostModal(false)}
                 className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
               >
                 <X size={24} />
               </button>

               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#00c8ff]/10 flex items-center justify-center text-[#00c8ff] border border-[#00c8ff]/20">
                     <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Нова тема</h2>
                    <p className="text-[10px] text-[#7a9ab5] font-black uppercase tracking-widest">Будьте ввічливі до спільноти</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-[#4a6a85] uppercase tracking-widest block mb-2 pl-1">Категорія</label>
                    <div className="flex flex-wrap gap-2">
                       {['Поради', 'Маршрути', 'Правила', 'Відгуки', 'Допомога'].map(tag => (
                         <button 
                           key={tag}
                           onClick={() => setNewPostTag(tag)}
                           className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border 
                             ${newPostTag === tag ? 'bg-[#00c8ff] text-black border-[#00c8ff]' : 'bg-white/5 text-[#7a9ab5] border-white/10 hover:border-white/20'}`}
                         >
                           {tag}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#4a6a85] uppercase tracking-widest block mb-2 pl-1">Повідомлення</label>
                    <textarea 
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder="Опишіть ваше питання або поділіться досвідом..."
                      className="w-full h-32 bg-black/40 border border-[#1e3a5f] rounded-2xl p-4 text-sm text-white focus:border-[#00c8ff] outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                     <button className="flex items-center gap-2 text-[#4a6a85] hover:text-[#00c8ff] transition-all">
                        <Paperclip size={18} />
                        <span className="text-[9px] font-black uppercase">Файл</span>
                     </button>
                     <button className="flex items-center gap-2 text-[#4a6a85] hover:text-[#00c8ff] transition-all">
                        <ImageIcon size={18} />
                        <span className="text-[9px] font-black uppercase">Фото</span>
                     </button>
                  </div>

                  <button 
                    onClick={handleCreatePost}
                    disabled={isPosting || !newPostText.trim()}
                    className="w-full py-4 bg-[#00c8ff] text-black text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_10px_30px_rgba(0,200,255,0.3)] disabled:opacity-50"
                  >
                    {isPosting ? 'Публікація...' : 'Опублікувати тему'}
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
