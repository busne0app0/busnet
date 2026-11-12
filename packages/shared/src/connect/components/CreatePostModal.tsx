import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Image, 
  MapPin, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ConnectPostType } from '../types/connect.types';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title?: string;
    content: string;
    category: string;
    postType: ConnectPostType;
    imageUrl?: string;
    routeFrom?: string;
    routeTo?: string;
    meta?: Record<string, any>;
    isPublic?: boolean;
  }) => Promise<any>;
  isSubmitting?: boolean;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [postType, setPostType] = useState<ConnectPostType>('blog');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Specific meta attributes
  const [parcelWeight, setParcelWeight] = useState('');
  const [parcelReward, setParcelReward] = useState('');
  const [buddySeats, setBuddySeats] = useState<number>(1);
  const [checkpoint, setCheckpoint] = useState('');
  const [checkpointHours, setCheckpointHours] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Будь ласка, введіть текст публікації');
      return;
    }

    const meta: Record<string, any> = {};
    if (postType === 'parcel') {
      if (parcelWeight) meta.parcelWeight = parcelWeight;
      if (parcelReward) meta.parcelReward = parcelReward;
    } else if (postType === 'buddy') {
      meta.buddySeats = Number(buddySeats) || 1;
    } else if (postType === 'border') {
      if (checkpoint) meta.checkpoint = checkpoint;
      if (checkpointHours) meta.checkpointWaitHours = parseFloat(checkpointHours) || 0;
    }

    const categoryNames: Record<ConnectPostType, string> = {
      blog: 'Історії мандрівників',
      buddy: 'Пошук попутників',
      parcel: 'Посилки та передачі',
      border: 'Кордон Live',
      review: 'Відгуки про рейси',
      tips: 'Поради',
      questions: 'Питання та відповіді',
      news: 'Новини',
      general: 'Загальне',
    };

    try {
      await onSubmit({
        title: title.trim() || undefined,
        content: content.trim(),
        category: categoryNames[postType] || 'Загальне',
        postType,
        imageUrl: imageUrl.trim() || undefined,
        routeFrom: routeFrom.trim() || undefined,
        routeTo: routeTo.trim() || undefined,
        meta,
        isPublic,
      });
      onClose();
    } catch (err) {
      // Error handled by store toast
    }
  };

  const types: { id: ConnectPostType; label: string; icon: any }[] = [
    { id: 'blog', label: 'Історія / Блог', icon: Sparkles },
    { id: 'buddy', label: 'Попутники', icon: Users },
    { id: 'parcel', label: 'Посилка', icon: Package },
    { id: 'border', label: 'Кордон Live', icon: AlertTriangle },
    { id: 'tips', label: 'Порада', icon: CheckCircle2 },
    { id: 'questions', label: 'Запитання', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0e1627] border border-cyan-500/25 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a101d]">
          <div className="flex items-center space-x-2">
            <span className="font-black text-lg text-white">Створити публікацію</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              CONNECT
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Тип публікації
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {types.map(t => {
                const Icon = t.icon;
                const isSelected = postType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPostType(t.id)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all text-left
                      ${isSelected 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(0,212,255,0.2)]' 
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'}
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Fields (If applicable) */}
          {(postType === 'buddy' || postType === 'parcel' || postType === 'border' || postType === 'blog') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Звідки (Місто / Країна)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={routeFrom}
                    onChange={(e) => setRouteFrom(e.target.value)}
                    placeholder="Напр. Київ або Рим"
                    className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Куди (Місто / Країна)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={routeTo}
                    onChange={(e) => setRouteTo(e.target.value)}
                    placeholder="Напр. Мілан або Варшава"
                    className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Type-Specific Fields */}
          {postType === 'parcel' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <div>
                <label className="block text-[11px] font-medium text-amber-300 mb-1">Орієнтовна вага</label>
                <input
                  type="text"
                  value={parcelWeight}
                  onChange={(e) => setParcelWeight(e.target.value)}
                  placeholder="Напр. до 2 кг, документи"
                  className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-amber-300 mb-1">Винагорода (опціонально)</label>
                <input
                  type="text"
                  value={parcelReward}
                  onChange={(e) => setParcelReward(e.target.value)}
                  placeholder="Напр. 25 €, договірна"
                  className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {postType === 'buddy' && (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <label className="block text-[11px] font-medium text-emerald-300 mb-1">Кількість місць для попутників</label>
              <input
                type="number"
                min={1}
                max={8}
                value={buddySeats}
                onChange={(e) => setBuddySeats(Number(e.target.value))}
                className="w-32 bg-[#0b1220] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          )}

          {postType === 'border' && (
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
              <div className="text-[11px] text-rose-300">
                ⚠️ Ваша інформація про чергу на кордоні маркується як «Повідомлення мандрівника» із фіксацією точного часу.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={checkpoint}
                  onChange={(e) => setCheckpoint(e.target.value)}
                  placeholder="Пункт пропуску (напр. Краківець)"
                  className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
                <input
                  type="number"
                  step="0.5"
                  value={checkpointHours}
                  onChange={(e) => setCheckpointHours(e.target.value)}
                  placeholder="Час очікування в годинах"
                  className="w-full bg-[#0b1220] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Заголовок (опціонально)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Короткий опис теми..."
              maxLength={120}
              className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Текст публікації <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Поділіться вашим досвідом, маршрутом чи запитанням..."
              className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Image URL input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Фотографія (URL посилання)
            </label>
            <div className="relative">
              <Image className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Public / Private Toggle (B4) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Публічна публікація</div>
              <div className="text-[11px] text-slate-400">
                {isPublic 
                  ? 'Публікацію бачать усі відвідувачі спільноти' 
                  : 'Приватна: доступна лише вам у вкладці «Мої дописи»'}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Rate Limit & Policy Note */}
          <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
            💡 Задля захисту від спаму діє серверний ліміт — 1 публікація на хвилину. Публікація зберігається в BUSNET CONNECT. Для захисту пошукового простору Google індексація відкривається після модерації.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Публікується...' : 'Опублікувати'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

