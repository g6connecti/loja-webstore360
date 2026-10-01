import React, { useState, useEffect } from 'react';
import { X, Sparkles, Tag, DollarSign, Image, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Offer, PlatformType, OfferStatus } from '../types/store.ts';

interface NewOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (offerData: any) => Promise<void>;
  editingOffer?: Offer | null;
}

export const NewOfferModal: React.FC<NewOfferModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOffer,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [installments, setInstallments] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('shopee');
  const [category, setCategory] = useState('Eletrônicos');
  const [status, setStatus] = useState<OfferStatus>('publicado');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isFlashDeal, setIsFlashDeal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [rating, setRating] = useState('4.8');
  const [reviewsCount, setReviewsCount] = useState('120');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingOffer) {
      setTitle(editingOffer.title);
      setDescription(editingOffer.description || '');
      setImageUrl(editingOffer.imageUrl);
      setOriginalPrice(String(editingOffer.originalPrice));
      setDiscountPrice(String(editingOffer.discountPrice));
      setInstallments(editingOffer.installments || '');
      setAffiliateUrl(editingOffer.affiliateUrl);
      setPlatform(editingOffer.platform);
      setCategory(editingOffer.category);
      setStatus(editingOffer.status);
      setIsFeatured(editingOffer.isFeatured);
      setIsFlashDeal(editingOffer.isFlashDeal);
      setCouponCode(editingOffer.couponCode || '');
      setRating(String(editingOffer.rating || 4.8));
      setReviewsCount(String(editingOffer.reviewsCount || 0));
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setOriginalPrice('');
      setDiscountPrice('');
      setInstallments('');
      setAffiliateUrl('https://collshp.com/lagarelli180?share_channel_code=1&view=storefront');
      setPlatform('shopee');
      setCategory('Eletrônicos');
      setStatus('publicado');
      setIsFeatured(false);
      setIsFlashDeal(false);
      setCouponCode('');
      setRating('4.8');
      setReviewsCount('50');
    }
    setError(null);
  }, [editingOffer, isOpen]);

  if (!isOpen) return null;

  // Real-time discount calculation
  const orig = parseFloat(originalPrice) || 0;
  const disc = parseFloat(discountPrice) || 0;
  const discountPct = orig > 0 && disc < orig ? Math.round(((orig - disc) / orig) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !imageUrl.trim() || !affiliateUrl.trim() || !discountPrice) {
      setError('Por favor preencha os campos obrigatórios (Título, Imagem, Preço e Link de Afiliado).');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title,
        description,
        imageUrl,
        originalPrice: orig || disc,
        discountPrice: disc,
        discountPercentage: discountPct,
        installments: installments || undefined,
        affiliateUrl,
        platform,
        category,
        status,
        isFeatured,
        isFlashDeal,
        couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
        rating: parseFloat(rating) || 4.8,
        reviewsCount: parseInt(reviewsCount) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar oferta no banco PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {editingOffer ? 'Editar Oferta' : 'Cadastrar Nova Oferta'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Salva diretamente na tabela <code className="text-emerald-500 font-mono">public.produtos_ofertas</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título do Produto *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Smart TV 55 UHD 4K Samsung Crystal..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Platform and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Plataforma de Afiliado *
              </label>
              <select
                value={platform}
                onChange={(e) => {
                  const val = e.target.value as PlatformType;
                  setPlatform(val);
                  if (val === 'lojadomecanico') {
                    setAffiliateUrl('https://www.lojadomecanico.com.br/parceiro/X2bTZwI8TsWzqqpT2gfmPA?utm_campaign=afiliado-X2bTZwI8TsWzqqpT2gfmPA&utm_source=afiliado&utm_medium=site');
                    setCategory('Ferramentas');
                  } else if (val === 'shopee') {
                    setAffiliateUrl('https://collshp.com/lagarelli180?share_channel_code=1&view=storefront');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="shopee">Shopee</option>
                <option value="amazon">Amazon</option>
                <option value="mercadolivre">Mercado Livre</option>
                <option value="lojadomecanico">Loja do Mecânico</option>
                <option value="temu">Temu</option>
                <option value="aliexpress">AliExpress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoria *
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Eletrônicos, Smartphones, Games..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
              </input>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preço Original (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Ex: 3299.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preço Promocional (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Ex: 2199.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Desconto Calculado
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-between">
                <span>{discountPct > 0 ? `-${discountPct}% OFF` : 'Sem desconto'}</span>
                <span className="text-[10px] text-slate-400">Automático</span>
              </div>
            </div>
          </div>

          {/* Installments & Coupon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Texto de Parcelamento
              </label>
              <input
                type="text"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                placeholder="Ex: 10x de R$ 219,90 sem juros"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Código do Cupom (Opcional)
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ex: QUERO50"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL da Imagem do Produto *
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link de Afiliado (com sua tag de rastreamento) *
              </label>
              <input
                type="url"
                required
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://shopee.com.br/link-de-afiliado..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descrição / Destaques
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes, modelo, garantia e vantagens do produto..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Flags and Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status no Catálogo
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('publicado')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    status === 'publicado'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Publicado (Ativo)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('rascunho')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    status === 'rascunho'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Rascunho
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isFlashDeal}
                  onChange={(e) => setIsFlashDeal(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Oferta Relâmpago ⚡</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Destaque ⭐</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Gravando no Postgres...' : editingOffer ? 'Salvar Alterações' : 'Criar Oferta'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
