import { db } from './index.ts';
import { produtosOfertas } from './schema.ts';
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm';

export interface GetOffersFilter {
  platform?: string;
  category?: string;
  search?: string;
  flashDealsOnly?: boolean;
  featuredOnly?: boolean;
  status?: string; // 'publicado' | 'rascunho' | 'all'
  sortBy?: 'discount' | 'clicks' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'title_asc' | 'title_desc';
}

export async function getOffers(filters: GetOffersFilter = {}, isAdmin: boolean = false) {
  try {
    const conditions = [];

    // Security/RLS enforcement: non-admin can only read 'publicado'
    if (!isAdmin) {
      conditions.push(eq(produtosOfertas.status, 'publicado'));
    } else if (filters.status && filters.status !== 'all') {
      conditions.push(eq(produtosOfertas.status, filters.status));
    }

    if (filters.platform && filters.platform !== 'all') {
      conditions.push(eq(produtosOfertas.platform, filters.platform));
    }

    if (filters.category && filters.category !== 'all') {
      conditions.push(eq(produtosOfertas.category, filters.category));
    }

    if (filters.flashDealsOnly) {
      conditions.push(eq(produtosOfertas.isFlashDeal, true));
    }

    if (filters.featuredOnly) {
      conditions.push(eq(produtosOfertas.isFeatured, true));
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(produtosOfertas.title, term),
          ilike(produtosOfertas.description, term),
          ilike(produtosOfertas.category, term)
        )
      );
    }

    let query = db.select().from(produtosOfertas);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    if (whereClause) {
      query = query.where(whereClause) as any;
    }

    // Sort order
    if (filters.sortBy === 'title_asc') {
      query = query.orderBy(asc(produtosOfertas.title)) as any;
    } else if (filters.sortBy === 'title_desc') {
      query = query.orderBy(desc(produtosOfertas.title)) as any;
    } else if (filters.sortBy === 'clicks') {
      query = query.orderBy(desc(produtosOfertas.clicksCount)) as any;
    } else if (filters.sortBy === 'price_asc') {
      query = query.orderBy(asc(produtosOfertas.discountPrice)) as any;
    } else if (filters.sortBy === 'price_desc') {
      query = query.orderBy(desc(produtosOfertas.discountPrice)) as any;
    } else if (filters.sortBy === 'rating') {
      query = query.orderBy(desc(produtosOfertas.rating)) as any;
    } else if (filters.sortBy === 'discount') {
      query = query.orderBy(desc(produtosOfertas.discountPercentage)) as any;
    } else {
      // default newest
      query = query.orderBy(desc(produtosOfertas.createdAt)) as any;
    }

    return await query;
  } catch (error) {
    console.error('Failed to get offers:', error);
    throw new Error('Database query failed while fetching offers.', { cause: error });
  }
}

export async function getOfferById(id: string) {
  try {
    const results = await db.select().from(produtosOfertas).where(eq(produtosOfertas.id, id));
    return results[0] || null;
  } catch (error) {
    console.error('Failed to get offer by id:', error);
    throw new Error('Database query failed while fetching offer.', { cause: error });
  }
}

export async function recordOfferClick(id: string) {
  try {
    const updated = await db
      .update(produtosOfertas)
      .set({
        clicksCount: sql`${produtosOfertas.clicksCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(produtosOfertas.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Failed to record click:', error);
    throw new Error('Failed to record offer click.', { cause: error });
  }
}

export async function recordOfferView(id: string) {
  try {
    const updated = await db
      .update(produtosOfertas)
      .set({
        viewsCount: sql`${produtosOfertas.viewsCount} + 1`,
      })
      .where(eq(produtosOfertas.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Failed to record view:', error);
    throw new Error('Failed to record offer view.', { cause: error });
  }
}

export async function createOffer(data: typeof produtosOfertas.$inferInsert) {
  try {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
    }

    // Calculate discount percentage
    const orig = Number(data.originalPrice);
    const disc = Number(data.discountPrice);
    if (orig > 0 && disc < orig) {
      data.discountPercentage = Math.round(((orig - disc) / orig) * 100);
    } else {
      data.discountPercentage = 0;
    }

    const inserted = await db.insert(produtosOfertas).values(data).returning();
    return inserted[0];
  } catch (error) {
    console.error('Failed to create offer:', error);
    throw new Error('Database insert failed while creating offer.', { cause: error });
  }
}

export async function updateOffer(id: string, data: Partial<typeof produtosOfertas.$inferInsert>) {
  try {
    if (data.originalPrice !== undefined || data.discountPrice !== undefined) {
      const orig = Number(data.originalPrice);
      const disc = Number(data.discountPrice);
      if (orig > 0 && disc < orig) {
        data.discountPercentage = Math.round(((orig - disc) / orig) * 100);
      }
    }

    data.updatedAt = new Date();

    const updated = await db
      .update(produtosOfertas)
      .set(data)
      .where(eq(produtosOfertas.id, id))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('Failed to update offer:', error);
    throw new Error('Database update failed while updating offer.', { cause: error });
  }
}

export async function deleteOffer(id: string) {
  try {
    const deleted = await db.delete(produtosOfertas).where(eq(produtosOfertas.id, id)).returning();
    return deleted[0] || null;
  } catch (error) {
    console.error('Failed to delete offer:', error);
    throw new Error('Database delete failed while removing offer.', { cause: error });
  }
}

export async function getStats() {
  try {
    const all = await db.select().from(produtosOfertas);
    const totalOffers = all.length;
    const published = all.filter((o) => o.status === 'publicado').length;
    const drafts = all.filter((o) => o.status === 'rascunho').length;
    const totalClicks = all.reduce((sum, o) => sum + (o.clicksCount || 0), 0);
    const totalViews = all.reduce((sum, o) => sum + (o.viewsCount || 0), 0);
    const estCommissionBrl = all.reduce((sum, o) => {
      // Estimated 3% affiliate commission based on clicks * conversion 2%
      const price = Number(o.discountPrice) || 0;
      const clicks = o.clicksCount || 0;
      return sum + (clicks * 0.02 * price * 0.04);
    }, 0);

    return {
      totalOffers,
      published,
      drafts,
      totalClicks,
      totalViews,
      estCommissionBrl: Math.round(estCommissionBrl * 100) / 100,
    };
  } catch (error) {
    console.error('Failed to get stats:', error);
    throw new Error('Database query failed while fetching stats.', { cause: error });
  }
}
