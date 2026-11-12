export type ConnectTabType = 
  | 'home' 
  | 'community' 
  | 'messages' 
  | 'groups' 
  | 'discover' 
  | 'notifications' 
  | 'profile';

export const CONNECT_POST_TYPES = [
  'general',
  'blog',
  'tips',
  'buddy',
  'parcel',
  'border',
  'review',
  'news',
  'questions',
] as const;

export type ConnectPostType = (typeof CONNECT_POST_TYPES)[number];

export const CONNECT_REPORT_REASONS = [
  { id: 'spam', label: 'Спам або нав’язлива реклама' },
  { id: 'misleading_border', label: 'Неправдива інформація про черги на кордоні' },
  { id: 'fraud', label: 'Шахрайство або сумнівна передача посилки' },
  { id: 'harassment', label: 'Образлива поведінка або ворожнеча' },
  { id: 'other', label: 'Інше порушення правил BUSNET' },
] as const;

export type ConnectReportReason = (typeof CONNECT_REPORT_REASONS)[number]['id'];

export interface ConnectPost {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  title?: string;
  content: string;
  category: string;
  postType: ConnectPostType;
  imageUrl?: string;
  routeFrom?: string;
  routeTo?: string;
  meta?: {
    parcelWeight?: string;
    parcelReward?: string;
    buddySeats?: number;
    checkpoint?: string;
    checkpointWaitHours?: number;
    checkpointTrend?: 'stable' | 'faster' | 'slower';
    carrierName?: string;
    carrierRating?: number;
    tags?: string[];
    [key: string]: any;
  };
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  viewsCount: number;
  isPublic: boolean;
  isIndexable: boolean; // Strict: default false
  slug?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ConnectComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
}

export interface ConnectReportPayload {
  postId: string;
  reason: string;
  details?: string;
}

export interface ConnectReport {
  id: string;
  postId: string;
  reporterId?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt: number;
  reviewedAt?: number;
  post?: Partial<ConnectPost>;
}

export interface ConnectStoryItem {
  id: string;
  author: string;
  authorAvatar: string;
  mediaUrl: string;
  caption: string;
  tag: string;
  createdAt: string;
  isViewed?: boolean;
}
