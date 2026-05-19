/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, X, Bus, Users, DollarSign, 
  Settings, ExternalLink, GripVertical, 
  Trash2, Save, Link as LinkIcon, Globe,
  MessageCircle, Search, Terminal, Volume2, VolumeX,
  Compass, FileText, Bell, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

// --- Types & Interfaces ---
interface QuickAction {
  id: string;
  label: string;
  path: string;
  iconType: 'bus' | 'users' | 'money' | 'globe' | 'settings' | 'file' | 'chat';
  isExternal: boolean;
  color?: string;
}

const ICON_MAP = {
  bus: <Bus size={15} />,
  users: <Users size={15} />,
  money: <DollarSign size={15} />,
  globe: <Globe size={15} />,
  settings: <Settings size={15} />,
  file: <FileText size={15} />,
  chat: <MessageCircle size={15} />
};

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: '1', label: 'Трекінг LIVE', path: '/livetrips', iconType: 'bus', isExternal: false, color: '#00E5FF' },
  { id: '2', label: 'Бронювання', path: '/bookings', iconType: 'users', isExternal: false, color: '#A855F7' },
  { id: '3', label: 'Фінанси & Звіти', path: '/finance', iconType: 'money', isExternal: false, color: '#10B981' },
];

export default function BusnetNexus() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto snap configuration
  const [dockEdge, setDockEdge] = useState<'left' | 'right'>('right');
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Dynamic role coloring
  const roleColor = user?.role === 'carrier' ? '#00E5FF' :
                    user?.role === 'admin' ? '#F87171' :
                    user?.role === 'agent' ? '#10B981' :
                    user?.role === 'driver' ? '#F59E0B' : '#7C3AED';

  const roleGlow = user?.role === 'carrier' ? 'shadow-[0_0_25px_rgba(0,229,255,0.25)] border-[#00E5FF]/40' :
                   user?.role === 'admin' ? 'shadow-[0_0_25px_rgba(248,113,113,0.25)] border-[#F87171]/40' :
                   user?.role === 'agent' ? 'shadow-[0_0_25px_rgba(16,185,129,0.25)] border-[#10B981]/40' :
                   user?.role === 'driver' ? 'shadow-[0_0_25px_rgba(245,158,11,0.25)] border-[#F59E0B]/40' :
                   'shadow-[0_0_25px_rgba(124,58,237,0.25)] border-[#7C3AED]/40';

  const [actions, setActions] = useState<QuickAction[]>(() => {
    const saved = localStorage.getItem(`busnet_nexus_actions_${user?.uid || 'guest'}`);
    return saved ? JSON.parse(saved) : DEFAULT_ACTIONS;
  });

  const [newAction, setNewAction] = useState({ label: '', path: '', iconType: 'globe' as any });

  // Web Audio Synth for Futuristic Sounds
  const playSynthSound = (type: 'hover' | 'click' | 'dock' | 'success') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'dock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Web Audio synthesis failed:', e);
    }
  };

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        playSynthSound('click');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Context-aware automatic recommendation
  const getContextRecommendation = (): QuickAction | null => {
    const path = location.pathname;
    if (path.includes('finance') || path.includes('invoices')) {
      return {
        id: 'rec-finance',
        label: 'Скачати фінансовий звіт',
        path: '#download-report',
        iconType: 'file',
        isExternal: false,
        color: '#10B981'
      };
    }
    if (path.includes('livetrips')) {
      return {
        id: 'rec-emergency',
        label: '🚨 Терміновий SOS водію',
        path: '#sos',
        iconType: 'chat',
        isExternal: false,
        color: '#EF4444'
      };
    }
    if (path.includes('bookings') || path.includes('schedule')) {
      return {
        id: 'rec-bookings',
        label: 'Експорт маніфесту пасажирів',
        path: '#export-manifest',
        iconType: 'users',
        isExternal: false,
        color: '#F59E0B'
      };
    }
    return null;
  };

  const recommendation = getContextRecommendation();

  // Add Custom Action
  const addAction = () => {
    if (!newAction.label || !newAction.path) {
      toast.error('Заповніть усі обов\'язкові поля');
      return;
    }
    const action: QuickAction = {
      id: Date.now().toString(),
      label: newAction.label,
      path: newAction.path,
      iconType: newAction.iconType,
      isExternal: newAction.path.startsWith('http'),
      color: roleColor
    };
    const updated = [...actions, action];
    setActions(updated);
    localStorage.setItem(`busnet_nexus_actions_${user?.uid || 'guest'}`, JSON.stringify(updated));
    setIsAdding(false);
    setNewAction({ label: '', path: '', iconType: 'globe' });
    playSynthSound('success');
    toast.success('Дію успішно додано до Nexus');
  };

  // Remove Action
  const removeAction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = actions.filter(a => a.id !== id);
    setActions(updated);
    localStorage.setItem(`busnet_nexus_actions_${user?.uid || 'guest'}`, JSON.stringify(updated));
    playSynthSound('click');
    toast.success('Дію видалено');
  };

  // Click Action Handler
  const handleActionClick = (action: QuickAction) => {
    playSynthSound('click');
    if (action.path.startsWith('#')) {
      // Internal quick commands
      if (action.path === '#download-report') {
        toast.success('Генерація фінансового звіту... Скачування почнеться за мить');
      } else if (action.path === '#sos') {
        toast.error('🚨 Сигнал тривоги SOS розіслано всім активним водіям на лініях!');
      } else if (action.path === '#export-manifest') {
        toast.success('Маніфест пасажирів завантажено у форматі PDF/CSV');
      }
    } else {
      if (action.isExternal) {
        window.open(action.path, '_blank');
      } else {
        navigate(action.path);
        setIsOpen(false);
      }
    }
  };

  // Filter actions based on command search
  const filteredActions = actions.filter(a => 
    a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Absolute boundary overlay for drag constraints */}
      <div 
        ref={dragConstraintsRef} 
        className="fixed inset-6 pointer-events-none z-[9998]"
      />

      <div 
        ref={containerRef}
        className="fixed z-[9999] pointer-events-none inset-0 overflow-hidden font-syne"
      >
        <motion.div
          drag
          dragConstraints={dragConstraintsRef}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const isRight = info.point.x > window.innerWidth / 2;
            setDockEdge(isRight ? 'right' : 'left');
            playSynthSound('dock');
          }}
          initial={{ x: window.innerWidth - 100, y: window.innerHeight - 150 }}
          className="absolute pointer-events-auto flex flex-col items-center"
          style={{ touchAction: 'none' }}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`absolute bottom-20 ${dockEdge === 'right' ? 'right-0' : 'left-0'} w-80 bg-[#0B1221]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full animate-pulse" 
                      style={{ backgroundColor: roleColor, boxShadow: `0 0 10px ${roleColor}` }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5A6A85]">
                      Nexus Command
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Sound Switcher */}
                    <button 
                      onClick={() => setSoundEnabled(!soundEnabled)} 
                      className="text-white/20 hover:text-white/60 p-1 rounded-lg transition-colors"
                      title={soundEnabled ? "Вимкнути звук" : "Увімкнути звук"}
                    >
                      {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    </button>
                    
                    <button 
                      onClick={() => setIsOpen(false)} 
                      className="text-white/20 hover:text-white transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Command Mini Search */}
                <div className="relative mb-4">
                  <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Пошук швидких команд... (Ctrl+K)"
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white placeholder-white/25 focus:outline-none focus:border-white/10 font-medium tracking-wide transition-all"
                  />
                </div>

                {/* Context Recommendation Banner */}
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleActionClick(recommendation)}
                    className="mb-4 p-3 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/[0.05] transition-all group"
                  >
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white border"
                      style={{ 
                        backgroundColor: `${recommendation.color}15`, 
                        borderColor: `${recommendation.color}35` 
                      }}
                    >
                      {ICON_MAP[recommendation.iconType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] font-black uppercase tracking-widest text-[#5A6A85]">
                        Розумна рекомендація
                      </p>
                      <p className="text-[10px] font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {recommendation.label}
                      </p>
                    </div>
                    <Zap size={11} className="text-[#F59E0B] animate-bounce" />
                  </motion.div>
                )}

                {/* Action List */}
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  {filteredActions.length === 0 ? (
                    <div className="py-6 text-center text-[10px] text-[#5A6A85] uppercase tracking-widest font-bold">
                      Нічого не знайдено
                    </div>
                  ) : (
                    filteredActions.map((action) => (
                      <div key={action.id} className="group relative">
                        <motion.button
                          whileHover={{ x: 3, backgroundColor: 'rgba(255,255,255,0.02)' }}
                          onMouseEnter={() => playSynthSound('hover')}
                          onClick={() => handleActionClick(action)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left border border-transparent hover:border-white/5 transition-all"
                        >
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white border transition-all duration-300"
                            style={{ 
                              backgroundColor: `${action.color || roleColor}15`, 
                              borderColor: `${action.color || roleColor}20` 
                            }}
                          >
                            {ICON_MAP[action.iconType]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                              {action.label}
                            </p>
                            <p className="text-[7px] text-[#5A6A85] font-mono truncate">
                              {action.path}
                            </p>
                          </div>
                          {action.isExternal && <ExternalLink size={9} className="text-[#5A6A85] shrink-0" />}
                        </motion.button>
                        
                        <button 
                          onClick={(e) => removeAction(action.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rose-500/0 group-hover:text-rose-500/40 hover:text-rose-500 transition-all"
                          title="Видалити команду"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Add Section */}
                  <AnimatePresence>
                    {isAdding ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3"
                      >
                        <input 
                          placeholder="Назва кнопки..."
                          value={newAction.label}
                          onChange={e => setNewAction({...newAction, label: e.target.value})}
                          className="w-full bg-transparent border-b border-white/10 text-[10px] py-1 outline-none text-white focus:border-[#00E5FF] transition-all font-medium placeholder-white/20"
                        />
                        <input 
                          placeholder="Шлях або URL..."
                          value={newAction.path}
                          onChange={e => setNewAction({...newAction, path: e.target.value})}
                          className="w-full bg-transparent border-b border-white/10 text-[10px] py-1 outline-none text-white focus:border-[#00E5FF] transition-all font-medium placeholder-white/20"
                        />
                        <div className="flex justify-between items-center pt-1">
                          <div className="flex gap-1.5">
                            {(['bus', 'users', 'money', 'globe'] as const).map(type => (
                              <button 
                                key={type}
                                onClick={() => setNewAction({...newAction, iconType: type})}
                                className={`p-1.5 rounded-lg border transition-all ${newAction.iconType === type ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-white/5 text-[#5A6A85]'}`}
                              >
                                {ICON_MAP[type]}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => setIsAdding(false)} 
                              className="p-1.5 border border-white/5 rounded-lg text-[#5A6A85] text-[9px] font-black uppercase tracking-widest hover:text-white"
                            >
                              Скасувати
                            </button>
                            <button 
                              onClick={addAction} 
                              className="p-1.5 rounded-lg hover:scale-105 transition-all text-black font-bold flex items-center justify-center"
                              style={{ backgroundColor: roleColor }}
                            >
                              <Save size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={() => { setIsAdding(true); playSynthSound('click'); }}
                        className="w-full py-2.5 mt-2 border border-dashed border-white/5 rounded-2xl text-[9px] font-black text-[#5A6A85] uppercase tracking-[0.2em] hover:border-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus size={11} /> Додати команду
                      </button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Drag Handle & Shortcuts info */}
                <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1 text-[8px] text-[#5A6A85] uppercase tracking-wider font-semibold">
                    <Terminal size={10} />
                    <span>Ctrl + K</span>
                  </div>
                  <GripVertical size={14} className="text-white/10 cursor-grab active:cursor-grabbing hover:text-white/30 transition-colors" />
                  <div className="text-[7px] text-[#5A6A85] uppercase tracking-widest font-semibold font-mono">
                    Ver 4.1
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Trigger Orb */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => playSynthSound('hover')}
            onClick={() => {
              setIsOpen(prev => !prev);
              playSynthSound('click');
            }}
            className={`w-14 h-14 rounded-[22px] flex items-center justify-center relative shadow-2xl transition-all duration-500 overflow-hidden ${
              isOpen 
              ? 'bg-white text-black border-transparent' 
              : `bg-[#0B1221] border ${roleGlow} text-white`
            }`}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div 
                  key="close" 
                  initial={{ rotate: -90, opacity: 0 }} 
                  animate={{ rotate: 0, opacity: 1 }} 
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div 
                  key="open" 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  exit={{ scale: 0 }} 
                  transition={{ duration: 0.2 }}
                  className="relative flex items-center justify-center"
                >
                  <Zap size={20} fill={roleColor} style={{ color: roleColor }} className="relative z-10" />
                  {/* Internal ambient glowing pulse */}
                  <div 
                    className="absolute inset-0 blur-xl opacity-30 animate-pulse rounded-full" 
                    style={{ backgroundColor: roleColor }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Border radial overlay */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <rect 
                x="2" y="2" width="52" height="52" rx="19"
                fill="none" 
                stroke={isOpen ? '#ffffff' : roleColor} 
                strokeWidth="1.5" 
                strokeDasharray="210"
                strokeDashoffset={isOpen ? 0 : 210}
                className="transition-all duration-700 ease-in-out opacity-25"
              />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}
