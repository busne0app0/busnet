import React, { useState } from 'react';
import { 
  User as UserIcon, CheckCircle2, Bookmark, FileText, MapPin, 
  Award, Shield, Edit3, Globe, Send, Instagram, Lock, 
  Share2, Camera, Sparkles, Heart, MessageSquare, ExternalLink
} from 'lucide-react';
import { ConnectPost } from '../../types/connect.types';
import { PostCard } from '../PostCard';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

interface ProfileViewProps {
  posts: ConnectPost[];
  savedPostIds: string[];
  onLike: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onOpenComments: (post: ConnectPost) => void;
  onDeletePost: (postId: string) => void;
  onNavigateToBooking?: (from: string, to: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  posts,
  savedPostIds,
  onLike,
  onToggleSave,
  onOpenComments,
  onDeletePost,
  onNavigateToBooking,
}) => {
  const { user, isAuthenticated, updateUserProfile } = useAuthStore();
  const [profileTab, setProfileTab] = useState<'my_posts' | 'saved' | 'private'>('my_posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for profile editing (Instagram-like)
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || user?.address || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const myPublicPosts = user ? posts.filter(p => p.userId === user.uid && p.isPublic !== false) : [];
  const myPrivatePosts = user ? posts.filter(p => p.userId === user.uid && p.isPublic === false) : [];
  const savedPosts = posts.filter(p => savedPostIds.includes(p.id));

  const totalLikes = myPublicPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.email?.split('@')[0] || 'Мандрівник BUSNET');

  const initials = (
    (user?.firstName?.[0] || user?.email?.[0] || 'U') +
    (user?.lastName?.[0] || '')
  ).toUpperCase();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        website: website.trim(),
        instagram: instagram.trim().replace(/^@/, ''),
        telegram: telegram.trim().replace(/^@/, ''),
        avatar: avatarUrl.trim() || undefined,
      });
      setIsEditing(false);
      toast.success('Профіль успішно оновлено!');
    } catch (err: any) {
      toast.error(err.message || 'Помилка оновлення профілю');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyProfileLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Посилання на профіль скопійовано');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── INSTAGRAM-STYLE PROFILE HEADER CARD ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c182d] via-[#091122] to-[#060a14] border border-cyan-500/25 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
          {/* Avatar with status ring */}
          <div className="relative group">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={fullName} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-cyan-400 p-0.5 shadow-[0_0_25px_rgba(0,212,255,0.35)]" 
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-slate-800 border-2 border-cyan-400/50 flex items-center justify-center font-black text-3xl text-cyan-300 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                {initials}
              </div>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg transition-transform hover:scale-110"
              title="Змінити аватар або дані"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Bio Details */}
          <div className="space-y-2.5 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white">{fullName}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Мандрівник BUSNET
              </span>
            </div>

            {/* City / Location */}
            {(user?.city || user?.address) && (
              <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.city || user.address}</span>
              </div>
            )}

            {/* Custom Bio Description */}
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed whitespace-pre-line">
              {user?.bio || 'Мандрівник у просторі BUSNET CONNECT. Ділюся враженнями від поїздок Україна — Італія — ЄС, допомагаю попутникам та відстежую ситуацію на кордоні.'}
            </p>

            {/* Social Links (Instagram, Telegram, Web) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
              {user?.instagram && (
                <a
                  href={`https://instagram.com/${user.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-pink-400 hover:text-pink-300 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20"
                >
                  <Instagram className="w-3 h-3" />
                  <span>@{user.instagram}</span>
                </a>
              )}
              {user?.telegram && (
                <a
                  href={`https://t.me/${user.telegram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20"
                >
                  <Send className="w-3 h-3" />
                  <span>@{user.telegram}</span>
                </a>
              )}
              {user?.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                >
                  <Globe className="w-3 h-3" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {/* Stats Counter Bar (Instagram style: Posts, Likes, Saved, Points) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs pt-2 border-t border-slate-800/80">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">{myPublicPosts.length}</span>
                <span className="text-slate-400">дописів</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white">{totalLikes}</span>
                <span className="text-slate-400">вподобань</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">{savedPosts.length}</span>
                <span className="text-slate-400">закладок</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{user?.loyaltyPoints || 100}</span>
                <span className="text-slate-400">бонусів</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center sm:justify-start space-x-2 pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center space-x-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Редагувати профіль</span>
              </button>
              <button
                onClick={handleCopyProfileLink}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Поділитися профілем"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0e1627] border border-cyan-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a101d]">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span className="text-white">Редагування профілю</span>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Ім'я</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    placeholder="Ваше ім'я"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Прізвище</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                    placeholder="Прізвище"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Аватар (URL картинки)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Місто проживання / Маршрут</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="Мілан, Рим, Львів, Київ..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Опис профілю (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={250}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-400 resize-none leading-relaxed"
                  placeholder="Розкажіть трохи про себе, ваші подорожі чи чим можете бути корисні іншим..."
                />
                <div className="text-[10px] text-slate-500 text-right">{bio.length}/250</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Instagram (нікнейм)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">@</span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full bg-[#080d17] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white outline-none focus:border-cyan-400"
                      placeholder="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Telegram (нікнейм)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">@</span>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full bg-[#080d17] border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white outline-none focus:border-cyan-400"
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Веб-сайт або посилання</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-[#080d17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TABS: FEED SECTIONS (My Posts, Private Posts, Saved) ── */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setProfileTab('my_posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            profileTab === 'my_posts'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Мої публікації ({myPublicPosts.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('private')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            profileTab === 'private'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Приватні дописи ({myPrivatePosts.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('saved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
            profileTab === 'saved'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Збережені закладки ({savedPosts.length})</span>
        </button>
      </div>

      {/* ── POSTS LIST ── */}
      <div className="space-y-4">
        {profileTab === 'my_posts' && (
          myPublicPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас поки немає публічних дописів. Поділіться своєю першою історією в розділі «Спільнота»!
            </div>
          ) : (
            myPublicPosts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={savedPostIds.includes(p.id)}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onDelete={onDeletePost}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))
          )
        )}

        {profileTab === 'private' && (
          myPrivatePosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас немає приватних публікацій. При створенні допису ви можете вимкнути тумблер «Публічна публікація», і допис бачитимете лише ви.
            </div>
          ) : (
            myPrivatePosts.map(p => (
              <div key={p.id} className="relative">
                <div className="mb-1 text-[10px] text-amber-400 font-bold flex items-center space-x-1 pl-2">
                  <Lock className="w-3 h-3" />
                  <span>Приватний допис (не відображається в загальній стрічці)</span>
                </div>
                <PostCard
                  post={p}
                  isSaved={savedPostIds.includes(p.id)}
                  onLike={onLike}
                  onToggleSave={onToggleSave}
                  onOpenComments={onOpenComments}
                  onDelete={onDeletePost}
                  onNavigateToBooking={onNavigateToBooking}
                />
              </div>
            ))
          )
        )}

        {profileTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0c1424] rounded-2xl border border-slate-800">
              У вас немає збережених публікацій. Натисніть на значок закладки в будь-якому дописі, щоб зберегти його тут.
            </div>
          ) : (
            savedPosts.map(p => (
              <PostCard
                key={p.id}
                post={p}
                isSaved={true}
                onLike={onLike}
                onToggleSave={onToggleSave}
                onOpenComments={onOpenComments}
                onDelete={onDeletePost}
                onNavigateToBooking={onNavigateToBooking}
              />
            ))
          )
        )}
      </div>
    </div>
  );
};
