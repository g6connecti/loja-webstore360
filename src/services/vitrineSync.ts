import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Offer } from '../types/store.ts';

dotenv.config();

function getPool(dbName: string) {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: dbName,
  });
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('chuveiro') || t.includes('lorenzetti') || t.includes('torneira') || t.includes('ferramenta') || t.includes('furadeira')) return 'Casa & Construção';
  if (t.includes('café') || t.includes('cafe')) return 'Cafés & Gourmet';
  if (t.includes('doce') || t.includes('cocada') || t.includes('goiabada') || t.includes('queijo') || t.includes('provolone') || t.includes('coqueteis')) return 'Doces & Queijos Mineiros';
  if (t.includes('perfume') || t.includes('esmalte') || t.includes('beleza') || t.includes('creme') || t.includes('batom')) return 'Beleza & Perfumaria';
  if (t.includes('copo') || t.includes('garrafa') || t.includes('caneca') || t.includes('moedor') || t.includes('borrifador') || t.includes('spray')) return 'Utensílios & Café';
  if (t.includes('fone') || t.includes('smartwatch') || t.includes('celular') || t.includes('led') || t.includes('display')) return 'Eletrônicos';
  return 'Gourmet & Achados';
}

function getPrices(title: string): { orig: number; disc: number; desc: string } {
  const t = title.toLowerCase();
  if (t.includes('chuveiro') || t.includes('lorenzetti')) return { orig: 189.90, disc: 129.90, desc: 'Chuveiro eletrônico Loren Shower com controle gradual de temperatura e espalhador amplo de alta performance.' };
  if (t.includes('kit3') || t.includes('coqueteis')) return { orig: 89.90, disc: 59.90, desc: 'Kit com 3 coquetéis cremosos sabor Marula, Chocolate e Chocolate Branco.' };
  if (t.includes('parmesão') || t.includes('parmesao')) return { orig: 79.90, disc: 49.90, desc: 'Queijo tipo Parmesão curado artesanal mineiro de sabor marcante para massas e petiscos.' };
  if (t.includes('provolone')) return { orig: 69.90, disc: 45.90, desc: 'Kit Provolone Provoleto autêntico da Serra da Canastra defumado.' };
  if (t.includes('perfumes')) return { orig: 149.90, disc: 89.90, desc: 'Combo com 3 perfumes masculinos com alta fixação e projeção marcante.' };
  if (t.includes('garrafa térmica') || t.includes('garrafa termica')) return { orig: 99.90, disc: 58.90, desc: 'Garrafa térmica Verona com sistema de pressão para café e chá quente.' };
  if (t.includes('orfeu')) return { orig: 42.00, disc: 29.90, desc: 'Café especial premiado 100% Arábica Orfeu, torrado e moído com notas equilibradas.' };
  if (t.includes('moedor')) return { orig: 89.90, disc: 49.90, desc: 'Moedor elétrico multifuncional com lâminas de aço inox para moagem rápida.' };
  if (t.includes('caneca misturadora')) return { orig: 59.90, disc: 34.90, desc: 'Caneca automática que mistura café, leite e suplementos com 1 toque.' };
  if (t.includes('display led')) return { orig: 69.90, disc: 38.90, desc: 'Copo térmico inteligente com sensor de temperatura em display LED touch.' };
  if (t.includes('baggio')) return { orig: 39.90, disc: 26.90, desc: 'Café aromático Baggio com toque aveludado de chocolate trufado.' };
  if (t.includes('rocca')) return { orig: 45.00, disc: 32.90, desc: 'Autêntico doce de leite mineiro Rocca harmonizado com café especial.' };
  if (t.includes('aviação') || t.includes('aviacao')) return { orig: 36.00, disc: 24.90, desc: 'Tradicional doce de leite Aviação cremoso de altíssima qualidade.' };
  if (t.includes('spray') || t.includes('borrifador')) return { orig: 39.90, disc: 21.90, desc: 'Pulverizador prático para óleo, azeite e vinagre com dosagem perfeita.' };
  if (t.includes('doce') || t.includes('cocada')) return { orig: 38.00, disc: 24.90, desc: 'Doce tradicional da fazenda preparado com receita artesanal mineira.' };
  if (t.includes('café') || t.includes('cafe')) return { orig: 35.00, disc: 22.90, desc: 'Café artesanal 100% arábica com aroma intenso e notas doces naturais.' };
  if (t.includes('copo') || t.includes('caneca')) return { orig: 59.00, disc: 34.90, desc: 'Copo térmico em inox com isolamento a vácuo para bebidas quentes e geladas.' };
  return { orig: 99.90, disc: 59.90, desc: 'Produto oficial selecionado da vitrine de afiliados com excelente avaliação e envio rápido.' };
}

export interface SyncResult {
  platform: string;
  totalFound: number;
  newlyAdded: number;
  updated: number;
  timestamp: string;
  error?: string;
}

/**
 * Sincroniza a vitrine de afiliados da Shopee (ex: lagarelli180)
 * Obtém os produtos direto da API GraphQL pública da vitrine da Shopee
 */
export async function syncShopeeStorefront(urlSuffix = 'lagarelli180'): Promise<SyncResult> {
  const query = `
    query getLinkLists($urlSuffix: String!, $pageSize: String, $pageNum: String) {
      landingPageLinkList(urlSuffix: $urlSuffix, pageSize: $pageSize, pageNum: $pageNum) {
        linkList {
          linkId
          link
          linkName
          image
        }
      }
    }
  `;

  try {
    const res = await fetch('https://collshp.com/api/v3/gql/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'getLinkLists',
        query,
        variables: { urlSuffix, pageSize: '100', pageNum: '1' },
      }),
    });

    if (!res.ok) {
      throw new Error(`Falha HTTP ao consultar Shopee vitrine: ${res.statusText}`);
    }

    const json = await res.json();
    const list: Array<{ linkId: string; link: string; linkName: string; image: string }> =
      json?.data?.landingPageLinkList?.linkList || [];

    if (list.length === 0) {
      return {
        platform: 'shopee',
        totalFound: 0,
        newlyAdded: 0,
        updated: 0,
        timestamp: new Date().toISOString(),
      };
    }

    let newlyAdded = 0;
    let updated = 0;

    const databases = ['cloud_sql_production_database', 'cloud_sql_development_database'];

    for (const dbName of databases) {
      if (!process.env.SQL_HOST) continue;
      const pool = getPool(dbName);

      try {
        for (let idx = 0; idx < list.length; idx++) {
          const item = list[idx];
          const slug = slugify(item.linkName) + '-' + item.linkId;
          const cat = getCategory(item.linkName);
          const { orig, disc, desc } = getPrices(item.linkName);
          const pct = Math.round(((orig - disc) / orig) * 100);
          const isFlash = idx < 8;
          const isFeat = idx < 16;
          const rating = (4.8 + ((idx % 3) * 0.1)).toFixed(1);
          const reviews = 350 + idx * 145;
          const coupon = idx % 2 === 0 ? 'MINEIRO10' : 'SHOPEEFRETE';
          const installments = `2x de R$ ${(disc / 2).toFixed(2).replace('.', ',')} sem juros`;

          // Verificar se já existe por link ou slug
          const check = await pool.query(
            'SELECT id FROM produtos_ofertas WHERE affiliate_url = $1 OR slug = $2',
            [item.link, slug]
          );

          if (check.rows.length === 0) {
            await pool.query(
              `INSERT INTO produtos_ofertas 
              (title, slug, description, image_url, original_price, discount_price, discount_percentage, installments, affiliate_url, platform, category, status, is_featured, is_flash_deal, rating, reviews_count, coupon_code, views_count, clicks_count, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())`,
              [
                item.linkName,
                slug,
                desc,
                item.image,
                orig,
                disc,
                pct,
                installments,
                item.link,
                'shopee',
                cat,
                'publicado',
                isFeat,
                isFlash,
                rating,
                reviews,
                coupon,
                2800 + idx * 150,
                700 + idx * 60,
              ]
            );
            if (dbName === 'cloud_sql_production_database') newlyAdded++;
          } else {
            // Atualizar imagem e título se necessário
            await pool.query(
              `UPDATE produtos_ofertas 
               SET title = $1, image_url = $2, affiliate_url = $3, updated_at = NOW()
               WHERE id = $4`,
              [item.linkName, item.image, item.link, check.rows[0].id]
            );
            if (dbName === 'cloud_sql_production_database') updated++;
          }
        }

        // Atualizar timestamp na tabela de credenciais
        await pool.query(
          `UPDATE plataformas_credenciais SET last_synced_at = NOW(), updated_at = NOW() WHERE platform_name = 'shopee'`
        );
      } catch (dbErr) {
        console.error(`Erro ao sincronizar banco ${dbName}:`, dbErr);
      } finally {
        await pool.end();
      }
    }

    return {
      platform: 'shopee',
      totalFound: list.length,
      newlyAdded,
      updated,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Erro na sincronização da vitrine Shopee:', error);
    return {
      platform: 'shopee',
      totalFound: 0,
      newlyAdded: 0,
      updated: 0,
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro desconhecido',
    };
  }
}

function extractMlbId(url: string): string | null {
  const match =
    url.match(/item_id%3A(MLB\w+)/i) ||
    url.match(/wid=(MLB\w+)/i) ||
    url.match(/\/p\/(MLB\w+)/i) ||
    url.match(/\/up\/(MLBU\w+)/i) ||
    url.match(/MLB-?(\d+)/i);
  return match ? match[1].replace('-', '') : null;
}

/**
 * Sincroniza a vitrine de afiliados do Mercado Livre (luizricardoagarelli)
 */
export async function syncMercadoLivreStorefront(
  username = 'luizricardoagarelli'
): Promise<SyncResult> {
  const url = `https://www.mercadolivre.com.br/social/${username}/lists/d1295c0b-5202-4ecf-8278-8a34e3837fcd`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`Falha HTTP ao consultar Mercado Livre vitrine: ${res.statusText}`);
    }

    const html = await res.text();
    const chunks = html.split(/<div class="andes-card lists-card poly-card/);

    if (chunks.length <= 1) {
      return {
        platform: 'mercadolivre',
        totalFound: 0,
        newlyAdded: 0,
        updated: 0,
        timestamp: new Date().toISOString(),
      };
    }

    let newlyAdded = 0;
    let updated = 0;
    let totalFound = 0;

    const databases = ['cloud_sql_production_database', 'cloud_sql_development_database'];

    for (const dbName of databases) {
      if (!process.env.SQL_HOST) continue;
      const pool = getPool(dbName);

      try {
        // Remover placeholders antigos genéricos para evitar duplicações
        await pool.query(
          `DELETE FROM produtos_ofertas 
           WHERE platform = 'mercadolivre' 
             AND affiliate_url = 'https://www.mercadolivre.com.br/social/luizricardoagarelli'`
        );

        for (let i = 1; i < chunks.length; i++) {
          const chunk = chunks[i];
          const titleMatch = chunk.match(/class="poly-component__title"[^>]*>([^<]+)<\/a>/);
          const linkMatch = chunk.match(/href="([^"]+)"[^>]*class="poly-component__title"/);
          const imgMatch =
            chunk.match(/class="poly-component__picture"[^>]*src="([^"]+)"/) ||
            chunk.match(/src="([^"]+mlstatic\.com[^"]+)"/);
          const prevPriceMatch = chunk.match(
            /aria-label="Antes:\s*([\d\.]+)\s*reais(?:\s*com\s*(\d+)\s*centavos)?"/
          );
          const currPriceMatch = chunk.match(
            /aria-label="(?:Agora:\s*)?([\d\.]+)\s*reais(?:\s*com\s*(\d+)\s*centavos)?"/
          );

          if (!titleMatch || !linkMatch) continue;

          const title = titleMatch[1].trim();
          const affiliateUrl = linkMatch[1].replace(/&amp;/g, '&');
          const imageUrl = imgMatch
            ? imgMatch[1]
            : 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.22.8/mercadolibre/logo__large_plus.png';

          let orig = 0;
          if (prevPriceMatch) {
            orig =
              parseFloat(prevPriceMatch[1].replace('.', '')) +
              (prevPriceMatch[2] ? parseFloat(prevPriceMatch[2]) / 100 : 0);
          }
          let disc = 0;
          if (currPriceMatch) {
            disc =
              parseFloat(currPriceMatch[1].replace('.', '')) +
              (currPriceMatch[2] ? parseFloat(currPriceMatch[2]) / 100 : 0);
          }
          if (!disc) disc = 49.9;
          if (!orig || orig <= disc) {
            orig = Math.round(disc * 1.35 * 100) / 100;
          }

          const discPct = Math.round(((orig - disc) / orig) * 100);
          const cat = getCategory(title);
          const slug = slugify(title) + '-ml-' + i;
          const installments = `3x de R$ ${(disc / 3).toFixed(2).replace('.', ',')} sem juros`;
          const desc =
            'Produto oficial da vitrine de afiliados Mercado Livre com envio Full e garantia de compra protegida.';

          if (dbName === 'cloud_sql_production_database') totalFound++;

          // Identificar se o produto já existe usando MLB ID ou Título
          const mlbId = extractMlbId(affiliateUrl);
          let check;
          if (mlbId) {
            check = await pool.query(
              `SELECT id FROM produtos_ofertas 
               WHERE platform = 'mercadolivre' 
                 AND (affiliate_url ILIKE $1 OR slug ILIKE $2 OR title ILIKE $3)`,
              [`%${mlbId}%`, `%${mlbId}%`, title]
            );
          } else {
            check = await pool.query(
              `SELECT id FROM produtos_ofertas 
               WHERE platform = 'mercadolivre' 
                 AND (title ILIKE $1 OR affiliate_url = $2)`,
              [title, affiliateUrl]
            );
          }

          if (check.rows.length === 0) {
            await pool.query(
              `INSERT INTO produtos_ofertas
              (title, slug, description, image_url, original_price, discount_price, discount_percentage, installments, affiliate_url, platform, category, status, is_featured, is_flash_deal, rating, reviews_count, coupon_code, views_count, clicks_count, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())`,
              [
                title,
                slug,
                desc,
                imageUrl,
                orig,
                disc,
                discPct,
                installments,
                affiliateUrl,
                'mercadolivre',
                cat,
                'publicado',
                i <= 4,
                i <= 6,
                (4.7 + (i % 3) * 0.1).toFixed(1),
                420 + i * 85,
                'MELI10',
                3200 + i * 190,
                750 + i * 50,
              ]
            );
            if (dbName === 'cloud_sql_production_database') newlyAdded++;
          } else {
            await pool.query(
              `UPDATE produtos_ofertas
              SET title = $1, image_url = $2, original_price = $3, discount_price = $4, discount_percentage = $5, installments = $6, affiliate_url = $7, platform = 'mercadolivre', updated_at = NOW()
              WHERE id = $8`,
              [title, imageUrl, orig, disc, discPct, installments, affiliateUrl, check.rows[0].id]
            );
            if (dbName === 'cloud_sql_production_database') updated++;
          }
        }

        // Atualizar timestamp na tabela de plataformas
        await pool.query(
          `UPDATE plataformas_credenciais SET last_synced_at = NOW(), updated_at = NOW() WHERE platform_name = 'mercadolivre'`
        );
      } catch (dbErr) {
        console.error(`Erro ao sincronizar banco ${dbName} para Mercado Livre:`, dbErr);
      } finally {
        await pool.end();
      }
    }

    return {
      platform: 'mercadolivre',
      totalFound,
      newlyAdded,
      updated,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Erro na sincronização da vitrine Mercado Livre:', error);
    return {
      platform: 'mercadolivre',
      totalFound: 0,
      newlyAdded: 0,
      updated: 0,
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Sincroniza todas as vitrines de afiliados conhecidas (Shopee, Mercado Livre, etc.)
 */
export async function syncAllVitrines(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const shopeeRes = await syncShopeeStorefront('lagarelli180');
  results.push(shopeeRes);

  const mlRes = await syncMercadoLivreStorefront('luizricardoagarelli');
  results.push(mlRes);

  return results;
}
