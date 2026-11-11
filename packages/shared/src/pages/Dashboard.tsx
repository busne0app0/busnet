import { CommunityTab } from '@busnet/shared/components/dashboard/CommunityTab';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

// Layout & Tabs
import DashboardLayout from '../components/dashboard/DashboardLayout';
import OverviewTab from '../components/dashboard/OverviewTab';
import HistoryTab from '../components/dashboard/HistoryTab';
import TicketsTab from '../components/dashboard/TicketsTab';
import PassengersTab from '../components/dashboard/PassengersTab';
import BonusesTab from '../components/dashboard/BonusesTab';
import ProfileTab from '../components/dashboard/ProfileTab';
import SettingsTab from '../components/dashboard/SettingsTab';
import NotificationsTab from '../components/dashboard/NotificationsTab';
import ForumTab from '../components/dashboard/ForumTab';
import SupportTab from '../components/dashboard/SupportTab';
import SearchTab from '../components/dashboard/SearchTab';
import { getPostLoginTarget } from '../constants/roleRoutes';
import { useLanguage } from '../context/LanguageContext';

// Словник перекладу міст для карток квитків
const CITY_NAMES: Record<string, { UK: string; EN: string; IT: string }> = {
  'київ': { UK: 'Київ', EN: 'Kyiv', IT: 'Kiev' },
  'kyiv': { UK: 'Київ', EN: 'Kyiv', IT: 'Kiev' },
  'kiev': { UK: 'Київ', EN: 'Kyiv', IT: 'Kiev' },
  'мілан': { UK: 'Мілан', EN: 'Milan', IT: 'Milano' },
  'milan': { UK: 'Мілан', EN: 'Milan', IT: 'Milano' },
  'milano': { UK: 'Мілан', EN: 'Milan', IT: 'Milano' },
  'львів': { UK: 'Львів', EN: 'Lviv', IT: 'Leopoli' },
  'lviv': { UK: 'Львів', EN: 'Lviv', IT: 'Leopoli' },
  'варшава': { UK: 'Варшава', EN: 'Warsaw', IT: 'Varsavia' },
  'warsaw': { UK: 'Варшава', EN: 'Warsaw', IT: 'Varsavia' },
  'берлін': { UK: 'Берлін', EN: 'Berlin', IT: 'Berlino' },
  'berlin': { UK: 'Берлін', EN: 'Berlin', IT: 'Berlino' },
  'рим': { UK: 'Рим', EN: 'Rome', IT: 'Roma' },
  'rome': { UK: 'Рим', EN: 'Rome', IT: 'Roma' },
  'roma': { UK: 'Рим', EN: 'Rome', IT: 'Roma' },
  'болонья': { UK: 'Болонья', EN: 'Bologna', IT: 'Bologna' },
  'bologna': { UK: 'Болонья', EN: 'Bologna', IT: 'Bologna' },
  'одеса': { UK: 'Одеса', EN: 'Odesa', IT: 'Odessa' },
  'odesa': { UK: 'Одеса', EN: 'Odesa', IT: 'Odessa' },
  'прага': { UK: 'Прага', EN: 'Prague', IT: 'Praga' },
  'prague': { UK: 'Прага', EN: 'Prague', IT: 'Praga' },
};

function translateCityName(city: string | undefined, lang: string): string {
  if (!city) return '';
  const key = city.trim().toLowerCase();
  const upperLang = (lang || 'UK').toUpperCase() as 'UK' | 'EN' | 'IT';
  if (CITY_NAMES[key]) {
    return CITY_NAMES[key][upperLang] || city;
  }
  return city;
}

function formatSeatsCount(count: number, lang: string): string {
  const upperLang = (lang || 'UK').toUpperCase();
  if (upperLang === 'EN') {
    return count === 1 ? '1 seat' : `${count} seats`;
  }
  if (upperLang === 'IT') {
    return count === 1 ? '1 posto' : `${count} posti`;
  }
  // UK
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} місце`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} місця`;
  return `${count} місць`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { language, t: appT } = useLanguage();
  const currentLang = (language || 'UK').toUpperCase();

  const t = {
    overview: appT.dashboard?.tabs?.overview || (currentLang === 'EN' ? 'Overview' : currentLang === 'IT' ? 'Panoramica' : 'Огляд'),
    tickets: appT.dashboard?.tabs?.tickets || (currentLang === 'EN' ? 'My Tickets' : currentLang === 'IT' ? 'I Miei Biglietti' : 'Мої квитки'),
    passengers: appT.dashboard?.tabs?.passengers || (currentLang === 'EN' ? 'Passengers' : currentLang === 'IT' ? 'Passeggeri' : 'Пасажири'),
    bonuses: appT.dashboard?.tabs?.bonuses || (currentLang === 'EN' ? 'Bonus Points' : currentLang === 'IT' ? 'Punti Fedeltà' : 'Бонуси'),
    search: appT.dashboard?.tabs?.search || (currentLang === 'EN' ? 'Search Trips' : currentLang === 'IT' ? 'Cerca Corse' : 'Пошук'),
    notifications: appT.dashboard?.tabs?.notifications || (currentLang === 'EN' ? 'Notifications' : currentLang === 'IT' ? 'Notifiche' : 'Сповіщення'),
    support: appT.dashboard?.tabs?.support || (currentLang === 'EN' ? 'Support 24/7' : currentLang === 'IT' ? 'Assistenza 24/7' : 'Підтримка'),
    forum: appT.dashboard?.tabs?.forum || (currentLang === 'EN' ? 'Forum' : currentLang === 'IT' ? 'Forum' : 'Форум'),
    profile: appT.dashboard?.tabs?.profile || (currentLang === 'EN' ? 'Profile' : currentLang === 'IT' ? 'Profilo' : 'Профіль'),
    settings: appT.dashboard?.tabs?.settings || (currentLang === 'EN' ? 'Settings' : currentLang === 'IT' ? 'Impostazioni' : 'Налаштування'),
    history: appT.dashboard?.tabs?.history || (currentLang === 'EN' ? 'Trip History' : currentLang === 'IT' ? 'Storico Viaggi' : 'Історія'),
    sidebarMain: appT.dashboard?.sidebarMain || (currentLang === 'EN' ? 'Main' : currentLang === 'IT' ? 'Principale' : 'Головне'),
    sidebarService: appT.dashboard?.sidebarService || (currentLang === 'EN' ? 'Services' : currentLang === 'IT' ? 'Servizi' : 'Сервіс'),
    sidebarCommunity: appT.dashboard?.sidebarCommunity || (currentLang === 'EN' ? 'Community' : currentLang === 'IT' ? 'Comunità' : 'Спільнота'),
    sidebarAccount: appT.dashboard?.sidebarAccount || (currentLang === 'EN' ? 'Account' : currentLang === 'IT' ? 'Account' : 'Акаунт'),
    logout: appT.header?.logout || (currentLang === 'EN' ? 'Log out' : currentLang === 'IT' ? 'Esci' : 'Вийти з кабінету'),
    welcome: appT.dashboard?.welcome ? appT.dashboard.welcome('пасажире') : 'Привіт, пасажире!',
    cabinetSub: appT.dashboard?.subtitle || (
      currentLang === 'EN'
        ? 'Your personal Ukraine — Italy travel dashboard (BUSNET)'
        : currentLang === 'IT'
          ? 'La tua area personale per i viaggi Ucraina — Italia (BUSNET)'
          : 'Ваш пасажирський кабінет BUSNET (Україна — Італія)'
    ),
  };

  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const { addLog } = useAdminStore();

  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [realPassengers, setRealPassengers] = useState<any[]>([]);
  const [realForumPosts, setRealForumPosts] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const unreadCount = realNotifications.filter(n => !n.read).length;
  const activeTicketsCount = realBookings.filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'active').length;

  useEffect(() => {
    if (isAuthenticated && user) {
      const currentUid = (user as any).uid || (user as any).id;

      // 1. Завантаження квитків + Прив'язка гостьових замовлень
      const fetchBookings = async () => {
        setBookingsLoading(true);
        try {
          // Серверна прив'язка гостьових квитків через RPC (БЕЗ клієнтських обходів / 100% захист від IDOR)
          const rawClaims = JSON.parse(
            localStorage.getItem('busnet_guest_claims') ||
            localStorage.getItem('busnet_guest_bookings') ||
            '[]'
          );

          if (Array.isArray(rawClaims) && rawClaims.length > 0) {
            const userEmail = (user.email || '').toLowerCase().trim();
            const userPhone = ((user as any).phone || (user as any).user_metadata?.phone || '').replace(/\D/g, '');

            for (const item of rawClaims) {
              const bId = typeof item === 'string' ? item : item?.id;
              const bToken = typeof item === 'object' ? item?.token : null;
              if (!bId || typeof bId !== 'string') continue;

              try {
                const { data: claimed, error: rpcErr } = await supabase.rpc('claim_guest_booking', {
                  p_booking_id: bId,
                  p_claim_token: bToken || null,
                  p_user_phone: userPhone,
                  p_user_email: userEmail
                });

                if (rpcErr) {
                  console.warn('[Security] Claim booking RPC warning:', bId, rpcErr.message);
                }
              } catch (claimErr) {
                console.warn('[Security] Failed to claim guest booking via server RPC:', bId, claimErr);
              }
            }

            localStorage.removeItem('busnet_guest_claims');
            localStorage.removeItem('busnet_guest_bookings');
          }

          // Завантажуємо лише свої квитки
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', currentUid)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setRealBookings(data || []);
        } catch (err: any) {
          console.error("Error fetching bookings:", err);
        } finally {
          setBookingsLoading(false);
        }
      };

      // 2. Сповіщення Realtime
      const fetchNotifications = () => {
        const channelName = `notifs_${currentUid}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUid}`
          }, () => {
            supabase
              .from('notifications')
              .select('*')
              .eq('user_id', currentUid)
              .order('created_at', { ascending: false })
              .then(({ data }) => setRealNotifications(data || []));
          })
          .subscribe();

        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUid)
          .order('created_at', { ascending: false })
          .then(({ data }) => setRealNotifications(data || []));

        return () => {
          supabase.removeChannel(channel);
        };
      };

      // 3. Пасажири Realtime
      const fetchPassengers = () => {
        const channelName = `passengers_${currentUid}`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'passengers',
            filter: `user_id=eq.${currentUid}`
          }, () => {
            loadPassengersList();
          })
          .subscribe();

        const loadPassengersList = () => {
          supabase
            .from('passengers')
            .select('*')
            .eq('user_id', currentUid)
            .then(({ data }) => {
              const results = data || [];
              const hasPrimary = results.some((p: any) => p.role === 'Основний');
              if (!hasPrimary && user) {
                results.unshift({
                  id: 'primary',
                  name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Мій профіль',
                  role: 'Основний',
                  doc: 'Дані з профілю',
                  avatar: user.firstName?.[0] || 'U'
                });
              }
              setRealPassengers(results);
            });
        };

        loadPassengersList();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      // 4. Форум попутників Realtime
      const fetchForum = () => {
        const channelName = `forum_global`;
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'forum_posts'
          }, () => {
            supabase
              .from('forum_posts')
              .select('*')
              .order('created_at', { ascending: false })
              .then(({ data }) => setRealForumPosts(data || []));
          })
          .subscribe();

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

  const dateLocale = currentLang === 'EN' ? 'en-GB' : currentLang === 'IT' ? 'it-IT' : 'uk-UA';

  // ✅ ФІКС СТАТУСІВ: 'pending' та 'confirmed' — це АКТИВНІ поїздки!
  const userTickets = React.useMemo(() => {
    return realBookings.map((b: any) => {
      const rawStatus = (b.status || '').toLowerCase();
      let normalizedStatus = 'unknown';
      if (['confirmed', 'pending', 'active'].includes(rawStatus)) {
        normalizedStatus = 'active';
      } else if (['completed', 'finished'].includes(rawStatus)) {
        normalizedStatus = 'completed';
      } else if (['cancelled', 'canceled'].includes(rawStatus)) {
        normalizedStatus = 'cancelled';
      } else if (rawStatus === 'refunded') {
        normalizedStatus = 'refunded';
      }

      const fromRaw = b.route_from || b.departureCity || 'Київ';
      const toRaw = b.route_to || b.arrivalCity || 'Рим'; // повернено дефолтний 'Рим'
      const fromCity = translateCityName(fromRaw, currentLang);
      const toCity = translateCityName(toRaw, currentLang);
      const seatsCount = Array.isArray(b.passengers) ? b.passengers.length : (b.seats || 1);

      return {
        id: b.id,
        route: `${fromCity} → ${toCity}`,
        fromCity,
        toCity,
        status: normalizedStatus,
        date: b.departure_date
          ? new Date(b.departure_date).toLocaleDateString(dateLocale)
          : (b.created_at ? new Date(b.created_at).toLocaleDateString(dateLocale) : 'В обробці'),
        time: b.departure_time || '08:00',
        duration: b.arrival_time || 'Наступний день',
        seats: formatSeatsCount(seatsCount, currentLang),
        price: b.total_price || 0,
        currency: b.currency || '€', // повернено дефолтне '€'
        carrier: b.carrier_name || 'BUSNET Carrier'
      };
    });
  }, [realBookings, currentLang, dateLocale]);

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
      author: p.author_name || p.author || 'Пасажир',
      text: p.content || p.title,
      content: p.content || p.title,
      tag: p.category || p.tag || 'Поради',
      likes: p.likes_count ?? p.likes ?? 0,
      comments: p.comments || 0,
      likedBy: p.liked_by || [],
      time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Зараз'
    }));
  }, [realForumPosts]);

  // Авторизація
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [err, setErr] = useState('');

  const handleLogout = () => {
    const confirmText = currentLang === 'EN' ? 'Log out of your cabinet?' : currentLang === 'IT' ? "Uscire dall'area personale?" : 'Вийти з кабінету?';
    if (confirm(confirmText)) {
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
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: row } = await supabase
          .from('users')
          .select('status')
          .eq('uid', authData.user.id)
          .maybeSingle();

        if (row?.status === 'deleted') {
          await supabase.auth.signOut({ scope: 'global' });
          logout();
          throw new Error(
            currentLang === 'EN' ? 'This account has been closed'
              : currentLang === 'IT' ? 'Questo account è stato chiuso'
                : 'Цей акаунт закрито'
          );
        }
      }

      const checkRoleAndRedirect = async () => {
        const start = Date.now();
        const check = () => {
          const state = useAuthStore.getState();
          if (!state.loading && state.user) {
            const role = state.user.role as string;
            if (role && role !== 'passenger' && role !== 'user') {
              const t = getPostLoginTarget(role);
              if (!t.error && t.shouldRedirect) {
                window.location.assign(t.url);
              }
              return;
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
        obj: 'Успішний вхід у кабінет пасажира',
        icon: '🔑'
      });
    } catch (error: any) {
      setErr(error.message || 'Невірний email або пароль');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [notifs, setNotifs] = useState(() => {
    const defaults = { email: true, sms: true, push: false, marketing: false };
    try {
      const saved = localStorage.getItem('busnet_notifs');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  // ✅ ФІКС СКАСУВАННЯ: Серверне скасування суворо через cancel_booking RPC
  const handleCancelTicket = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: ticketId
      });

      if (error) {
        throw new Error(error.message || 'Сервер відхилив скасування квитка');
      }

      setRealBookings(prev => prev.map(b => b.id === ticketId ? { ...b, status: 'cancelled' } : b));
      toast.success(currentLang === 'EN' ? 'Booking successfully cancelled' : currentLang === 'IT' ? 'Prenotazione cancellata' : 'Бронювання успішно скасовано');
    } catch (error: any) {
      console.error("Error cancelling ticket:", error);
      toast.error(error.message || 'Помилка скасування квитка');
      throw error;
    }
  };

  // ✅ ФІКС ФОРУМУ: Лайки з перевіркою liked_by та likes_count
  const handleLike = async (id: string) => {
    if (!user) return;
    const currentUid = (user as any).uid || (user as any).id;
    try {
      const post = realForumPosts.find(p => p.id === id);
      const currentLikedBy = post?.liked_by || [];
      if (currentLikedBy.includes(currentUid)) {
        toast.error(currentLang === 'EN' ? 'You have already liked this' : currentLang === 'IT' ? 'Hai già aggiunto un mi piace' : 'Ви вже поставили реакцію');
        return;
      }
      const newCount = (post?.likes_count ?? post?.likes ?? 0) + 1;
      const newLikedBy = [...currentLikedBy, currentUid];

      await supabase
        .from('forum_posts')
        .update({
          likes_count: newCount,
          liked_by: newLikedBy
        })
        .eq('id', id);

      setRealForumPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: newCount, likes: newCount, liked_by: newLikedBy } : p));
      toast.success(currentLang === 'EN' ? 'Thanks for your reaction!' : currentLang === 'IT' ? 'Grazie per il tuo feedback!' : 'Дякуємо за вашу реакцію!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePost = async (content: string, tag: string = 'Поради') => {
    if (!user || !content.trim()) return;
    const currentUid = (user as any).uid || (user as any).id;
    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: currentUid,
          author_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Пасажир',
          content,
          category: tag,
          likes_count: 0,
          comments: 0,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(currentLang === 'EN' ? 'Post published!' : currentLang === 'IT' ? 'Post pubblicato!' : 'Ваш допис опубліковано на форумі!');
    } catch (err: any) {
      toast.error('Не вдалося опублікувати допис');
    }
  };

  // ✅ ФІКС ДОДАВАННЯ ПАСАЖИРА: UUID + повна схема Supabase
  const handleAddPassenger = async (name: string, docNum: string) => {
    if (!user) return;
    const currentUid = (user as any).uid || (user as any).id;
    try {
      const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase
        .from('passengers')
        .insert({
          ...(newId ? { id: newId } : {}),
          user_id: currentUid,
          name: name.trim(),
          first_name: firstName,
          last_name: lastName,
          role: 'Пасажир',
          doc: `Паспорт: ${docNum}`,
          avatar: firstName[0] || 'U',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(currentLang === 'EN' ? 'Passenger added!' : currentLang === 'IT' ? 'Passeggero aggiunto!' : 'Пасажира додано!');
    } catch (e) {
      toast.error('Помилка збереження даних');
    }
  };

  const handleDeletePassenger = async (id: string) => {
    if (id === 'primary') return;
    const confirmDel = currentLang === 'EN' ? 'Delete this passenger?' : currentLang === 'IT' ? 'Eliminare questo passeggero?' : 'Видалити дані цього пасажира?';
    if (confirm(confirmDel)) {
      try {
        const { error } = await supabase
          .from('passengers')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success(currentLang === 'EN' ? 'Passenger deleted' : currentLang === 'IT' ? 'Passeggero eliminato' : 'Пасажира видалено');
      } catch (e) {
        toast.error('Помилка видалення');
      }
    }
  };

  const handleSearch = (from: string, to: string, date: string) => {
    if (!from || !to) {
      toast.error(currentLang === 'EN' ? 'Specify departure and arrival cities' : currentLang === 'IT' ? 'Indica città di partenza e arrivo' : 'Вкажіть звідки та куди їдемо');
      return;
    }
    navigate(`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center mb-4">
              <LogIn size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {currentLang === 'EN' ? 'Sign In' : currentLang === 'IT' ? 'Accedi' : 'Вхід до кабінету'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 text-center">
              {currentLang === 'EN' ? 'Manage your bookings to Italy' : currentLang === 'IT' ? 'Gestisci le tue prenotazioni per l\'Italia' : 'Керуйте бронюваннями на рейси до Італії'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-400 outline-none transition-all text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">
                {currentLang === 'EN' ? 'Password' : currentLang === 'IT' ? 'Password' : 'Пароль'}
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-400 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {err && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                {err}
              </div>
            )}

            <button
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer mt-2"
            >
              {isLoggingIn
                ? (currentLang === 'EN' ? 'Signing in...' : currentLang === 'IT' ? 'Accesso...' : 'Авторизація...')
                : (currentLang === 'EN' ? 'Sign In to Cabinet' : currentLang === 'IT' ? 'Accedi all\'area personale' : 'Увійти в кабінет')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              ← {currentLang === 'EN' ? 'Back to Trip Search' : currentLang === 'IT' ? 'Torna alla ricerca' : 'Повернутися до пошуку квитків'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          transition={{ duration: 0.2 }}
          className="pb-16 md:pb-0"
        >
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} tickets={userTickets} passengersCount={realPassengers.length} />}
          {activeTab === 'tickets' && <TicketsTab tickets={userTickets} onCancelTicket={handleCancelTicket} setActiveTab={setActiveTab} />}
          {activeTab === 'history' && <HistoryTab tickets={userTickets} loading={bookingsLoading} setActiveTab={setActiveTab} />}
          {activeTab === 'passengers' && <PassengersTab passengers={realPassengers} onDelete={handleDeletePassenger} onAdd={handleAddPassenger} />}
          {activeTab === 'search' && <SearchTab searchResults={null} handleSearch={handleSearch} />}
          {activeTab === 'bonuses' && <BonusesTab tickets={userTickets} />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'settings' && <SettingsTab notifs={notifs} setNotifs={setNotifs} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'forum' && (
            <CommunityTab
              onNavigateToTicket={(from, to) => {
                setActiveTab('search');
              }}
            />
          )}
          {activeTab === 'support' && <SupportTab />}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}