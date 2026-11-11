import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  AlertTriangle,
  Inbox,
  RotateCcw,
  RefreshCw,
  LogIn,
  WifiOff,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@busnet/shared/supabase/config';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

export type Locale = 'uk' | 'en' | 'it';
export type NotificationCategory = 'trip' | 'payment' | 'system' | 'offer';
export type NotificationPriority = 'critical' | 'important' | 'normal' | 'marketing';

// --------------------------------------------------------------------------
// 1. СТРОГАЯ ДИСКРИМИНИРОВАННАЯ ТИПИЗАЦИЯ ШАБЛОНОВ
// --------------------------------------------------------------------------
export interface TripRescheduledParams {
  route?: string;
  old_time?: string;
  new_time?: string;
}

export interface TripCancelledParams {
  route?: string;
  date?: string;
}

export interface BookingConfirmedParams {
  booking_id?: string;
  route?: string;
}

export interface PaymentSuccessParams {
  amount?: string;
}

export interface BonusCreditedParams {
  points?: number;
}

export interface SystemSecurityParams {
  device?: string;
  location?: string;
}

export interface TemplateDataMap {
  trip_rescheduled: TripRescheduledParams;
  trip_cancelled: TripCancelledParams;
  booking_confirmed: BookingConfirmedParams;
  payment_success: PaymentSuccessParams;
  bonus_credited: BonusCreditedParams;
  system_security: SystemSecurityParams;
}

export type TemplateId = keyof TemplateDataMap;

export interface NotificationItem {
  id: string;
  user_id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  template_id?: TemplateId;
  params?: Record<string, unknown>;
  title?: string;
  message?: string;
  action_url?: string;
  action_label_key?: string;
  read: boolean;
  read_at?: string | null;
  created_at: string;
}

interface NotificationsTabProps {
  initialNotifications?: NotificationItem[];
  isLoading?: boolean;
  locale?: Locale;
  onNavigate?: (url: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

// --------------------------------------------------------------------------
// 2. БЕЗОПАСНОСТЬ: ВАЛИДАТОР МАРШРУТОВ И БЕЛЫЙ СПИСОК QUERY-ПАРАМЕТРОВ
// --------------------------------------------------------------------------
const ALLOWED_PATH_ROOTS = [
  '/cabinet/passenger/tickets',
  '/cabinet/passenger/profile',
  '/cabinet/passenger/loyalty',
  '/cabinet/passenger/history',
  '/checkout',
  '/tickets',
  '/orders',
] as const;

const ALLOWED_QUERY_KEYS = new Set(['id', 'booking_id', 'ticket_id', 'tab', 'filter', 'date', 'from', 'to']);

function sanitizeActionUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();

  // Строго запрещаем protocol-relative (//), абсолютные URL, обратные слеши и управляющие символы
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }

  // Защита от управляющих символов и CRLF
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, 'https://busnet.internal');

    if (parsed.origin !== 'https://busnet.internal') {
      return null;
    }

    const pathname = parsed.pathname;

    // Проверка соответствия корням маршрутов с контролем границ сегментов
    const isAllowedRoot = ALLOWED_PATH_ROOTS.some(
      (root) => pathname === root || pathname.startsWith(`${root}/`)
    );

    if (!isAllowedRoot) return null;

    // Фильтрация query-параметров с ограничением длины значений
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      const lowerKey = key.toLowerCase();
      if (
        ALLOWED_QUERY_KEYS.has(lowerKey) &&
        value.length <= 128 &&
        !/^(https?:|\/\/|javascript:)/i.test(value)
      ) {
        cleanParams.append(lowerKey, value);
      }
    }

    const queryString = cleanParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------------
// 3. РЕЕСТР ПЕРЕВОДОВ ДЕЙСТВИЙ
// --------------------------------------------------------------------------
const ACTION_KEYS_DICT: Record<Locale, Record<string, string>> = {
  uk: {
    view_ticket: 'Переглянути квиток',
    open_booking: 'До бронювання',
    view_receipt: 'Переглянути чек',
    refund_status: 'Статус повернення',
    loyalty_balance: 'Бонусний рахунок',
    account_security: 'Безпека облікового запису',
    contact_support: 'Зв’язатися з підтримкою',
    default: 'Детальніше',
  },
  en: {
    view_ticket: 'View ticket',
    open_booking: 'Open booking',
    view_receipt: 'View receipt',
    refund_status: 'Refund status',
    loyalty_balance: 'Loyalty balance',
    account_security: 'Security settings',
    contact_support: 'Contact support',
    default: 'Details',
  },
  it: {
    view_ticket: 'Mostra biglietto',
    open_booking: 'Apri prenotazione',
    view_receipt: 'Vedi ricevuta',
    refund_status: 'Stato rimborso',
    loyalty_balance: 'Saldo punti',
    account_security: 'Sicurezza profilo',
    contact_support: 'Contatta assistenza',
    default: 'Dettagli',
  },
};

// --------------------------------------------------------------------------
// 4. ТИПИЗИРОВАННЫЕ ШАБЛОНЫ (БЕЗ ANY)
// --------------------------------------------------------------------------
interface TemplateFormatter<T> {
  title: (p: T) => string;
  message: (p: T) => string;
  actionLabelKey?: string;
}

type TemplateRegistry = {
  [K in TemplateId]: TemplateFormatter<TemplateDataMap[K]>;
};

const TEMPLATES: Record<Locale, TemplateRegistry> = {
  uk: {
    trip_rescheduled: {
      title: () => 'Зміна часу відправлення',
      message: (p) =>
        `Рейс ${p.route || ''} вирушає о ${p.new_time || '—'} замість запланованого ${p.old_time || '—'}. Місце посадки без змін.`,
      actionLabelKey: 'view_ticket',
    },
    trip_cancelled: {
      title: () => 'Рейс скасовано перевізником',
      message: (p) =>
        `Рейс ${p.route || ''} на ${p.date || ''} скасовано. Кошти повертаються автоматично.`,
      actionLabelKey: 'refund_status',
    },
    booking_confirmed: {
      title: (p) => `Бронювання підтверджено #${p.booking_id || ''}`,
      message: (p) =>
        `Квиток на рейс ${p.route || ''} оформлено. Посадковий талон готовий.`,
      actionLabelKey: 'view_ticket',
    },
    payment_success: {
      title: () => 'Оплату успішно здійснено',
      message: (p) =>
        `Транзакція на суму ${p.amount || ''} пройшла успішно. Чек сформовано.`,
      actionLabelKey: 'view_receipt',
    },
    bonus_credited: {
      title: () => 'Нараховано бонуси BUSNET Club',
      message: (p) =>
        `Вам нараховано +${p.points || 0} балів за поїздку. Використовуйте для знижок.`,
      actionLabelKey: 'loyalty_balance',
    },
    system_security: {
      title: () => 'Новий вхід у профіль',
      message: (p) =>
        `Вхід із пристрою ${p.device || 'невідомий'} (${p.location || 'Європа'}).`,
      actionLabelKey: 'account_security',
    },
  },
  en: {
    trip_rescheduled: {
      title: () => 'Departure Rescheduled',
      message: (p) =>
        `Service ${p.route || ''} departs at ${p.new_time || '—'} instead of ${p.old_time || '—'}. Platform unchanged.`,
      actionLabelKey: 'view_ticket',
    },
    trip_cancelled: {
      title: () => 'Service Cancelled by Carrier',
      message: (p) =>
        `Service ${p.route || ''} on ${p.date || ''} was cancelled. Refund in progress.`,
      actionLabelKey: 'refund_status',
    },
    booking_confirmed: {
      title: (p) => `Booking Confirmed #${p.booking_id || ''}`,
      message: (p) =>
        `Your ticket for ${p.route || ''} is issued and ready for boarding.`,
      actionLabelKey: 'view_ticket',
    },
    payment_success: {
      title: () => 'Payment Successful',
      message: (p) =>
        `Payment of ${p.amount || ''} completed successfully. Receipt available.`,
      actionLabelKey: 'view_receipt',
    },
    bonus_credited: {
      title: () => 'BUSNET Club Points Earned',
      message: (p) =>
        `You have earned +${p.points || 0} loyalty points for your journey.`,
      actionLabelKey: 'loyalty_balance',
    },
    system_security: {
      title: () => 'New Session Detected',
      message: (p) =>
        `Sign-in detected from ${p.device || 'Unknown'} (${p.location || 'Europe'}).`,
      actionLabelKey: 'account_security',
    },
  },
  it: {
    trip_rescheduled: {
      title: () => 'Partenza riprogrammata',
      message: (p) =>
        `La corsa ${p.route || ''} partirà alle ${p.new_time || '—'} anziché alle ${p.old_time || '—'}. Fermata invariata.`,
      actionLabelKey: 'view_ticket',
    },
    trip_cancelled: {
      title: () => 'Corsa cancellata dal vettore',
      message: (p) =>
        `La corsa ${p.route || ''} del ${p.date || ''} è stata annullata. Rimborso in corso.`,
      actionLabelKey: 'refund_status',
    },
    booking_confirmed: {
      title: (p) => `Prenotazione confermata #${p.booking_id || ''}`,
      message: (p) =>
        `Il titolo di viaggio per ${p.route || ''} è pronto per l'imbarco.`,
      actionLabelKey: 'view_ticket',
    },
    payment_success: {
      title: () => 'Pagamento completato',
      message: (p) =>
        `Transazione di ${p.amount || ''} completata con successo. Ricevuta emessa.`,
      actionLabelKey: 'view_receipt',
    },
    bonus_credited: {
      title: () => 'Punti BUSNET Club accreditati',
      message: (p) =>
        `Hai ricevuto +${p.points || 0} punti fedeltà per il tuo viaggio.`,
      actionLabelKey: 'loyalty_balance',
    },
    system_security: {
      title: () => 'Nuovo accesso rilevato',
      message: (p) =>
        `Accesso effettuato da ${p.device || 'Dispositivo'} (${p.location || 'Europa'}).`,
      actionLabelKey: 'account_security',
    },
  },
};

// --------------------------------------------------------------------------
// 5. ИНТЕРФЕЙС И ARIA
// --------------------------------------------------------------------------
const UI = {
  uk: {
    title: 'Сповіщення',
    subtitle: 'Оперативна інформація про рейси, транзакції та безпеку',
    markAllRead: 'Позначити всі як прочитані',
    marking: 'Збереження...',
    allReadToast: 'Всі сповіщення позначено як прочитані',
    singleReadToast: 'Позначено як прочитане',
    errorAuth: 'Необхідно авторизуватися для перегляду сповіщень',
    errorSync: 'Помилка синхронізації. Зміни скасовано',
    errorPartial: 'Частину сповіщень не вдалося оновити на сервері',
    errorFetch: 'Не вдалося завантажити сповіщення',
    retry: 'Повторити спробу',
    loadMore: 'Завантажити ще',
    loadingMore: 'Завантаження...',
    emptyTitle: 'Немає нових подій',
    emptyDesc: 'Усі актуальні сповіщення про ваші рейси відображатимуться тут',
    unauthTitle: 'Потрібна авторизація',
    unauthDesc: 'Увійдіть до свого облікового запису, щоб бачити сповіщення про ваші квитки та поїздки',
    filters: {
      all: 'Всі',
      unread: 'Непрочитані',
      trip: 'Рейси',
      payment: 'Оплати',
      system: 'Система',
      offer: 'Пропозиції',
    },
    groups: {
      today: 'Сьогодні',
      yesterday: 'Вчора',
      earlier: 'Раніше',
    },
    badgeCritical: 'Терміново',
    justNow: 'Щойно',
    realtimeDisconnected: 'Втрачено зв’язок у реальному часі',
    ariaFiltersNav: 'Фільтри списку сповіщень',
    ariaListRegion: 'Список сповіщень за категоріями',
    markReadAction: 'Позначити як прочитане',
  },
  en: {
    title: 'Notification Center',
    subtitle: 'Transit updates, payment receipts, and account security',
    markAllRead: 'Mark all as read',
    marking: 'Syncing...',
    allReadToast: 'All notifications marked as read',
    singleReadToast: 'Marked as read',
    errorAuth: 'Sign-in required to view notifications',
    errorSync: 'Sync error. Changes reverted',
    errorPartial: 'Some notifications could not be updated on server',
    errorFetch: 'Failed to load notifications',
    retry: 'Retry',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
    emptyTitle: 'All caught up',
    emptyDesc: 'Transit notices and security events will appear here',
    unauthTitle: 'Authentication Required',
    unauthDesc: 'Sign in to access your passenger trip notifications and receipts',
    filters: {
      all: 'All',
      unread: 'Unread',
      trip: 'Trips',
      payment: 'Payments',
      system: 'System',
      offer: 'Offers',
    },
    groups: {
      today: 'Today',
      yesterday: 'Yesterday',
      earlier: 'Earlier',
    },
    badgeCritical: 'Urgent',
    justNow: 'Just now',
    realtimeDisconnected: 'Realtime sync offline',
    ariaFiltersNav: 'Filter notification list',
    ariaListRegion: 'Categorized notifications list',
    markReadAction: 'Mark as read',
  },
  it: {
    title: 'Centro Notifiche',
    subtitle: 'Aggiornamenti in tempo reale su corse, pagamenti e sicurezza',
    markAllRead: 'Segna tutte come lette',
    marking: 'Sincronizzazione...',
    allReadToast: 'Tutte le notifiche segnate come lette',
    singleReadToast: 'Segnata come letta',
    errorAuth: 'Accesso richiesto per visualizzare le notifiche',
    errorSync: 'Errore di sincronizzazione. Modifiche annullate',
    errorPartial: 'Alcune notifiche non sono state aggiornate sul server',
    errorFetch: 'Impossibile caricare le notifiche',
    retry: 'Riprova',
    loadMore: 'Carica altre',
    loadingMore: 'Caricamento...',
    emptyTitle: 'Nessuna notifica',
    emptyDesc: 'Gli aggiornamenti di viaggio e gli avvisi appariranno qui',
    unauthTitle: 'Accesso Richiesto',
    unauthDesc: 'Accedi al tuo profilo passeggero per vedere i tuoi viaggi',
    filters: {
      all: 'Tutte',
      unread: 'Non lette',
      trip: 'Corse',
      payment: 'Pagamenti',
      system: 'Sistema',
      offer: 'Offerte',
    },
    groups: {
      today: 'Oggi',
      yesterday: 'Ieri',
      earlier: 'Precedenti',
    },
    badgeCritical: 'Urgente',
    justNow: 'Adesso',
    realtimeDisconnected: 'Connessione real-time non attiva',
    ariaFiltersNav: 'Filtra elenco notifiche',
    ariaListRegion: 'Elenco notifiche categorizzate',
    markReadAction: 'Segna come letta',
  },
};

// --------------------------------------------------------------------------
// 6. ХЕЛПЕРЫ ДАТ
// --------------------------------------------------------------------------
function formatSafeDateTime(dateIso: string, locale: Locale, isEarlier: boolean): string {
  try {
    const timestamp = new Date(dateIso).getTime();
    if (isNaN(timestamp)) return '';

    const dateObj = new Date(timestamp);

    if (isEarlier) {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    }

    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 45 && diffSec >= -15) {
      return UI[locale].justNow;
    }

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60 && diffMin >= 0) return rtf.format(-diffMin, 'minute');

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24 && diffHours >= 0) return rtf.format(-diffHours, 'hour');

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '';
  }
}

type DateGroupKey = 'today' | 'yesterday' | 'earlier';

function getGroupKey(dateIso: string): DateGroupKey {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return 'earlier';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (targetDate.getTime() === today.getTime()) return 'today';
    if (targetDate.getTime() === yesterday.getTime()) return 'yesterday';
    return 'earlier';
  } catch {
    return 'earlier';
  }
}

interface CursorData {
  created_at: string;
  id: string;
}

const PAGE_SIZE = 30;

// Детерминированная сортировка: created_at DESC, id DESC
function sortNotifications(a: NotificationItem, b: NotificationItem): number {
  const timeA = new Date(a.created_at).getTime();
  const timeB = new Date(b.created_at).getTime();
  if (timeA !== timeB) {
    return timeB - timeA;
  }
  return b.id.localeCompare(a.id);
}

// --------------------------------------------------------------------------
// 7. ОСНОВНОЙ КОМПОНЕНТ
// --------------------------------------------------------------------------
// Безопасное извлечение ID без приведений к any/unknown
function extractUserId(userObj: unknown): string {
  if (typeof userObj === 'object' && userObj !== null) {
    const record = userObj as Record<string, unknown>;
    if (typeof record.id === 'string') return record.id;
    if (typeof record.user_id === 'string') return record.user_id;
  }
  return '';
}
export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  initialNotifications,
  isLoading: externalLoading = false,
  locale = 'uk',
  onNavigate,
  onUnreadCountChange,
}) => {
  const { user } = useAuthStore();
  const currentUserId = extractUserId(user);
  const t = UI[locale] || UI.uk;

  const activeUserIdRef = useRef<string | undefined>(currentUserId);
  activeUserIdRef.current = currentUserId;

  const [items, setItems] = useState<NotificationItem[]>(initialNotifications || []);
  const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0);
  const [internalLoading, setInternalLoading] = useState<boolean>(
    initialNotifications === undefined && Boolean(currentUserId)
  );
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [loadMoreError, setLoadMoreError] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<CursorData | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Счётчики активных запросов на чтение
  const inFlightCountsRef = useRef<Map<string, number>>(new Map());
  // Реестр подтверждённых прочитанных записей
  const confirmedReadIdsRef = useRef<Set<string>>(new Set());
  // Браузерный тип таймера
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  // Буфер событий Realtime, пришедших во время выполнения сетевого запроса
  const pendingRealtimeBufferRef = useRef<NotificationItem[]>([]);
  const isFetchingRef = useRef<boolean>(false);
  // Защита от сброса кнопки при смене пользователя
  const activeMarkAllOpIdRef = useRef<number>(0);

  // Актуальная ссылка на счетчик без пересоздания сокета
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  useEffect(() => {
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onUnreadCountChange]);

  const incrementInFlight = useCallback((id: string) => {
    const curr = inFlightCountsRef.current.get(id) || 0;
    inFlightCountsRef.current.set(id, curr + 1);
  }, []);

  const decrementInFlight = useCallback((id: string) => {
    const curr = inFlightCountsRef.current.get(id) || 0;
    if (curr <= 1) {
      inFlightCountsRef.current.delete(id);
    } else {
      inFlightCountsRef.current.set(id, curr - 1);
    }
  }, []);

  const isInFlight = useCallback((id: string) => {
    return (inFlightCountsRef.current.get(id) || 0) > 0;
  }, []);

  // 1. ИЗОЛЯЦИЯ: СБРОС СОСТОЯНИЯ ПРИ СМЕНЕ ПОЛЬЗОВАТЕЛЯ
  useEffect(() => {
    setItems([]);
    setGlobalUnreadCount(0);
    setNextCursor(null);
    setHasMore(false);
    setFetchError(null);
    setLoadMoreError(false);
    setIsProcessing(false);
    reconnectAttemptsRef.current = 0;
    inFlightCountsRef.current.clear();
    confirmedReadIdsRef.current.clear();
    pendingRealtimeBufferRef.current = [];

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (!currentUserId) {
      setInternalLoading(false);
    }
  }, [currentUserId]);

  // 2. ДОСТОВЕРНЫЙ ПОДСЧЁТ ВСЕХ НЕПРОЧИТАННЫХ В SUPABASE
  const refreshGlobalUnreadCount = useCallback(async () => {
    const targetUserId = currentUserId;
    if (!targetUserId) return;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('read', false);

      if (activeUserIdRef.current !== targetUserId) return;
      if (error) throw error;

      const exactCount = count ?? 0;
      setGlobalUnreadCount(exactCount);
      onUnreadCountChange?.(exactCount);
    } catch (e) {
      console.error('[BUSNET] Unread count fetch error:', e);
    }
  }, [currentUserId, onUnreadCountChange]);

  // 3. СОСТАВНАЯ КУРСОРНАЯ ЗАГРУЗКА И РЕСИНХРОНИЗАЦИЯ
  const fetchNotificationsFromDb = useCallback(async (isResync = false, cursor: CursorData | null = null) => {
    const targetUserId = currentUserId;
    if (!targetUserId) {
      setInternalLoading(false);
      return;
    }

    if (!isResync && !cursor) {
      setInternalLoading(true);
    } else if (cursor) {
      setIsLoadingMore(true);
    }

    setFetchError(null);
    setLoadMoreError(false);
    isFetchingRef.current = true;
    if (!cursor) {
      pendingRealtimeBufferRef.current = [];
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        );
      }

      const { data, error } = await query;

      if (activeUserIdRef.current !== targetUserId) {
        return;
      }

      if (error) throw error;

      const fetched = (data as NotificationItem[]) || [];
      const lastItem = fetched.length > 0 ? fetched[fetched.length - 1] : null;

      setHasMore(fetched.length === PAGE_SIZE);
      setNextCursor(lastItem ? { created_at: lastItem.created_at, id: lastItem.id } : null);

      setItems((prev) => {
        if (!cursor) {
          if (!isResync) {
            // Первичная загрузка
            const fetchedMap = new Map(fetched.map((f) => [f.id, f]));
            for (const realtimeItem of pendingRealtimeBufferRef.current) {
              fetchedMap.set(realtimeItem.id, realtimeItem);
            }
            return Array.from(fetchedMap.values()).sort(sortNotifications);
          } else {
            // Ресинхрон: обновляем существующие строки, но НЕ удаляем старые загруженные страницы!
            const itemsMap = new Map(prev.map((item) => [item.id, item]));
            for (const item of fetched) {
              itemsMap.set(item.id, item);
            }
            for (const realtimeItem of pendingRealtimeBufferRef.current) {
              itemsMap.set(realtimeItem.id, realtimeItem);
            }
            return Array.from(itemsMap.values()).sort(sortNotifications);
          }
        } else {
          const currentIds = new Set(prev.map((p) => p.id));
          const appendList = fetched.filter((f) => !currentIds.has(f.id));
          return [...prev, ...appendList].sort(sortNotifications);
        }
      });

      // Обновляем достоверный счетчик непрочитанных
      refreshGlobalUnreadCount();
    } catch (err: unknown) {
      if (activeUserIdRef.current === targetUserId) {
        console.error('[BUSNET Notifications] Fetch error:', err);
        if (cursor) {
          setLoadMoreError(true);
        } else {
          setFetchError(t.errorFetch);
        }
      }
    } finally {
      isFetchingRef.current = false;
      if (activeUserIdRef.current === targetUserId) {
        setInternalLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [currentUserId, t.errorFetch, refreshGlobalUnreadCount]);

  useEffect(() => {
    if (initialNotifications === undefined && currentUserId) {
      fetchNotificationsFromDb(false, null);
    }
  }, [initialNotifications, currentUserId, fetchNotificationsFromDb]);

  useEffect(() => {
    if (initialNotifications !== undefined) {
      setItems((prev) => {
        return initialNotifications.map((item) => {
          if (isInFlight(item.id) || confirmedReadIdsRef.current.has(item.id)) {
            return { ...item, read: true };
          }
          return item;
        }).sort(sortNotifications);
      });
      refreshGlobalUnreadCount();
    }
  }, [initialNotifications, isInFlight, refreshGlobalUnreadCount]);

  // 4. КОНТРОЛИРУЕМЫЙ REALTIME С ЭКСПОНЕНЦИАЛЬНЫМ РЕКОННЕКТОМ
  useEffect(() => {
    if (!currentUserId) return;

    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = () => {
      if (activeUserIdRef.current !== currentUserId) return;

      activeChannel = supabase
        .channel(`realtime:busnet_notifications:${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            if (activeUserIdRef.current !== currentUserId) return;

            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as NotificationItem;
              if (isFetchingRef.current) {
                pendingRealtimeBufferRef.current.push(newItem);
              }
              setItems((prev) => {
                if (prev.some((item) => item.id === newItem.id)) return prev;
                return [newItem, ...prev].sort(sortNotifications);
              });
              if (!newItem.read) {
                setGlobalUnreadCount((prev) => {
                  const next = prev + 1;
                  onUnreadCountChangeRef.current?.(next);
                  return next;
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as NotificationItem;
              if (updated.read) {
                confirmedReadIdsRef.current.add(updated.id);
              }
              setItems((prev) => {
                const exists = prev.some((item) => item.id === updated.id);
                if (!exists) {
                  return [updated, ...prev].sort(sortNotifications);
                }
                return prev.map((item) => {
                  if (item.id === updated.id) {
                    const isLocked = isInFlight(item.id) || confirmedReadIdsRef.current.has(item.id);
                    return { ...updated, read: isLocked ? true : updated.read };
                  }
                  return item;
                }).sort(sortNotifications);
              });
              refreshGlobalUnreadCount();
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string })?.id;
              if (deletedId) {
                inFlightCountsRef.current.delete(deletedId);
                confirmedReadIdsRef.current.delete(deletedId);
                setItems((prev) => prev.filter((item) => item.id !== deletedId));
                refreshGlobalUnreadCount();
              }
            }
          }
        )
        .subscribe((status) => {
          if (activeUserIdRef.current !== currentUserId) return;

          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
            reconnectAttemptsRef.current = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsRealtimeConnected(false);

            if (activeChannel) {
              supabase.removeChannel(activeChannel);
              activeChannel = null;
            }

            // Экспоненциальный реконнект (максимум 5 попыток)
            if (reconnectAttemptsRef.current < 5) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 15000);
              reconnectAttemptsRef.current += 1;

              if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = setTimeout(() => {
                if (activeUserIdRef.current === currentUserId) {
                  setupSubscription();
                  fetchNotificationsFromDb(true, null);
                }
              }, delay);
            }
          }
        });
    };

    setupSubscription();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [currentUserId]); // <-- Только currentUserId! Больше никаких бесконечных реконнектов!

  // 5. БЕЗОПАСНЫЙ РЕЗОЛВИНГ ШАБЛОНОВ
  const resolveItemContent = useCallback(
    (item: NotificationItem) => {
      let title = item.title || '';
      let message = item.message || '';
      let actionLabel = '';

      const safeParams = (item.params && typeof item.params === 'object') ? item.params : {};

      if (item.template_id && TEMPLATES[locale]?.[item.template_id]) {
        const tplId = item.template_id;
        const reg = TEMPLATES[locale];
        try {
          switch (tplId) {
            case 'trip_rescheduled': {
              const tpl = reg.trip_rescheduled;
              title = tpl.title(safeParams as TripRescheduledParams);
              message = tpl.message(safeParams as TripRescheduledParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
            case 'trip_cancelled': {
              const tpl = reg.trip_cancelled;
              title = tpl.title(safeParams as TripCancelledParams);
              message = tpl.message(safeParams as TripCancelledParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
            case 'booking_confirmed': {
              const tpl = reg.booking_confirmed;
              title = tpl.title(safeParams as BookingConfirmedParams);
              message = tpl.message(safeParams as BookingConfirmedParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
            case 'payment_success': {
              const tpl = reg.payment_success;
              title = tpl.title(safeParams as PaymentSuccessParams);
              message = tpl.message(safeParams as PaymentSuccessParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
            case 'bonus_credited': {
              const tpl = reg.bonus_credited;
              title = tpl.title(safeParams as BonusCreditedParams);
              message = tpl.message(safeParams as BonusCreditedParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
            case 'system_security': {
              const tpl = reg.system_security;
              title = tpl.title(safeParams as SystemSecurityParams);
              message = tpl.message(safeParams as SystemSecurityParams);
              actionLabel = tpl.actionLabelKey ? ACTION_KEYS_DICT[locale][tpl.actionLabelKey] : ACTION_KEYS_DICT[locale].default;
              break;
            }
          }
        } catch (e) {
          console.error('[BUSNET] Template render error:', e);
        }
      }

      if (!actionLabel) {
        if (item.action_label_key && ACTION_KEYS_DICT[locale][item.action_label_key]) {
          actionLabel = ACTION_KEYS_DICT[locale][item.action_label_key];
        } else {
          actionLabel = ACTION_KEYS_DICT[locale].default;
        }
      }

      const safeUrl = sanitizeActionUrl(item.action_url);
      return { title, message, actionLabel, safeUrl };
    },
    [locale]
  );

  // 6. ФИЛЬТРАЦИЯ И ГРУППИРОВКА
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === 'unread') return !item.read;
      if (activeFilter === 'all') return true;
      return item.category === activeFilter;
    });
  }, [items, activeFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<DateGroupKey, NotificationItem[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    filteredItems.forEach((item) => {
      const key = getGroupKey(item.created_at);
      groups[key].push(item);
    });

    return groups;
  }, [filteredItems]);

  // 7. МАССОВОЕ ПРОЧТЕНИЕ ВСЕХ НЕПРОЧИТАННЫХ В БАЗЕ ДАННЫХ
  const handleMarkAllRead = async () => {
    const targetUserId = currentUserId;
    if (!targetUserId) {
      toast.error(t.errorAuth);
      return;
    }

    if (globalUnreadCount === 0 && items.every((n) => n.read)) return;
    const opId = ++activeMarkAllOpIdRef.current;
    const unreadIdsInView = items.filter((n) => !n.read).map((n) => n.id);
    const nowIso = new Date().toISOString();
    unreadIdsInView.forEach((id) => incrementInFlight(id));

    // Оптимистичное обновление локального экрана
    setItems((prev) => prev.map((n) => ({ ...n, read: true, read_at: nowIso })));
    setGlobalUnreadCount(0);
    onUnreadCountChange?.(0);
    setIsProcessing(true);

    try {
      // Обновляем ВСЕ непрочитанные в базе для данного пользователя
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: nowIso })
        .eq('user_id', targetUserId)
        .eq('read', false)
        .select('id');

      if (activeUserIdRef.current !== targetUserId) return;
      if (error) throw error;

      const confirmedIds = new Set((data || []).map((row) => row.id));
      confirmedIds.forEach((id) => confirmedReadIdsRef.current.add(id));
      unreadIdsInView.forEach((id) => decrementInFlight(id));

      toast.success(t.allReadToast);
      refreshGlobalUnreadCount();
    } catch (err) {
      if (activeUserIdRef.current === targetUserId) {
        console.error('[BUSNET Notifications] Mark all failed:', err);
        unreadIdsInView.forEach((id) => decrementInFlight(id));

        // Откат только неподтверждённых записей
        setItems((prev) =>
          prev.map((item) => {
            if (unreadIdsInView.includes(item.id) && !confirmedReadIdsRef.current.has(item.id)) {
              return { ...item, read: false, read_at: null };
            }
            return item;
          })
        );
        toast.error(t.errorSync);
        refreshGlobalUnreadCount();
      }
    } finally {
      if (activeUserIdRef.current === targetUserId && activeMarkAllOpIdRef.current === opId) {
        setIsProcessing(false);
      }
    }
  };

  // 8. ИНДИВИДУАЛЬНОЕ ПРОЧТЕНИЕ
  const handleItemRead = async (item: NotificationItem) => {
    const targetUserId = currentUserId;
    if (!item.read && targetUserId) {
      const nowIso = new Date().toISOString();
      incrementInFlight(item.id);

      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true, read_at: nowIso } : n))
      );
      setGlobalUnreadCount((c) => Math.max(0, c - 1));

      try {
        const { data, error } = await supabase
          .from('notifications')
          .update({ read: true, read_at: nowIso })
          .eq('id', item.id)
          .eq('user_id', targetUserId)
          .select('id');

        if (activeUserIdRef.current !== targetUserId) return;

        if (error || !data || data.length !== 1) {
          throw error || new Error('Row update count mismatch');
        }

        confirmedReadIdsRef.current.add(item.id);
      } catch (err) {
        if (activeUserIdRef.current === targetUserId) {
          console.error('[BUSNET Notifications] Single mark read failed:', err);
          if (!confirmedReadIdsRef.current.has(item.id)) {
            setItems((prev) =>
              prev.map((n) => (n.id === item.id ? { ...n, read: false, read_at: null } : n))
            );
            setGlobalUnreadCount((c) => c + 1);
          }
          toast.error(t.errorSync);
        }
      } finally {
        decrementInFlight(item.id);
      }
    }
  };

  const handleActionClick = (safeUrl: string, item: NotificationItem) => {
    handleItemRead(item);
    if (onNavigate) {
      onNavigate(safeUrl);
    }
  };

  // --------------------------------------------------------------------------
  // СОСТОЯНИЯ: UNAUTHENTICATED / LOADING / ERROR
  // --------------------------------------------------------------------------
  if (!currentUserId && initialNotifications === undefined) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 mx-auto">
          <LogIn size={20} strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">{t.unauthTitle}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">{t.unauthDesc}</p>
      </div>
    );
  }

  const isCurrentlyLoading = externalLoading || internalLoading;
  if (isCurrentlyLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg mb-8" />
        <div className="h-8 w-full max-w-sm bg-white/[0.03] rounded-lg" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError && items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-slate-400">{fetchError}</p>
        <button
          type="button"
          onClick={() => fetchNotificationsFromDb(false, null)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D2FF]"
        >
          <RefreshCw size={13} />
          <span>{t.retry}</span>
        </button>
      </div>
    );
  }

  return (
    <section aria-label={t.title} className="max-w-4xl mx-auto space-y-8 font-sans text-slate-100">
      {/* ----------------- ШАПКА ----------------- */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              {t.title}
            </h1>
            {globalUnreadCount > 0 && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#00D2FF]/10 text-[#00D2FF] border border-[#00D2FF]/20"
                aria-live="polite"
              >
                {globalUnreadCount}
              </span>
            )}
            {!isRealtimeConnected && (
              <span
                title={t.realtimeDisconnected}
                className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20"
              >
                <WifiOff size={11} />
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {globalUnreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isProcessing}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D2FF] rounded-md px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] disabled:opacity-40"
          >
            {isProcessing ? (
              <RotateCcw size={13} className="animate-spin text-[#00D2FF]" />
            ) : (
              <CheckCheck size={14} className="text-[#00D2FF]" />
            )}
            <span>{isProcessing ? t.marking : t.markAllRead}</span>
          </button>
        )}
      </header>

      {/* ----------------- НАВИГАЦИЯ / ФИЛЬТРЫ ----------------- */}
      <nav
        aria-label={t.ariaFiltersNav}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs border-b border-white/[0.03]"
      >
        {(['all', 'unread', 'trip', 'payment', 'system', 'offer'] as const).map((key) => {
          const isActive = activeFilter === key;
          const count =
            key === 'all'
              ? items.length
              : key === 'unread'
                ? globalUnreadCount
                : items.filter((n) => n.category === key).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              aria-pressed={isActive}
              className={`
                px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D2FF]
                ${isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }
              `}
            >
              <span>{t.filters[key]}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-white/10 text-slate-200 font-medium' : 'text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ----------------- ЛЕНТА СОБЫТИЙ ----------------- */}
      <div className="space-y-8" role="region" aria-label={t.ariaListRegion}>
        {(['today', 'yesterday', 'earlier'] as const).map((groupKey) => {
          const groupList = groupedItems[groupKey];
          if (groupList.length === 0) return null;

          return (
            <div key={groupKey} className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 pl-1">
                {t.groups[groupKey]}
              </h2>

              <ul className="space-y-2.5" role="list">
                <AnimatePresence initial={false}>
                  {groupList.map((item) => {
                    const { title, message, actionLabel, safeUrl } = resolveItemContent(item);
                    const isCritical = item.priority === 'critical';
                    const isEarlier = groupKey === 'earlier';
                    const tripParams = item.params as TripRescheduledParams | undefined;
                    const canNavigate = Boolean(safeUrl && onNavigate);

                    return (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                      >
                        {/* КРИТИЧЕСКИЙ РЕЙСОВЫЙ БЛОК */}
                        {isCritical ? (
                          <article
                            className={`
                              relative rounded-xl p-5 border transition-all
                              ${item.read
                                ? 'bg-[#090e17]/50 border-amber-500/15'
                                : 'bg-[#0f1522] border-amber-500/35 shadow-sm'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <AlertTriangle size={11} strokeWidth={2.5} />
                                  {t.badgeCritical}
                                </span>
                                {!item.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                )}
                              </div>
                              <time className="text-xs text-slate-500">
                                {formatSafeDateTime(item.created_at, locale, isEarlier)}
                              </time>
                            </div>

                            <h3 className="text-sm font-semibold text-white tracking-tight">
                              {title}
                            </h3>
                            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                              {message}
                            </p>

                            {tripParams?.old_time && tripParams?.new_time && (
                              <div className="mt-3 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.04] inline-flex items-center gap-3 text-xs">
                                <span className="line-through text-slate-500">{tripParams.old_time}</span>
                                <ArrowRight size={12} className="text-amber-400" />
                                <span className="text-white font-medium">{tripParams.new_time}</span>
                                {tripParams.route && (
                                  <span className="text-slate-400 border-l border-white/[0.08] pl-3">
                                    {tripParams.route}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                              {!item.read ? (
                                <button
                                  type="button"
                                  onClick={() => handleItemRead(item)}
                                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                                  aria-label={`${t.markReadAction}: ${title}`}
                                >
                                  <Check size={13} className="text-amber-400" />
                                  <span>{t.markReadAction}</span>
                                </button>
                              ) : <span />}

                              {canNavigate && safeUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(safeUrl, item)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors focus-visible:outline-none focus-visible:underline"
                                >
                                  <span>{actionLabel}</span>
                                  <ArrowUpRight size={13} />
                                </button>
                              )}
                            </div>
                          </article>
                        ) : (
                          /* СТАНДАРТНАЯ СТРОКА */
                          <article
                            className={`
                              group relative p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3
                              ${item.read
                                ? 'bg-[#090d16]/30 border-white/[0.03]'
                                : 'bg-[#0c1322] border-white/[0.08] shadow-sm'
                              }
                            `}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {!item.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] shrink-0" aria-hidden="true" />
                                )}
                                <h3 className={`text-xs sm:text-sm font-medium tracking-tight ${item.read ? 'text-slate-300' : 'text-white'}`}>
                                  {title}
                                </h3>
                              </div>

                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {message}
                              </p>

                              <div className="mt-3 flex items-center gap-4">
                                {!item.read && (
                                  <button
                                    type="button"
                                    onClick={() => handleItemRead(item)}
                                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:underline"
                                    aria-label={`${t.markReadAction}: ${title}`}
                                  >
                                    <Check size={12} className="text-[#00D2FF]" />
                                    <span>{t.markReadAction}</span>
                                  </button>
                                )}

                                {canNavigate && safeUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleActionClick(safeUrl, item)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#00D2FF] group-hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:underline"
                                  >
                                    <span>{actionLabel}</span>
                                    <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <time className="text-[11px] text-slate-500 shrink-0 self-start sm:self-auto font-normal">
                              {formatSafeDateTime(item.created_at, locale, isEarlier)}
                            </time>
                          </article>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}

        {/* ПАГИНАЦИЯ */}
        {hasMore && (
          <div className="text-center pt-2">
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={() => fetchNotificationsFromDb(false, nextCursor)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D2FF]"
            >
              {isLoadingMore ? t.loadingMore : t.loadMore}
            </button>
            {loadMoreError && (
              <p className="text-[11px] text-rose-400 mt-2">{t.errorFetch}</p>
            )}
          </div>
        )}

        {/* ПУСТОЕ СОСТОЯНИЕ */}
        {filteredItems.length === 0 && (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/[0.05] bg-[#070b12]/20">
            <Inbox size={26} strokeWidth={1.3} className="mx-auto text-slate-600 mb-2.5" />
            <h3 className="text-xs sm:text-sm font-medium text-slate-300">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.emptyDesc}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotificationsTab;