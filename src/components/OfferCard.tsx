import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Star, Zap, Share2, Eye, MousePointerClick } from 'lucide-react';
import { Offer } from '../types/store.ts';
import { formatCurrency, PLATFORM_CONFIG, copyToClipboard } from '../utils/format.ts';
import { recordClickDirectly } from '../lib/supabase.ts';

interface OfferCardProps {
  offer: Offer;
  onOpenDetails: (offer: Offer) => void;
  onShare: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onOpenDetails,
  onShare,
  onShowToast,
}) => {
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [clicking, setClicking] = useState(false);

  const platformMeta = PLATFORM_CONFIG[offer.platform] || {
    name: offer.platform,
    badgeBg: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    borderColor: 'border-zinc-700',
    accentBg: 'bg-zinc-800 text-white',
    badgeText: 'text-zinc-200',
    tagline: 'Oferta Verificada',
  };

  const handleCopyCoupon = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!offer.couponCode) return;
    const ok = await copyToClipboard(offer.couponCode);
    if (ok) {
      setCopiedCoupon(true);
      onShowToast(`Cupom ${offer.couponCode} copiado com sucesso!`);
      setTimeout(() => setCopiedCoupon(false), 2500);
    }
  };

  const handleClickDeal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setClicking(true);

    try {
      recordClickDirectly(offer.id);
    } catch {
      // ignore
    }

    window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setClicking(false), 1000);
  };

  return (
    <div
      onClick={() => onOpenDetails(offer)}
      className="group relative bg-[#18181b] rounded-2xl border border-zinc-800/90 shadow-lg hover:shadow-2xl hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer h-full hover:-translate-y-1"
    >
      {/* Product Image Section */}
      <div className="relative w-full aspect-square bg-[#202024] overflow-hidden flex items-center justify-center p-3.5 border-b border-zinc-800/60">
        <img
          src={offer.imageUrl}
          alt={offer.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Discount & Flash Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {offer.discountPercentage && offer.discountPercentage > 0 && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-[11px] rounded-lg shadow-md uppercase tracking-wider">
              -{offer.discountPercentage}%
            </span>
          )}

          {offer.isFlashDeal && (
            <span className="px-2 py-0.5 bg-amber-400 text-zinc-950 font-black text-[10px] rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 fill-zinc-950" />
              Relâmpago
            </span>
          )}
        </div>

        {/* Platform Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border backdrop-blur-md shadow-sm ${platformMeta.badgeBg}`}
          >
            {platformMeta.name}
          </span>
        </div>

        {/* Hover Share Quick Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(offer);
          }}
          title="Compartilhar"
          className="absolute bottom-2.5 right-2.5 p-1.5 bg-zinc-900/90 text-zinc-300 rounded-lg shadow-md opacity-0 group-hover:opacity-100 hover:text-pink-400 border border-zinc-700 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-400">
              {offer.category}
            </span>
            {offer.rating && (
              <div className="flex items-center gap-1 font-semibold text-zinc-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(offer.rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors mb-2.5"
            title={offer.title}
          >
            {offer.title}
          </h3>

          {/* Coupon Box if available */}
          {offer.couponCode && (
            <div className="mb-2.5 p-1.5 rounded-lg bg-purple-500/10 border border-dashed border-purple-500/40 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="text-[9px] font-bold text-pink-400 uppercase">
                  Cupom:
                </span>
                <code className="text-[11px] font-mono font-black text-purple-200 truncate">
                  {offer.couponCode}
                </code>
              </div>
              <button
                onClick={handleCopyCoupon}
                className="shrink-0 px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded shadow-sm flex items-center gap-1 transition-all active:scale-95"
              >
                {copiedCoupon ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedCoupon ? 'Ok' : 'Copiar'}</span>
              </button>
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-0.5 mb-2.5">
            {Number(offer.originalPrice) > Number(offer.discountPrice) && (
              <p className="text-[11px] text-zinc-500 line-through">
                De {formatCurrency(offer.originalPrice)}
              </p>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                {formatCurrency(offer.discountPrice)}
              </span>
            </div>
            {offer.installments && (
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                {offer.installments}
              </p>
            )}
          </div>
        </div>

        {/* CTA Button with Vibrant Gradient (Electric Purple to Neon Pink) */}
        <div className="pt-2.5 border-t border-zinc-800/80 space-y-1.5">
          <button
            onClick={handleClickDeal}
            disabled={clicking}
            className="w-full py-2 px-3 bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:from-[#7145d6] hover:to-[#e0006c] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>Pegar Promoção</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 px-0.5">
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-2.5 h-2.5" />
              {offer.clicksCount || 0} cliques
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              {offer.viewsCount || 0} views
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
