import { Wifi, Plug, Snowflake, Coffee, Tv, Toilet, type LucideIcon } from 'lucide-react';

export type Lang = 'uk' | 'en' | 'it';
export type AmenityId = 'wifi' | 'usb' | 'ac' | 'toilet' | 'coffee' | 'tv';

const ALIASES: Record<string, AmenityId> = {
  wifi: 'wifi',
  'wi-fi': 'wifi',
  wi_fi: 'wifi',
  usb: 'usb',
  plug: 'usb',
  outlets: 'usb',
  socket: 'usb',
  power: 'usb',
  ac: 'ac',
  clima: 'ac',
  climate: 'ac',
  air: 'ac',
  aircon: 'ac',
  toilet: 'toilet',
  wc: 'toilet',
  restroom: 'toilet',
  coffee: 'coffee',
  tea: 'coffee',
  drink: 'coffee',
  drinks: 'coffee',
  tv: 'tv',
  video: 'tv',
  media: 'tv',
  multimedia: 'tv',
};

const LABELS: Record<Lang, Record<AmenityId, { label: string; short: string }>> = {
  uk: {
    wifi:   { label: 'Wi-Fi',            short: 'Wi-Fi' },
    usb:    { label: 'USB / Розетки',    short: 'USB' },
    ac:     { label: 'Клімат-контроль',  short: 'Клімат' },
    toilet: { label: 'Туалет',           short: 'WC' },
    coffee: { label: 'Кава / Чай',       short: 'Кава' },
    tv:     { label: 'Мультимедіа / TV', short: 'TV' },
  },
  en: {
    wifi:   { label: 'Wi-Fi',            short: 'Wi-Fi' },
    usb:    { label: 'USB / Outlets',    short: 'USB' },
    ac:     { label: 'Air conditioning', short: 'A/C' },
    toilet: { label: 'Restroom',         short: 'WC' },
    coffee: { label: 'Coffee / Tea',     short: 'Coffee' },
    tv:     { label: 'Multimedia / TV',  short: 'TV' },
  },
  it: {
    wifi:   { label: 'Wi-Fi',            short: 'Wi-Fi' },
    usb:    { label: 'USB / Prese',      short: 'USB' },
    ac:     { label: 'Aria condizionata',short: 'Clima' },
    toilet: { label: 'Toilette',         short: 'WC' },
    coffee: { label: 'Caffè / Tè',       short: 'Caffè' },
    tv:     { label: 'Multimedia / TV',  short: 'TV' },
  },
};

const ICONS: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  usb: Plug,
  ac: Snowflake,
  toilet: Toilet,
  coffee: Coffee,
  tv: Tv,
};

export function toAmenityId(raw: string): AmenityId | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.toLowerCase().trim().replace(/[\s_]+/g, '-');
  return ALIASES[clean] ?? ALIASES[clean.replace(/-/g, '')] ?? null;
}

/** Канонічні ідентифікатори без дублів і невідомих: готово для рендеру */
export function normalizeAmenities(raw: unknown): AmenityId[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw.map((r) => (typeof r === 'string' ? toAmenityId(r) : null));
  return [...new Set(ids.filter((x): x is AmenityId => x !== null))];
}

export function getAmenityLabel(id: AmenityId, lang: string = 'uk', short = false): string {
  const normLang = (lang === 'UA' || lang === 'UK' ? 'uk' : lang.toLowerCase()) as Lang;
  const dict = LABELS[normLang] ?? LABELS.uk;
  const item = dict[id] ?? LABELS.uk[id];
  if (!item) return id;
  return short ? item.short : item.label;
}

export const getAmenityIcon = (id: AmenityId): LucideIcon => ICONS[id] ?? Wifi;
