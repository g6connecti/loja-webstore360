export type PlatformType =
  | 'shopee'
  | 'amazon'
  | 'mercadolivre'
  | 'lojadomecanico'
  | 'temu'
  | 'aliexpress';

export type OfferStatus = 'rascunho' | 'publicado';

export interface Offer {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  imageUrl: string;
  originalPrice: string | number;
  discountPrice: string | number;
  discountPercentage?: number | null;
  installments?: string | null;
  affiliateUrl: string;
  platform: PlatformType;
  category: string;
  status: OfferStatus;
  isFeatured: boolean;
  isFlashDeal: boolean;
  rating?: string | number | null;
  reviewsCount?: number | null;
  couponCode?: string | null;
  viewsCount?: number | null;
  clicksCount?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCredential {
  id: string;
  platformName: PlatformType;
  displayName: string;
  affiliatePartnerId?: string | null;
  appId?: string | null;
  appSecret?: string | null;
  apiKey?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
  lastSyncedAt?: string | null;
  syncFrequencyMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalOffers: number;
  published: number;
  drafts: number;
  totalClicks: number;
  totalViews: number;
  estCommissionBrl: number;
}
