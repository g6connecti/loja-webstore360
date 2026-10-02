/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { FilterBar } from './components/FilterBar.tsx';
import { ShowcaseCarousel } from './components/ShowcaseCarousel.tsx';
import { OfferCard } from './components/OfferCard.tsx';
import { OfferDetailModal } from './components/OfferDetailModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { ArchitectureModal } from './components/ArchitectureModal.tsx';
import { Toast } from './components/Toast.tsx';
import { Footer } from './components/Footer.tsx';
import { Offer } from './types/store.ts';
import { Zap, ShoppingBag, AlertCircle, Wrench, Package, Sparkles, Globe, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';
import { fetchOffersDirectly, subscribeToOffersRealtime, triggerVitrineSync, isSupabaseConfigured } from './lib/supabase.ts';

// Função utilitária para deduplicação rigorosa de ofertas
function deduplicateOffers(items: Offer[]): Offer[] {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenKeys = new Set<string>();
  const result: Offer[] = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    if (seenIds.has(item.id)) continue;
    if (item.slug && seenSlugs.has(item.slug)) continue;

    // Normalização do título para evitar duplicatas com pequenas variações de texto na mesma plataforma
    const normTitle = (item.title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 32);

    const platformKey = `${(item.platform || '').toLowerCase()}_${normTitle}`;
    if (normTitle && seenKeys.has(platformKey)) continue;

    seenIds.add(item.id);
    if (item.slug) seenSlugs.add(item.slug);
    if (normTitle) seenKeys.add(platformKey);
    result.push(item);
  }
  return result;
}

function PublicShowcase() {
  const { token } = useAuth();
  
  // Data states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncingVitrine, setIsSyncingVitrine] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [flashDealsOnly, setFlashDealsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('title_asc');

  // Modals
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [shareOffer, setShareOffer] = useState<Offer | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOffersDirectly({
        platform: selectedPlatform,
        category: selectedCategory,
        search: searchQuery,
        flashDealsOnly,
        sortBy: sortBy as any,
        status: 'publicado',
      });
      setOffers(deduplicateOffers(data));
    } catch (err: any) {
      console.error('Error fetching offers from Supabase:', err);
      setError(err.message || 'Erro ao carregar ofertas do Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [selectedPlatform, selectedCategory, flashDealsOnly, sortBy, token]);

  // Supabase Realtime subscription ("Ao Vivo")
  useEffect(() => {
    const unsubscribe = subscribeToOffersRealtime((payload) => {
      if (payload.eventType === 'INSERT' && payload.newOffer) {
        setOffers((prev) => deduplicateOffers([payload.newOffer!, ...prev]));
        showToast(`⚡ Nova oferta "${payload.newOffer.title.slice(0, 32)}..." recebida ao vivo!`);
      } else if (payload.eventType === 'UPDATE' && payload.newOffer) {
        setOffers((prev) =>
          deduplicateOffers(prev.map((o) => (o.id === payload.newOffer!.id ? payload.newOffer! : o)))
        );
        showToast('⚡ Oferta atualizada ao vivo!');
      } else if (payload.eventType === 'DELETE' && payload.oldOfferId) {
        setOffers((prev) => prev.filter((o) => o.id !== payload.oldOfferId));
        showToast('Oferta removida ao vivo.');
      }
    });

    // Auto-sync suave das vitrines na montagem
    triggerVitrineSync()
      .then((res) => {
        if (res.success && res.data?.newlyAdded > 0) {
          fetchOffers();
          showToast(`⚡ ${res.data.newlyAdded} novos produtos da vitrine adicionados!`);
        }
        if (res.data?.syncedAt) {
          setLastSyncTime(new Date(res.data.syncedAt).toLocaleTimeString('pt-BR'));
        }
      })
      .catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncingVitrine(true);
    showToast('🔄 Sincronizando produtos da vitrine das plataformas...');
    try {
      const res = await triggerVitrineSync();
      if (res.success) {
        showToast(`✅ ${res.message}`);
        await fetchOffers();
        setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
      } else {
        showToast(res.message || 'Erro ao sincronizar vitrines.');
      }
    } catch {
      showToast('Erro ao conectar com serviço de sincronização.');
    } finally {
      setIsSyncingVitrine(false);
    }
  };

  // Instant search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOffers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Categories list
  const categories = useMemo(() => {
    return [
      'Doces & Queijos Mineiros',
      'Cafés & Gourmet',
      'Utensílios & Café',
      'Eletrônicos',
      'Smartphones',
      'Ferramentas',
      'Casa Inteligente',
      'Áudio',
      'Games',
      'Beleza & Perfumaria',
    ];
  }, []);

  // Filtered subsets for the Carousels
  const flashDeals = useMemo(() => {
    return deduplicateOffers(offers.filter((o) => o.isFlashDeal));
  }, [offers]);

  const mercadoLivreDeals = useMemo(() => {
    return deduplicateOffers(
      offers.filter((o) => {
        const p = (o.platform || '').toLowerCase().replace(/[\s_-]/g, '');
        return p === 'mercadolivre' || p === 'meli';
      })
    );
  }, [offers]);

  const shopeeDeals = useMemo(() => {
    return deduplicateOffers(
      offers.filter((o) => {
        const p = (o.platform || '').toLowerCase().replace(/[\s_-]/g, '');
        return p === 'shopee';
      })
    );
  }, [offers]);

  const amazonDeals = useMemo(() => {
    return deduplicateOffers(
      offers.filter((o) => {
        const p = (o.platform || '').toLowerCase().replace(/[\s_-]/g, '');
        return p === 'amazon';
      })
    );
  }, [offers]);

  const temuDeals = useMemo(() => {
    return deduplicateOffers(offers.filter((o) => o.platform === 'temu'));
  }, [offers]);

  const aliexpressDeals = useMemo(() => {
    return deduplicateOffers(offers.filter((o) => o.platform === 'aliexpress'));
  }, [offers]);

  const lojaDoMecanicoDeals = useMemo(() => {
    return deduplicateOffers(offers.filter((o) => o.platform === 'lojadomecanico'));
  }, [offers]);

  // Full catalog cards strictly ordered alphabetically by product title (A - Z)
  const catalogOffersAlphabetical = useMemo(() => {
    return deduplicateOffers([...offers]).sort((a, b) =>
      a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base', numeric: true })
    );
  }, [offers]);

  const activeFilterCount =
    (selectedPlatform !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (flashDealsOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setFlashDealsOnly(false);
    setSearchQuery('');
  };

  const isBrowsingFiltered = searchQuery.trim().length > 0 || selectedCategory !== 'all' || selectedPlatform !== 'all' || flashDealsOnly;

  return (
    <div className="min-h-screen flex flex-col bg-[#121214] text-[#e1e1e6] selection:bg-purple-600 selection:text-white">
      
      {/* 1. Header with Instant Search & Admin / Architecture actions */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* 2. Hero Banner with Platform Filters (Shopee, Amazon, etc.) */}
      <HeroBanner
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        flashDealsOnly={flashDealsOnly}
        onToggleFlashDeals={() => setFlashDealsOnly((prev) => !prev)}
        totalOffers={offers.length}
      />

      {/* 3. Category Chips and Sort Filter Bar */}
      <FilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
        totalOffers={offers.length}
      />

      {/* 4. Main Public Showcase Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        {/* Realtime Live Status & Platform Vitrine Sync Bar */}
        <div className="bg-[#18181b]/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ring-1 ring-white/5">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/50 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-white tracking-wide uppercase">
                  Ao Vivo • Supabase Realtime & Vitrines
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  Sincronização Ativa
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Novos produtos adicionados na sua vitrine da Shopee, Mercado Livre ou Supabase são atualizados automaticamente aqui.
                {lastSyncTime && (
                  <span className="text-zinc-500 ml-1.5">
                    (Última sincronização: {lastSyncTime})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isSyncingVitrine}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:from-[#7145d6] hover:to-[#e0006c] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 active:scale-95 disabled:opacity-60"
              title="Busca produtos recém adicionados na sua vitrine de afiliados Shopee e Mercado Livre"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVitrine ? 'animate-spin' : ''}`} />
              <span>{isSyncingVitrine ? 'Sincronizando Vitrine...' : 'Sincronizar Minha Vitrine'}</span>
            </button>
          </div>
        </div>

        {/* Error notification banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-xs font-semibold">{error}</span>
            </div>
            <button
              onClick={fetchOffers}
              className="px-3 py-1 bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Recarregar
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && offers.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#18181b] rounded-2xl p-3 border border-zinc-800 animate-pulse space-y-3"
              >
                <div className="aspect-square bg-zinc-800 rounded-xl" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="h-7 bg-zinc-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="py-20 text-center bg-[#18181b] rounded-3xl border border-dashed border-zinc-800 p-8 my-8">
            <ShoppingBag className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              Nenhuma oferta encontrada
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
              Não encontramos ofertas para o filtro atual. Tente limpar os filtros para explorar o catálogo completo.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:from-[#7145d6] hover:to-[#e0006c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              Ver Todas as Promoções
            </button>
          </div>
        ) : !isBrowsingFiltered ? (
          /* SHOWCASE CAROUSELS VIEW (When no specific search/filter is active) */
          <div className="space-y-4">
            
            {/* Carousel 1: Ofertas Relâmpago (Flash Deals) */}
            {flashDeals.length > 0 && (
              <ShowcaseCarousel
                title="Ofertas Relâmpago com Desconto Agressivo"
                showBlinkingDot={true}
                subtitle="Produtos com desconto máximo e estoque limitado nas plataformas parceiras"
                badgeText="Tempo Limitado"
                icon={<Zap className="w-5 h-5 text-amber-400 fill-amber-400" />}
                offers={flashDeals}
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setFlashDealsOnly(true)}
              />
            )}

            {/* Carousel 2: Mercado Livre Oficial Storefront */}
            {mercadoLivreDeals.length > 0 && (
              <ShowcaseCarousel
                title="Achados & Recomendações Mercado Livre"
                subtitle="Seleção oficial da vitrine de afiliados WEBSTORE360 com entrega rápida e frete grátis"
                badgeText="Mercado Livre Oficial"
                icon={<ShoppingBag className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />}
                offers={mercadoLivreDeals}
                externalStorefrontUrl="https://www.mercadolivre.com.br/social/luizricardoagarelli/lists"
                storefrontLabel="Minha Vitrine Mercado Livre 📦"
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('mercadolivre')}
              />
            )}

            {/* Carousel 3: Shopee Oficial Storefront */}
            {shopeeDeals.length > 0 && (
              <ShowcaseCarousel
                title="Achadinhos & Ofertas Oficiais Shopee"
                subtitle="Seleção oficial com frete grátis, cupons exclusivos e os melhores achados da vitrine lagarelli180"
                badgeText="Shopee Oficial"
                icon={<ShoppingBag className="w-5 h-5 text-orange-500 fill-orange-500/20" />}
                offers={shopeeDeals}
                externalStorefrontUrl="https://collshp.com/lagarelli180?share_channel_code=1&view=storefront"
                storefrontLabel="Minha Vitrine Shopee"
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('shopee')}
              />
            )}

            {/* Carousel 4: Amazon Oficial Storefront */}
            {amazonDeals.length > 0 && (
              <ShowcaseCarousel
                title="Seleção Prime & Ofertas Amazon"
                subtitle="Dispositivos Echo com Alexa, Kindle, eletrônicos e entrega super rápida Prime"
                badgeText="Amazon Prime"
                icon={<Package className="w-5 h-5 text-amber-400 fill-amber-400/20" />}
                offers={amazonDeals}
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('amazon')}
              />
            )}

            {/* Carousel 4: Temu Oficial Storefront */}
            {temuDeals.length > 0 && (
              <ShowcaseCarousel
                title="Super Achados & Descontos Temu"
                subtitle="✨ Descubra coisas incríveis na vitrine com pack de cupons especial e preços imbatíveis!"
                badgeText="Temu Oficial"
                icon={<Sparkles className="w-5 h-5 text-pink-500 fill-pink-500/20" />}
                offers={temuDeals}
                externalStorefrontUrl="https://temu.to/k/gjscu6s338i"
                storefrontLabel="Pack de Cupons & Vitrine 🎁"
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('temu')}
              />
            )}

            {/* Carousel 5: AliExpress Choice Oficial Storefront */}
            {aliexpressDeals.length > 0 && (
              <ShowcaseCarousel
                title="AliExpress Choice & Super Ofertas"
                subtitle="Selo Choice com frete grátis, entrega combinada rápida e impostos aduaneiros inclusos"
                badgeText="AliExpress Choice"
                icon={<Globe className="w-5 h-5 text-red-500 fill-red-500/20" />}
                offers={aliexpressDeals}
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('aliexpress')}
              />
            )}

            {/* Carousel 6: Loja do Mecânico Oficial Storefront */}
            {lojaDoMecanicoDeals.length > 0 && (
              <ShowcaseCarousel
                title="Loja do Mecânico • Ferramentas & Máquinas"
                subtitle="Seleção oficial do parceiro com descontos de fábrica, garantia e envio rápido"
                badgeText="Parceiro Oficial"
                icon={<Wrench className="w-5 h-5 text-amber-500 fill-amber-500/20" />}
                offers={lojaDoMecanicoDeals}
                externalStorefrontUrl="https://www.lojadomecanico.com.br/parceiro/X2bTZwI8TsWzqqpT2gfmPA?utm_campaign=afiliado-X2bTZwI8TsWzqqpT2gfmPA&utm_source=afiliado&utm_medium=site"
                storefrontLabel="Loja do Parceiro"
                onOpenDetails={setSelectedOffer}
                onShare={setShareOffer}
                onShowToast={showToast}
                onViewAll={() => setSelectedPlatform('lojadomecanico')}
              />
            )}

            {/* Full Showcase Grid Section */}
            <section className="pt-8 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Catálogo Completo de Ofertas</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      A - Z
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Todas as ofertas publicadas organizadas em ordem alfabética pelo nome do produto
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-400">
                  {catalogOffersAlphabetical.length} produtos disponíveis
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {catalogOffersAlphabetical.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onOpenDetails={setSelectedOffer}
                    onShare={setShareOffer}
                    onShowToast={showToast}
                  />
                ))}
              </div>
            </section>

          </div>
        ) : (
          /* FILTERED GRID VIEW (When searching or filtering by platform/category) */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Resultados da Busca
                </h2>
                <p className="text-xs text-zinc-400">
                  Exibindo produtos para os filtros selecionados
                </p>
              </div>

              <button
                onClick={resetFilters}
                className="text-xs font-bold text-pink-400 hover:underline"
              >
                Limpar todos os filtros ({activeFilterCount})
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onOpenDetails={setSelectedOffer}
                  onShare={setShareOffer}
                  onShowToast={showToast}
                />
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* Offer Details Modal */}
      <OfferDetailModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onShare={setShareOffer}
        onShowToast={showToast}
      />

      {/* Share Modal */}
      <ShareModal
        offer={shareOffer}
        onClose={() => setShareOffer(null)}
        onShowToast={showToast}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshOffers={fetchOffers}
        onShowToast={showToast}
      />

      {/* Architecture & SQL Viewer Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PublicShowcase />
    </AuthProvider>
  );
}
