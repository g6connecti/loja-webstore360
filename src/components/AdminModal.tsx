import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Sliders,
  Database,
  Key,
  Flame,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Offer, PlatformCredential, AdminStats, OfferStatus } from '../types/store.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { formatCurrency, PLATFORM_CONFIG } from '../utils/format.ts';
import { NewOfferModal } from './NewOfferModal.tsx';
import { PlatformEditModal } from './PlatformEditModal.tsx';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshOffers: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onRefreshOffers,
  onShowToast,
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'offers' | 'platforms' | 'schema'>('offers');
  
  // Data states
  const [offers, setOffers] = useState<Offer[]>([]);
  const [platforms, setPlatforms] = useState<PlatformCredential[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters inside admin offers
  const [adminSearch, setAdminSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'publicado' | 'rascunho'>('all');

  // Submodals
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<PlatformCredential | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resOffers, resPlatforms, resStats] = await Promise.all([
        fetch('/api/offers?status=all', { headers }),
        fetch('/api/admin/platforms', { headers }),
        fetch('/api/admin/stats', { headers }),
      ]);

      if (resOffers.ok) {
        const d = await resOffers.json();
        setOffers(d.data || []);
      }
      if (resPlatforms.ok) {
        const d = await resPlatforms.json();
        setPlatforms(d.data || []);
      }
      if (resStats.ok) {
        const d = await resStats.json();
        setStats(d.data || null);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Offer Status
  const handleToggleStatus = async (offer: Offer) => {
    const nextStatus: OfferStatus = offer.status === 'publicado' ? 'rascunho' : 'publicado';
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        onShowToast(`Status alterado para "${nextStatus.toUpperCase()}"!`);
        fetchAdminData();
        onRefreshOffers();
      }
    } catch {
      onShowToast('Erro ao atualizar status');
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja remover a oferta "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onShowToast('Oferta removida com sucesso!');
        fetchAdminData();
        onRefreshOffers();
      }
    } catch {
      onShowToast('Erro ao remover oferta');
    }
  };

  // Save new / edited offer
  const handleSaveOffer = async (offerData: any) => {
    const isEdit = !!editingOffer;
    const url = isEdit ? `/api/admin/offers/${editingOffer.id}` : '/api/admin/offers';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(offerData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao salvar');
    }

    onShowToast(isEdit ? 'Oferta atualizada no PostgreSQL!' : 'Nova oferta cadastrada com sucesso!');
    fetchAdminData();
    onRefreshOffers();
  };

  // Save platform credentials
  const handleSavePlatform = async (id: string, data: Partial<PlatformCredential>) => {
    const res = await fetch(`/api/admin/platforms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao salvar credenciais');
    }

    fetchAdminData();
  };

  // Sync platform catalog
  const handleSyncPlatform = async (id: string) => {
    const res = await fetch(`/api/admin/platforms/${id}/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao sincronizar');
    }

    fetchAdminData();
    onRefreshOffers();
  };

  const filteredOffers = offers.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch =
      !adminSearch ||
      o.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      o.platform.toLowerCase().includes(adminSearch.toLowerCase()) ||
      o.category.toLowerCase().includes(adminSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Painel de Controle WebStore360
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Cloud SQL PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão completa de ofertas, chaves de API das plataformas e RLS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              title="Recarregar Dados"
              className="p-2 text-slate-400 hover:text-emerald-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block">Total Ofertas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{stats.totalOffers}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">Publicadas (Ativas)</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.published}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-amber-500 font-semibold block">Rascunhos</span>
              <span className="text-xl font-black text-amber-500">{stats.drafts}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-sky-500 font-semibold block">Total de Cliques</span>
              <span className="text-xl font-black text-sky-500">{stats.totalClicks.toLocaleString('pt-BR')}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">Comissão Est.</span>
              <span className="text-xl font-black text-emerald-500">{formatCurrency(stats.estCommissionBrl)}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('offers')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'offers'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Gerenciar Ofertas ({offers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('platforms')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'platforms'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Plataformas & APIs de Afiliados ({platforms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Schema Oficial PostgreSQL (Supabase)</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* TAB 1: OFFERS CRUD */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Filtrar nesta lista..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="publicado">Apenas Publicados</option>
                    <option value="rascunho">Apenas Rascunhos</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingOffer(null);
                    setIsNewOfferOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Oferta</span>
                </button>
              </div>

              {/* Offers Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700/60">
                      <tr>
                        <th className="py-3 px-4">Produto</th>
                        <th className="py-3 px-4">Loja</th>
                        <th className="py-3 px-4">Preço Promocional</th>
                        <th className="py-3 px-4">Desconto</th>
                        <th className="py-3 px-4">Cliques</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredOffers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Nenhuma oferta encontrada com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        filteredOffers.map((offer) => {
                          const pMeta = PLATFORM_CONFIG[offer.platform];
                          return (
                            <tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 flex items-center gap-3">
                                <img
                                  src={offer.imageUrl}
                                  alt={offer.title}
                                  className="w-10 h-10 object-contain rounded-lg bg-slate-100 dark:bg-slate-800 p-1 shrink-0"
                                />
                                <div className="max-w-xs">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {offer.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{offer.category}</p>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${pMeta?.badgeBg}`}>
                                  {pMeta?.name || offer.platform}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-black text-slate-900 dark:text-white">
                                  {formatCurrency(offer.discountPrice)}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                {offer.discountPercentage ? (
                                  <span className="font-bold text-rose-500">
                                    -{offer.discountPercentage}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {offer.clicksCount || 0}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleToggleStatus(offer)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                                    offer.status === 'publicado'
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  }`}
                                  title="Clique para alternar Publicado / Rascunho"
                                >
                                  {offer.status}
                                </button>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingOffer(offer);
                                      setIsNewOfferOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Editar Oferta"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOffer(offer.id, offer.title)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Excluir Oferta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PLATFORMS CREDENTIALS */}
          {activeTab === 'platforms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Credenciais de APIs Protegidas (Supabase RLS)
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Configuração de chaves e tags de afiliado para Shopee, Amazon, Mercado Livre, Loja do Mecânico, Magalu, AliExpress e Temu.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((p) => {
                  const pMeta = PLATFORM_CONFIG[p.platformName];
                  return (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${pMeta?.badgeBg}`}>
                            {p.displayName}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                            }`}
                          >
                            {p.isActive ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {pMeta?.tagline}
                        </p>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400 font-sans">Partner ID: </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {p.affiliatePartnerId || 'Não configurado'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans">Frequência: </span>
                            <span>{p.syncFrequencyMinutes || 60} minutos</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans">Último Sync: </span>
                            <span className="text-emerald-500">
                              {p.lastSyncedAt
                                ? new Date(p.lastSyncedAt).toLocaleString('pt-BR')
                                : 'Nunca sincronizado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleSyncPlatform(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Sync Catálogo</span>
                        </button>
                        <button
                          onClick={() => setEditingPlatform(p)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Configurar Chaves</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: SCHEMA INSPECTOR */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">
                      Schema Oficial WebStore360 (Supabase / PostgreSQL)
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Instância Ativa: ai-studio-5aaa5b6a
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  As tabelas abaixo foram provisionadas e migradas na base de dados relacional oficial. Todas as operações de leitura e gravação passam pelo Drizzle ORM conectado via pool seguro à instância Cloud SQL.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  
                  {/* Table 1 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>1. public.produtos_ofertas</span>
                      <span className="text-[10px] text-slate-400">RLS ATIVADO</span>
                    </div>
                    <ul className="text-slate-300 space-y-1 pl-2 text-[11px]">
                      <li>• <strong className="text-white">id</strong> UUID PRIMARY KEY (gen_random_uuid)</li>
                      <li>• <strong className="text-white">title</strong> VARCHAR(255) NOT NULL</li>
                      <li>• <strong className="text-white">slug</strong> VARCHAR(280) UNIQUE</li>
                      <li>• <strong className="text-white">original_price, discount_price</strong> NUMERIC(10,2) NOT NULL</li>
                      <li>• <strong className="text-white">discount_percentage</strong> INTEGER (calculado)</li>
                      <li>• <strong className="text-white">platform</strong> (shopee, amazon, mercadolivre, lojadomecanico, magalu, etc.)</li>
                      <li>• <strong className="text-white">status</strong> ('rascunho', 'publicado')</li>
                      <li>• <strong className="text-white">clicks_count, views_count</strong> INTEGER</li>
                      <li>• <strong className="text-white">Trigger:</strong> trigger_produtos_ofertas_updated_at (handle_updated_at)</li>
                    </ul>
                  </div>

                  {/* Table 2 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>2. public.plataformas_credenciais</span>
                      <span className="text-[10px] text-slate-400">RLS PROTEGIDO</span>
                    </div>
                    <ul className="text-slate-300 space-y-1 pl-2 text-[11px]">
                      <li>• <strong className="text-white">id</strong> UUID PRIMARY KEY</li>
                      <li>• <strong className="text-white">platform_name</strong> VARCHAR(50) UNIQUE</li>
                      <li>• <strong className="text-white">affiliate_partner_id</strong> VARCHAR(150)</li>
                      <li>• <strong className="text-white">app_id, app_secret, api_key, webhook_secret</strong> TEXT</li>
                      <li>• <strong className="text-white">is_active</strong> BOOLEAN NOT NULL DEFAULT true</li>
                      <li>• <strong className="text-white">sync_frequency_minutes</strong> INT DEFAULT 60</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* New / Edit Offer Modal */}
      <NewOfferModal
        isOpen={isNewOfferOpen}
        onClose={() => setIsNewOfferOpen(false)}
        onSave={handleSaveOffer}
        editingOffer={editingOffer}
      />

      {/* Edit Platform Modal */}
      <PlatformEditModal
        platform={editingPlatform}
        onClose={() => setEditingPlatform(null)}
        onSave={handleSavePlatform}
        onSync={handleSyncPlatform}
      />

    </div>
  );
};
