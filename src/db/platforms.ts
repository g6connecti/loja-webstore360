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

export async function updatePlatformCredentials(
  id: string,
  data: Partial<typeof plataformasCredenciais.$inferInsert>
) {
  try {
    data.updatedAt = new Date();
    const updated = await db
      .update(plataformasCredenciais)
      .set(data)
      .where(eq(plataformasCredenciais.id, id))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Failed to update platform:', error);
    throw new Error('Database update failed while updating platform.', { cause: error });
  }
}

export async function syncPlatform(id: string) {
  try {
    const existing = await db
      .select()
      .from(plataformasCredenciais)
      .where(eq(plataformasCredenciais.id, id))
      .limit(1);

    const platform = existing[0];
    if (platform && platform.platformName === 'shopee') {
      await syncShopeeStorefront(platform.affiliatePartnerId || 'lagarelli180');
    } else if (platform && platform.platformName === 'mercadolivre') {
      await syncMercadoLivreStorefront(platform.affiliatePartnerId || 'luizricardoagarelli');
    }

    const updated = await db
      .update(plataformasCredenciais)
      .set({
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(plataformasCredenciais.id, id))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Failed to sync platform:', error);
    throw new Error('Database update failed while syncing platform.', { cause: error });
  }
}
