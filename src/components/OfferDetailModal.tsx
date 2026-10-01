import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Star, Zap, Share2, Shield, Truck, Calendar, Tag } from 'lucide-react';
import { Offer } from '../types/store.ts';
import { formatCurrency, PLATFORM_CONFIG, copyToClipboard } from '../utils/format.ts';
import { recordClickDirectly } from '../lib/supabase.ts';

interface OfferDetailModalProps {
  offer: Offer | null;
  onClose: () => void;
  onShare: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
}

export const OfferDetailModal: React.FC<OfferDetailModalProps> = ({
  offer,
  onClose,
  onShare,
  onShowToast,
}) => {
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  if (!offer) return null;

  const platformMeta = PLATFORM_CONFIG[offer.platform] || {
    name: offer.platform,
    badgeBg: 'bg-slate-100 text-slate-800',
    borderColor: 'border-slate-300',
    accentBg: 'bg-slate-800 text-white',
    badgeText: 'text-slate-800',
    tagline: 'Oferta Verificada',
  };

  const handleCopyCoupon = async () => {
    if (!offer.couponCode) return;
    const ok = await copyToClipboard(offer.couponCode);
    if (ok) {
      setCopiedCoupon(true);
      onShowToast(`Cupom ${offer.couponCode} copiado!`);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const handleGoToStore = () => {
    recordClickDirectly(offer.id);
    window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-lg border ${platformMeta.badgeBg}`}
            >
              Loja: {platformMeta.name}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Categoria: {offer.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Image */}
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 rounded-2xl p-6 flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <img
                src={offer.imageUrl}
                alt={offer.title}
                className="max-h-full max-w-full object-contain"
              />
              {offer.discountPercentage && offer.discountPercentage > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white font-black text-sm rounded-xl shadow-lg">
                  -{offer.discountPercentage}% OFF
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div>
                {offer.rating && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(Number(offer.rating)) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {Number(offer.rating).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({offer.reviewsCount || 0} avaliações de compradores)
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {offer.title}
                </h2>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                {Number(offer.originalPrice) > Number(offer.discountPrice) && (
                  <p className="text-xs text-slate-400 line-through">
                    Preço original: {formatCurrency(offer.originalPrice)}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(offer.discountPrice)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    no Pix ou Boleto
                  </span>
                </div>
                {offer.installments && (
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Parcelamento: {offer.installments}
                  </p>
                )}
              </div>

              {/* Coupon Action */}
              {offer.couponCode && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-dashed border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Cupom de Desconto Especial
                    </p>
                    <code className="text-sm font-black text-slate-900 dark:text-white">
                      {offer.couponCode}
                    </code>
                  </div>
                  <button
                    onClick={handleCopyCoupon}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
                  >
                    {copiedCoupon ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCoupon ? 'Copiado!' : 'Copiar Cupom'}</span>
                  </button>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/40">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Link de afiliado seguro</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/40">
                  <Truck className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>Entrega oficial da plataforma</span>
                </div>
              </div>
            </div>

          </div>

          {/* Description */}
          {offer.description && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Destaques & Especificações
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {offer.description}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onShare(offer)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar Promoção</span>
          </button>

          <button
            onClick={handleGoToStore}
            className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>Ir para a Loja Oficial ({platformMeta.name})</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
