import { boolean, integer, numeric, pgTable, serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const produtosOfertas = pgTable('produtos_ofertas', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).unique(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: numeric('discount_price', { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer('discount_percentage').default(0),
  installments: varchar('installments', { length: 100 }),
  affiliateUrl: text('affiliate_url').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'shopee', 'amazon', 'mercadolivre', 'lojadomecanico', 'temu', 'aliexpress', 'magalu'
  category: varchar('category', { length: 60 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('rascunho'), // 'rascunho', 'publicado'
  isFeatured: boolean('is_featured').notNull().default(false),
  isFlashDeal: boolean('is_flash_deal').notNull().default(false),
  rating: numeric('rating', { precision: 2, scale: 1 }).default('4.8'),
  reviewsCount: integer('reviews_count').default(0),
  couponCode: varchar('coupon_code', { length: 50 }),
  viewsCount: integer('views_count').default(0),
  clicksCount: integer('clicks_count').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const plataformasCredenciais = pgTable('plataformas_credenciais', {
  id: uuid('id').defaultRandom().primaryKey(),
  platformName: varchar('platform_name', { length: 50 }).notNull().unique(), // 'shopee', 'amazon', 'mercadolivre', 'lojadomecanico', 'temu', 'aliexpress', 'magalu'
  displayName: varchar('display_name', { length: 100 }).notNull(),
  affiliatePartnerId: varchar('affiliate_partner_id', { length: 150 }),
  appId: varchar('app_id', { length: 255 }),
  appSecret: text('app_secret'),
  apiKey: text('api_key'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  webhookSecret: text('webhook_secret'),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncFrequencyMinutes: integer('sync_frequency_minutes').default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
