import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { useBookingStore } from '../store/useBookingStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, UserCheck, History } from 'lucide-react';
import { Booking } from '../types';

// Layout & Tabs
import DashboardLayout from '../components/dashboard/DashboardLayout';
import OverviewTab from '../components/dashboard/OverviewTab';
import HistoryTab from '../components/dashboard/HistoryTab';

// ... (Rest of imports remain the same)
import TicketsTab from '../components/dashboard/TicketsTab';
import PassengersTab from '../components/dashboard/PassengersTab';
import BonusesTab from '../components/dashboard/BonusesTab';
import ProfileTab from '../components/dashboard/ProfileTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import NotificationsTab from '../components/dashboard/NotificationsTab';
import ForumTab from '../components/dashboard/ForumTab';
import SupportTab from '../components/dashboard/SupportTab';
import SearchTab from '../components/dashboard/SearchTab';



// --- ТРАНСЛЕЙТИ ---
const translations = {
  ua: {
    overview: 'Огляд',
    tickets: 'Мої квитки',
    passengers: 'Пасажири',
    bonuses: 'Бонуси',
    search: 'Пошук',
    notifications: 'Сповіщення',
    support: 'Підтримка',
    forum: 'Форум',
    profile: 'Профіль',
    settings: 'Налаштування',
    history: 'Історія',
    logout: 'Вийти з кабінету',
    welcome: 'Привіт, пасажире!',
    cabinetSub: 'Ваш пасажирський кабінет BUSNET UA',
    promoTitle: '-20% на рейси до Варшави',
    promoSub: 'Дійсно до 30 квітня 2026 р.',
  },
  en: {
    overview: 'Overview',
    tickets: 'My Tickets',
    passengers: 'Passengers',
    bonuses: 'Bonuses',
    search: 'Search',
    notifications: 'Notifications',
    support: 'Support',
    forum: 'Forum',
    profile: 'Profile',
    settings: 'Settings',
    history: 'History',
    logout: 'Logout',
    welcome: 'Hello, Passenger!',
    cabinetSub: 'Your BUSNET UA passenger cabinet',
    promoTitle: '-20% off Warsaw trips',
    promoSub: 'Valid until April 30, 2026',
  }
};

import toast from 'react-hot-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lang] = useState('ua'); 
  const t = translations[lang as keyof typeof translations];
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, loading: authLoading } = useAuthStore();
  const { addLog } = useAdminStore();

  const [realBookings, setRealBookings] = useState<Booking[]>([]);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [realPassengers, setRealPassengers] = useState<any[]>([]);
  const [realForumPosts, setRealForumPosts] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const unreadCount = realNotifications.filter(n => !n.read).length;
  const activeTicketsCount = realBookings.filter(b => b.status === 'confirmed').length;

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchBookings = async () => {
        setBookingsLoading(true);
        try {
          const { data, error } = await supabase
            .from('bookings')
            // JOIN з trips — отримуємо дані маршруту для старих бронювань без routeFrom/routeTo
            .select('*, trips(departureCity, arrivalCity, departureDate, departureTime, arrivalTime, carrierName)')
            .eq('userId', user.uid)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setRealBookings(data || []);
        } catch (err: any) {
          console.error("Error fetching bookings:", err);
        } finally {
          setBookingsLoading(false);
        }
      };

      const fetchNotifications = () => {
        // Статична назва каналу — без Date.now() щоб не накопичувались підписки
        const channelName = `notifs_${user.uid}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${user.uid}`
          }, (payload) => {
            // Refetch notifications on change
            supabase
              .from('notifications')
              .select('*')
              .eq('userId', user.uid)
              .order('created_at', { ascending: false })
              .then(({ data }) => setRealNotifications(data || []));
          })
          .subscribe();

        // Initial fetch
        supabase
          .from('notifications')
          .select('*')
          .eq('userId', user.uid)
          .order('created_at', { ascending: false })
          .then(({ data }) => setRealNotifications(data || []));

        return () => {
          supabase.removeChannel(channel);
        };
      };

      const fetchPassengers = () => {
        // Статична назва каналу — без Date.now()
        const channelName = `passengers_${user.uid}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'passengers',
            filter: `userId=eq.${user.uid}`
          }, (payload) => {
            // Refetch passengers on change
            supabase
              .from('passengers')
              .select('*')
              .eq('userId', user.uid)
              .then(({ data }) => {
                const results = data || [];
                // Add primary passenger (user) if not present
                const hasPrimary = results.some((p: any) => p.role === 'Основний');
                if (!hasPrimary && user) {
                  results.unshift({
                     id: 'primary',
                     name: `${user.firstName} ${user.lastName}`,
                     role: 'Основний',
                     doc: 'Дані з профілю',
                     avatar: user.firstName?.[0] || 'U'
                  });
                }
                setRealPassengers(results);
              });
          })
          .subscribe();

        // Initial fetch
        supabase
          .from('passengers')
          .select('*')
          .eq('userId', user.uid)
          .then(({ data }) => {
            const results = data || [];
            // Add primary passenger (user) if not present
            const hasPrimary = results.some((p: any) => p.role === 'Основний');
            if (!hasPrimary && user) {
              results.unshift({
                 id: 'primary',
                 name: `${user.firstName} ${user.lastName}`,
                 role: 'Основний',
                 doc: 'Дані з профілю',
                 avatar: user.firstName?.[0] || 'U'
              });
            }
            setRealPassengers(results);
          });

        return () => {
          supabase.removeChannel(channel);
        };
      };

      const fetchForum = () => {
        // Статична назва каналу — форум спільний для всіх
        const channelName = `forum_global`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'forum_posts'
          }, (payload) => {
            // Refetch forum posts on change
            supabase
              .from('forum_posts')
              .select('*')
              .order('created_at', { ascending: false })
              .then(({ data }) => setRealForumPosts(data || []));
          })
          .subscribe();

        // Initial fetch
        supabase
          .from('forum_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => setRealForumPosts(data || []));

        return () => {
          supabase.removeChannel(channel);
        };
      };

      fetchBookings();
      const unsubNotifs = fetchNotifications();
      const unsubPassengers = fetchPassengers();
      const unsubForum = fetchForum();

      return () => {
        unsubNotifs();
        unsubPassengers();
        unsubForum();
      };
    }
  }, [isAuthenticated, user]);

  const userTickets = React.useMemo(() => {
    return realBookings.map((b: any) => ({
      id: b.id,
      // Використовуємо routeFrom/routeTo (дублюються при бронюванні)
      // або trips-joined fields якщо є, fallback 'Маршрут'
      route: `${b.routeFrom || b.departureCity || b.trips?.departureCity || 'Звідси'} → ${b.routeTo || b.arrivalCity || b.trips?.arrivalCity || 'Туди'}`,
      status: b.status === 'confirmed' ? 'active' : b.status === 'cancelled' ? 'cancelled' : 'completed',
      date: b.departureDate
        ? new Date(b.departureDate).toLocaleDateString('uk-UA')
        : (b.createdAt ? new Date(b.createdAt).toLocaleDateString('uk-UA') : 'В обробці'),
      time: b.departureTime || '—',
      duration: b.arrivalTime || '—',
      seats: `${b.seats || b.passengers?.length || 1} місць`,
      price: b.totalPrice,
      carrier: b.carrierName || 'Busnet Carrier'
    }));
  }, [realBookings]);

  const dashboardNotifications = React.useMemo(() => {
    return realNotifications.map((n: any) => ({
      id: n.id,
      type: n.title?.toLowerCase().includes('квит') || n.title?.toLowerCase().includes('брон') ? 'bus' : 'info',
      text: n.message || n.title,
      time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Зараз',
      unread: !n.read
    }));
  }, [realNotifications]);

  const dashboardForumPosts = React.useMemo(() => {
    return realForumPosts.map((p: any) => ({
      id: p.id,
      author: p.author || 'Користувач',
      text: p.content || p.title,
      tag: p.tag || 'Поради',
      likes: p.likes || 0,
      comments: p.comments || 0,
      time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Зараз'
    }));
  }, [realForumPosts]);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [err, setErr] = useState('');

  const handleLogout = () => {
    if (confirm('Вийти з кабінету?')) {
      logout();
      navigate('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErr('');
    
    try {
      await login(email, password);
      
      // ✅ ФІКС: Одразу після логіну чекаємо роль і редіректимо
      // Це потрібно, якщо адмін помилково логіниться через форму пасажира
      const checkRoleAndRedirect = async () => {
        const start = Date.now();
        const check = () => {
          const state = useAuthStore.getState();
          if (!state.loading && state.user) {
            const roleRoutes: Record<string, string> = {
              admin: '/admin/',
              carrier: '/carrier/',
              agent: '/agent/',
              driver: '/driver/',
              passenger: '/dashboard',
            };
            const target = roleRoutes[state.user.role];
            if (target && target !== '/dashboard') {
              window.location.href = target;
            }
            return;
          }
          if (Date.now() - start < 5000) {
            setTimeout(check, 200);
          }
        };
        check();
      };
      
      checkRoleAndRedirect();

      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: email,
        role: 'passenger',
        action: 'LOGIN',
        obj: 'Passenger cabinet login attempt',
        icon: '🔑'
      });
    } catch (error: any) {
      setErr(error.message || 'Невірний email або пароль');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- INTERACTIVE STATE ---
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: false, marketing: false });
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const handleCancelTicket = async (ticketId: string) => {
    try {
      // 1. Отримуємо дані бронювання щоб знати tripId та кількість місць
      const bookingToCancel = realBookings.find(b => b.id === ticketId) as any;
      
      // 2. Скасовуємо бронювання
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', ticketId);

      if (error) throw error;

      // 3. Повертаємо місця на рейс — без цього місця залишаються зайнятими в БД
      if (bookingToCancel?.tripId) {
        const seatsToReturn = bookingToCancel.passengers?.length || 1;
        // Читаємо поточне значення seatsBooked
        const { data: tripData } = await supabase
          .from('trips')
          .select('seatsBooked')
          .eq('id', bookingToCancel.tripId)
          .single();
        
        if (tripData) {
          await supabase
            .from('trips')
            .update({ seatsBooked: Math.max(0, (tripData.seatsBooked || 0) - seatsToReturn) })
            .eq('id', bookingToCancel.tripId);
        }
      }

      setRealBookings(prev => prev.map(b => b.id === ticketId ? { ...b, status: 'cancelled' } : b));
      toast.success('Білет скасовано');
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      toast.error('Помилка скасування');
      throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        {/* BG Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-600/10 via-transparent to-transparent -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-[160px] -z-10 animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-cyan-500/20">
               <LogIn size={28} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Вхід до кабінету</h2>
            <p className="text-[#7a9ab5] text-xs font-bold uppercase tracking-widest text-center">Отримайте доступ до квитків та бонусів</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Мій Email</label>
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-cyan-400 outline-none transition-all font-bold placeholder:text-slate-600"
                    placeholder="email@example.com"
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Мій Пароль</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-cyan-400 outline-none transition-all font-bold placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
               </div>
            </div>

            {err && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold"
              >
                {err}
              </motion.div>
            )}

            <button 
              disabled={isLoggingIn}
              className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Авторизація...' : (
                <>
                  Увійти <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Ще не маєте квитка?</p>
             <button 
               onClick={() => navigate('/booking')}
               className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00c8ff] hover:text-white transition-colors"
             >
               Придбати та зареєструватися →
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleLike = async (id: string) => {
    if (!user) return;
    // Перевіряємо чи юзер вже лайкнув цей пост
    const post = realForumPosts.find((p: any) => p.id === id) as any;
    if (post?.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(user.uid)) {
      toast.error('Ви вже лайкнули цей допис');
      return;
    }
    try {
      const { error } = await supabase.rpc('increment_likes', { post_id: id });
      if (error) throw error;
    } catch (e) { console.error(e); }
  };

  const handleDeletePassenger = async (id: string) => {
    if (id === 'primary') return;
    if (confirm('Видалити дані цього пасажира?')) {
      try {
        const { error } = await supabase
          .from('passengers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Пасажира видалено');
      } catch (e) {
        toast.error('Помилка видалення');
      }
    }
  };

  const handleAddPassenger = async (name: string, docNum: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('passengers')
        .insert({
          id: `PAS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          userId: user.uid,
          name,
          role: 'Пасажир',
          doc: `Паспорт: ${docNum}`,
          avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Пасажира додано!');

      addLog({
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: user?.email || 'User',
        role: 'passenger',
        action: 'CREATE',
        obj: `Додано пасажира: ${name}`,
        icon: '👤'
      });
    } catch (e) {
      toast.error('Помилка збереження');
    }
  };

  const handleSearch = (from: string, to: string, date: string) => {
    if (!from || !to) {
      toast.error('Вкажіть звідки та куди їдемо');
      return;
    }
    // Редіректуємо на головну з query params — SearchWidget автозаповнить поля
    // /booking без selectedTrip одразу редіректить на '/' і ігнорує params
    navigate(`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      t={t} 
      handleLogout={handleLogout}
      unreadCount={unreadCount}
      activeTicketsCount={activeTicketsCount}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="pb-20 md:pb-0"
        >
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} tickets={userTickets} passengersCount={realPassengers.length} />}
          {activeTab === 'tickets' && <TicketsTab tickets={userTickets} onCancelTicket={handleCancelTicket} setActiveTab={setActiveTab} />}
          {activeTab === 'history' && <HistoryTab tickets={userTickets} />}
          {activeTab === 'passengers' && <PassengersTab passengers={realPassengers} onDelete={handleDeletePassenger} onAdd={handleAddPassenger} />}
          {activeTab === 'search' && <SearchTab searchResults={searchResults} handleSearch={handleSearch} />}
          {activeTab === 'bonuses' && <BonusesTab tickets={userTickets} />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'settings' && <SettingsTab notifs={notifs} setNotifs={setNotifs} />}
          {activeTab === 'notifications' && <NotificationsTab notifications={dashboardNotifications} />}
          {activeTab === 'forum' && <ForumTab forumPosts={dashboardForumPosts} handleLike={handleLike} />}
          {activeTab === 'support' && <SupportTab />}

          {/* Fallback for history handled above */}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
