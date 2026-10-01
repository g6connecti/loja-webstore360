import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Radio, ExternalLink } from 'lucide-react';
import { Offer } from '../types/store.ts';
import { OfferCard } from './OfferCard.tsx';

interface ShowcaseCarouselProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  showBlinkingDot?: boolean;
  offers: Offer[];
  icon?: React.ReactNode;
  externalStorefrontUrl?: string;
  storefrontLabel?: string;
  onOpenDetails: (offer: Offer) => void;
  onShare: (offer: Offer) => void;
  onShowToast: (msg: string) => void;
  onViewAll?: () => void;
}

export const ShowcaseCarousel: React.FC<ShowcaseCarouselProps> = ({
  title,
  subtitle,
  badgeText,
  showBlinkingDot,
  offers,
  icon,
  externalStorefrontUrl,
  storefrontLabel,
  onOpenDetails,
  onShare,
  onShowToast,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!offers || offers.length === 0) return null;

  return (
    <section className="py-8 relative">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 px-1">
        <div className="space-y-1">
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>{badgeText}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{title}</span>
              {showBlinkingDot && (
                <span className="flex h-3 w-3 relative inline-flex">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            {subtitle}
          </p>
        </div>

        {/* Carousel Actions & Navigation Buttons */}
        <div className="flex items-center gap-2 self-end">
          {externalStorefrontUrl && (
            <a
              href={externalStorefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md hover:shadow-orange-500/20 transition-all active:scale-95"
            >
              <span>{storefrontLabel || 'Minha Vitrine'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-purple-500/50 transition-all shadow-md active:scale-95"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-purple-500/50 transition-all shadow-md active:scale-95"
            aria-label="Rolar para direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track - Up to 6 cards visible on large screens */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="w-[280px] sm:w-[260px] md:w-[240px] lg:w-[220px] xl:w-[200px] shrink-0 snap-start flex flex-col"
          >
            <OfferCard
              offer={offer}
              onOpenDetails={onOpenDetails}
              onShare={onShare}
              onShowToast={onShowToast}
            />
          </div>
        ))}

        {/* Pulsating End-of-Carousel Live Counter Card */}
        <div className="w-[260px] sm:w-[240px] md:w-[220px] lg:w-[210px] shrink-0 snap-start flex flex-col justify-center items-center text-center p-6 rounded-2xl bg-gradient-to-b from-[#1a1a1e] to-[#121214] border-2 border-dashed border-purple-500/40 relative overflow-hidden group hover:border-pink-500 transition-all shadow-xl">
          
          {/* Animated Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-transparent pointer-events-none" />

          {/* Pulsating Radar Ping */}
          <div className="relative mb-4 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-14 w-14 rounded-full bg-pink-500 opacity-30" />
            <span className="animate-pulse absolute inline-flex h-10 w-10 rounded-full bg-purple-500/40" />
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8257e5] to-[#ff007a] flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1 relative z-10 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Ao Vivo no Supabase</span>
            </div>
            
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-pink-500">
              +{offers.length} Ofertas
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-snug">
              Sincronizadas em tempo real com APIs Shopee & Amazon
            </p>
          </div>

          <button
            onClick={onViewAll}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:from-[#7145d6] hover:to-[#e0006c] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            Ver Todas
          </button>
        </div>

      </div>
    </section>
  );
};
