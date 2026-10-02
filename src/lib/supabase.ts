import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Offer, OfferStatus, AdminStats, PlatformCredential } from '../types/store.ts';
import { INITIAL_OFFERS } from '../data/initialOffers.ts';

// Get Supabase credentials from Vite environment or localStorage
export const getSupabaseConfig = () => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') : null;

  const url = (envUrl || localUrl || '').trim();
  const key = (envKey || localKey || '').trim();

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || !url.startsWith('http') || url.includes('your-project')) {
    return null;
  }
  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }
  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('VITE_SUPABASE_URL', url.trim());
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim());
    cachedClient = null;
  }
};

export const clearSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    cachedClient = null;
  }
};

/**
 * Normaliza um registro vindo da tabela 'ofertas' (ou 'produtos_ofertas')
 * cobrindo tanto convenções snake_case quanto camelCase ou em português.
 */
export function normalizeOfferRow(row: any): Offer {
  const origPrice = Number(row.original_price ?? row.originalPrice ?? row.preco_original ?? 0);
  const discPrice = Number(row.discount_price ?? row.discountPrice ?? row.preco_desconto ?? row.preco ?? 0);
  
  let discPercent = row.discount_percentage ?? row.discountPercentage ?? row.desconto;
  if (discPercent === null || discPercent === undefined) {
    discPercent = origPrice > 0 ? Math.round(((origPrice - discPrice) / origPrice) * 100) : 0;
  }

  return {
    id: String(row.id),
    title: row.title ?? row.titulo ?? 'Sem título',
    slug: row.slug ?? null,
    description: row.description ?? row.descricao ?? '',
    imageUrl: row.image_url ?? row.imageUrl ?? row.imagem ?? '',
    originalPrice: origPrice,
    discountPrice: discPrice,
    discountPercentage: Number(discPercent),
    installments: row.installments ?? row.parcelamento ?? null,
    affiliateUrl: row.affiliate_url ?? row.affiliateUrl ?? row.link ?? row.url ?? '',
    platform: (row.platform ?? row.plataforma ?? 'shopee').toLowerCase(),
    category: row.category ?? row.categoria ?? 'Geral',
    status: (row.status ?? 'publicado') as OfferStatus,
    isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? row.destaque),
    isFlashDeal: Boolean(row.is_flash_deal ?? row.isFlashDeal ?? row.relampago),
    rating: Number(row.rating ?? row.avaliacao ?? 4.8),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? row.avaliacoes ?? 0),
    couponCode: row.coupon_code ?? row.couponCode ?? row.cupom ?? null,
    viewsCount: Number(row.views_count ?? row.viewsCount ?? 0),
    clicksCount: Number(row.clicks_count ?? row.clicksCount ?? 0),
    expiresAt: row.expires_at ?? row.expiresAt ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * Converte um objeto Offer para o formato de colunas do banco
 */
export function denormalizeOffer(offer: Partial<Offer>) {
  const payload: Record<string, any> = {};
  if (offer.title !== undefined) payload.title = offer.title;
  if (offer.slug !== undefined) payload.slug = offer.slug;
  if (offer.description !== undefined) payload.description = offer.description;
  if (offer.imageUrl !== undefined) payload.image_url = offer.imageUrl;
  if (offer.originalPrice !== undefined) payload.original_price = Number(offer.originalPrice);
  if (offer.discountPrice !== undefined) payload.discount_price = Number(offer.discountPrice);
  if (offer.discountPercentage !== undefined) payload.discount_percentage = Number(offer.discountPercentage);
  if (offer.installments !== undefined) payload.installments = offer.installments;
  if (offer.affiliateUrl !== undefined) payload.affiliate_url = offer.affiliateUrl;
  if (offer.platform !== undefined) payload.platform = offer.platform;
  if (offer.category !== undefined) payload.category = offer.category;
  if (offer.status !== undefined) payload.status = offer.status;
  if (offer.isFeatured !== undefined) payload.is_featured = offer.isFeatured;
  if (offer.isFlashDeal !== undefined) payload.is_flash_deal = offer.isFlashDeal;
  if (offer.rating !== undefined) payload.rating = Number(offer.rating);
  if (offer.reviewsCount !== undefined) payload.reviews_count = Number(offer.reviewsCount);
  if (offer.couponCode !== undefined) payload.coupon_code = offer.couponCode;
  if (offer.viewsCount !== undefined) payload.views_count = Number(offer.viewsCount);
  if (offer.clicksCount !== undefined) payload.clicks_count = Number(offer.clicksCount);
  if (offer.expiresAt !== undefined) payload.expires_at = offer.expiresAt;
  payload.updated_at = new Date().toISOString();
  return payload;
}

export interface FetchOffersOptions {
  platform?: string;
  category?: string;
  search?: string;
  flashDealsOnly?: boolean;
  featuredOnly?: boolean;
  status?: string; // 'publicado', 'rascunho', 'all'
  sortBy?: 'discount' | 'clicks' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'title_asc' | 'title_desc';
}

/**
 * Busca direta no Supabase pela tabela 'ofertas' (com fallback para 'produtos_ofertas').
 * Se o Supabase não estiver configurado ou estiver vazio, busca via /api/offers ou dados locais.
 */
export async function fetchOffersDirectly(options: FetchOffersOptions = {}): Promise<Offer[]> {
  const client = getSupabase();

  if (client) {
    try {
      // Tenta primeiramente a tabela 'ofertas' solicitada pelo usuário
      let result = await executeSupabaseQuery(client, 'ofertas', options);

      // Se 'ofertas' não existir (ex: erro 42P01), tenta 'produtos_ofertas'
      if (result.error && (result.error.code === '42P01' || result.error.message?.includes('does not exist'))) {
        result = await executeSupabaseQuery(client, 'produtos_ofertas', options);
      }

      if (!result.error && result.data && result.data.length > 0) {
        return result.data.map(normalizeOfferRow);
      }
    } catch (err) {
      console.warn('Falha na consulta direta ao Supabase, tentando rota da API / local:', err);
    }
  }

  // Fallback para API local (/api/offers) caso o Supabase não esteja configurado ou sem dados
  try {
    const params = new URLSearchParams();
    if (options.platform && options.platform !== 'all') params.set('platform', options.platform);
    if (options.category && options.category !== 'all') params.set('category', options.category);
    if (options.search) params.set('search', options.search);
    if (options.flashDealsOnly) params.set('flashDealsOnly', 'true');
    if (options.status) params.set('status', options.status);
    if (options.sortBy) params.set('sortBy', options.sortBy);

    const res = await fetch(`/api/offers?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (apiErr) {
    // API local não disponível
  }

  return filterLocalOffers(INITIAL_OFFERS, options);
}

export type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newOffer?: Offer;
  oldOfferId?: string;
};

/**
 * Assina eventos em tempo real ("Ao Vivo") no Supabase para as tabelas 'ofertas' e 'produtos_ofertas'.
 * Quando um produto é inserido, atualizado ou excluído no Supabase, a função de callback é acionada instantaneamente.
 */
export function subscribeToOffersRealtime(
  onEvent: (payload: RealtimePayload) => void
): () => void {
  const client = getSupabase();
  if (!client) {
    return () => {};
  }

  try {
    const channelName = `realtime-ofertas-${Date.now()}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ofertas' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          if (eventType === 'INSERT' && payload.new) {
            onEvent({ eventType, newOffer: normalizeOfferRow(payload.new) });
          } else if (eventType === 'UPDATE' && payload.new) {
            onEvent({ eventType, newOffer: normalizeOfferRow(payload.new) });
          } else if (eventType === 'DELETE' && payload.old) {
            onEvent({ eventType, oldOfferId: String(payload.old.id) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produtos_ofertas' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          if (eventType === 'INSERT' && payload.new) {
            onEvent({ eventType, newOffer: normalizeOfferRow(payload.new) });
          } else if (eventType === 'UPDATE' && payload.new) {
            onEvent({ eventType, newOffer: normalizeOfferRow(payload.new) });
          } else if (eventType === 'DELETE' && payload.old) {
            onEvent({ eventType, oldOfferId: String(payload.old.id) });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('🟢 Conectado ao Supabase Realtime ("Ao Vivo") com sucesso!');
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Erro ao configurar Supabase Realtime:', err);
    return () => {};
  }
}

/**
 * Aciona a sincronização das vitrines das plataformas (Shopee, etc.) no backend
 */
export async function triggerVitrineSync(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const res = await fetch('/api/sync/vitrine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Falha ao sincronizar vitrines das plataformas.',
    };
  }
}

async function executeSupabaseQuery(client: SupabaseClient, tableName: string, options: FetchOffersOptions) {
  let query = client.from(tableName).select('*');

  // Filtro de status (RLS público normalmente filtra para publicado)
  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  } else if (!options.status) {
    query = query.eq('status', 'publicado');
  }

  if (options.platform && options.platform !== 'all') {
    query = query.eq('platform', options.platform);
  }

  if (options.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }

  if (options.flashDealsOnly) {
    query = query.eq('is_flash_deal', true);
  }

  if (options.featuredOnly) {
    query = query.eq('is_featured', true);
  }

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},category.ilike.${term}`);
  }

  // Ordenação
  switch (options.sortBy) {
    case 'title_asc':
      query = query.order('title', { ascending: true });
      break;
    case 'title_desc':
      query = query.order('title', { ascending: false });
      break;
    case 'clicks':
      query = query.order('clicks_count', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('discount_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('discount_price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'discount':
      query = query.order('discount_percentage', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  return await query;
}

/**
 * Incremento de cliques diretamente no Supabase
 */
export async function recordClickDirectly(offerId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    // Tenta primeiro via RPC ou incremento atômico se existir
    const { error } = await client.rpc('increment_click', { offer_id: offerId });
    if (error) {
      // Se não houver RPC, faz consulta simples e update
      const { data } = await client
        .from('ofertas')
        .select('clicks_count')
        .eq('id', offerId)
        .single();
      if (data) {
        await client
          .from('ofertas')
          .update({ clicks_count: (data.clicks_count || 0) + 1 })
          .eq('id', offerId);
      }
    }
  } catch (err) {
    // Silencia erros de telemetria
  }
}

/**
 * Ações administrativas diretas no Supabase (ofertas)
 */
export async function adminSaveOfferDirectly(offerData: Partial<Offer>): Promise<Offer> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase não está configurado.');
  }

  const payload = denormalizeOffer(offerData);
  const tableName = 'ofertas';

  if (offerData.id) {
    const { data, error } = await client
      .from(tableName)
      .update(payload)
      .eq('id', offerData.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeOfferRow(data);
  } else {
    payload.created_at = new Date().toISOString();
    const { data, error } = await client
      .from(tableName)
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return normalizeOfferRow(data);
  }
}

export async function adminDeleteOfferDirectly(id: string): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase não está configurado.');

  const { error } = await client.from('ofertas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminToggleStatusDirectly(id: string, newStatus: OfferStatus): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase não está configurado.');

  const { error } = await client
    .from('ofertas')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function adminGetStatsDirectly(): Promise<AdminStats> {
  const client = getSupabase();
  if (!client) {
    const totalOffers = INITIAL_OFFERS.length;
    const published = INITIAL_OFFERS.filter((o) => o.status === 'publicado').length;
    const drafts = totalOffers - published;
    const totalClicks = INITIAL_OFFERS.reduce((acc, o) => acc + (o.clicksCount || 0), 0);
    const totalViews = INITIAL_OFFERS.reduce((acc, o) => acc + (o.viewsCount || 0), 0);
    const estCommissionBrl = Number((totalClicks * 1.85).toFixed(2));
    return { totalOffers, published, drafts, totalClicks, totalViews, estCommissionBrl };
  }

  const { data, error } = await client.from('ofertas').select('status, clicks_count, views_count');
  if (error || !data) {
    return { totalOffers: 0, published: 0, drafts: 0, totalClicks: 0, totalViews: 0, estCommissionBrl: 0 };
  }

  const totalOffers = data.length;
  const published = data.filter((r) => r.status === 'publicado').length;
  const drafts = data.filter((r) => r.status === 'rascunho').length;
  const totalClicks = data.reduce((acc, r) => acc + (r.clicks_count || 0), 0);
  const totalViews = data.reduce((acc, r) => acc + (r.views_count || 0), 0);
  const estCommissionBrl = Number((totalClicks * 1.85).toFixed(2));

  return { totalOffers, published, drafts, totalClicks, totalViews, estCommissionBrl };
}

/**
 * Função utilitária para semear a tabela 'ofertas' no Supabase com os 72 produtos
 */
export async function seedSupabaseWithInitialOffers(): Promise<number> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase não configurado');

  const rows = INITIAL_OFFERS.map((o) => denormalizeOffer(o));
  const { data, error } = await client.from('ofertas').upsert(rows, { onConflict: 'slug' }).select();
  if (error) {
    throw new Error(error.message);
  }
  return data ? data.length : 0;
}

/**
 * Filtro local quando o cliente não tiver Supabase configurado
 */
function filterLocalOffers(offers: Offer[], options: FetchOffersOptions): Offer[] {
  let list = [...offers];

  if (options.status && options.status !== 'all') {
    list = list.filter((o) => o.status === options.status);
  } else if (!options.status) {
    list = list.filter((o) => o.status === 'publicado');
  }

  if (options.platform && options.platform !== 'all') {
    list = list.filter((o) => o.platform === options.platform);
  }

  if (options.category && options.category !== 'all') {
    list = list.filter((o) => o.category === options.category);
  }

  if (options.flashDealsOnly) {
    list = list.filter((o) => o.isFlashDeal);
  }

  if (options.featuredOnly) {
    list = list.filter((o) => o.isFeatured);
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        o.category.toLowerCase().includes(q)
    );
  }

  switch (options.sortBy) {
    case 'title_asc':
      list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
      break;
    case 'title_desc':
      list.sort((a, b) => b.title.localeCompare(a.title, 'pt-BR'));
      break;
    case 'clicks':
      list.sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0));
      break;
    case 'price_asc':
      list.sort((a, b) => Number(a.discountPrice) - Number(b.discountPrice));
      break;
    case 'price_desc':
      list.sort((a, b) => Number(b.discountPrice) - Number(a.discountPrice));
      break;
    case 'rating':
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      break;
    case 'discount':
      list.sort((a, b) => Number(b.discountPercentage || 0) - Number(a.discountPercentage || 0));
      break;
    default:
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}
