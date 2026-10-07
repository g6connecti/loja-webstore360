import { db } from './index.ts';
import { plataformasCredenciais } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { syncShopeeStorefront, syncMercadoLivreStorefront } from '../services/vitrineSync.ts';

export async function getPlatforms() {
  try {
    return await db.select().from(plataformasCredenciais).orderBy(plataformasCredenciais.platformName);
  } catch (error) {
    console.error('Failed to get platforms:', error);
    throw new Error('Database query failed while fetching platforms.', { cause: error });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updatePlatformCredentials(
  id: string,
  data: Partial<typeof plataformasCredenciais.$inferInsert>
) {
  try {
    data.updatedAt = new Date();
    const isUuid = UUID_REGEX.test(id);
    const whereCondition = isUuid
      ? eq(plataformasCredenciais.id, id)
      : eq(plataformasCredenciais.platformName, id);

    const updated = await db
      .update(plataformasCredenciais)
      .set(data)
      .where(whereCondition)
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Failed to update platform:', error);
    throw new Error('Database update failed while updating platform.', { cause: error });
  }
}

export async function syncPlatform(id: string) {
  try {
    const isUuid = UUID_REGEX.test(id);
    const whereCondition = isUuid
      ? eq(plataformasCredenciais.id, id)
      : eq(plataformasCredenciais.platformName, id);

    const existing = await db
      .select()
      .from(plataformasCredenciais)
      .where(whereCondition)
      .limit(1);

    const platform = existing[0];
    if (!platform) {
      return null;
    }

    let syncDetails: any = null;
    if (platform.platformName === 'shopee') {
      syncDetails = await syncShopeeStorefront(platform.affiliatePartnerId || 'lagarelli180');
    } else if (platform.platformName === 'mercadolivre') {
      syncDetails = await syncMercadoLivreStorefront(platform.affiliatePartnerId || 'luizricardoagarelli');
    }

    const updated = await db
      .update(plataformasCredenciais)
      .set({
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(plataformasCredenciais.id, platform.id))
      .returning();

    const result = updated[0] || platform;
    return {
      ...result,
      syncDetails,
    };
  } catch (error) {
    console.error('Failed to sync platform:', error);
    throw new Error('Database update failed while syncing platform.', { cause: error });
  }
}
