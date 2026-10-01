import React from 'react';
import { Zap, Flame, ShieldCheck, Tag, Sparkles, TrendingUp, CheckCircle2, Radio } from 'lucide-react';
import { PlatformType } from '../types/store.ts';

interface HeroBannerProps {
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  flashDealsOnly: boolean;
  onToggleFlashDeals: () => void;
  totalOffers: number;
}

const PLATFORMS: { id: PlatformType; name: string; color: string; badge: string }[] = [
  { id: 'shopee', name: 'Shopee', color: 'from-orange-500 to-red-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'amazon', name: 'Amazon', color: 'from-amber-400 to-yellow-500', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  { id: 'mercadolivre', name: 'Mercado Livre', color: 'from-yellow-400 to-yellow-600', badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  { id: 'lojadomecanico', name: 'Loja do Mecânico', color: 'from-orange-600 to-zinc-700', badge: 'bg-zinc-700/20 text-orange-400 border-zinc-700' },
  { id: 'temu', name: 'Temu', color: 'from-orange-500 to-amber-600', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
  { id: 'aliexpress', name: 'AliExpress', color: 'from-red-500 to-rose-600', badge: 'bg-red-500/10 text-red-400 border-red-500/30' },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedPlatform,
  onSelectPlatform,
  flashDealsOnly,
  onToggleFlashDeals,
  totalOffers,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#121214] via-[#16161a] to-[#121214] border-b border-zinc-800/80 pt-8 pb-10 text-white">
      {/* Background glow effects - Electric Purple & Neon Pink */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 translate-y-1/4 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
          
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Public Showcase • WebStore360 Oficial</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white mb-3">
              Economize até <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8257e5] via-[#c24bf8] to-[#ff007a]">70% OFF</span> nas maiores lojas do Brasil.
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
              Curadoria inteligente e carrosséis com ofertas sincronizadas em tempo real com as APIs da Shopee e Amazon. Cupons testados e links com garantia de comissão e segurança.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5 bg-[#18181b] px-3 py-1.5 rounded-xl border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span><strong className="text-white font-bold">{totalOffers}</strong> Ofertas ao Vivo</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#18181b] px-3 py-1.5 rounded-xl border border-zinc-800">
                <Flame className="w-4 h-4 text-pink-400" />
                <span>Descontos até 70%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#18181b] px-3 py-1.5 rounded-xl border border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Supabase PostgreSQL Protegido</span>
              </div>
            </div>
          </div>

          {/* Flash Deals Card with vibrant gradient */}
          <div className="w-full lg:w-auto bg-[#18181b] border border-zinc-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm shrink-0 lg:min-w-[320px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/20 via-purple-500/10 to-transparent pointer-events-none rounded-bl-full" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8257e5] to-[#ff007a] text-white shadow-lg shadow-purple-600/30">
                  <Zap className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Ofertas Relâmpago</h3>
                  <p className="text-xs text-zinc-400">Tempo & Estoque Limitados</p>
                </div>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            </div>

            <button
              onClick={onToggleFlashDeals}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                flashDealsOnly
                  ? 'bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white shadow-lg shadow-purple-600/40 ring-2 ring-pink-500/30'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{flashDealsOnly ? 'Exibindo Apenas Relâmpago' : 'Filtrar Ofertas Relâmpago'}</span>
            </button>
          </div>

        </div>

        {/* Platform Filter Buttons */}
        <div className="pt-2 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Filtrar por Plataforma de Afiliado:
            </span>
            {selectedPlatform !== 'all' && (
              <button
                onClick={() => onSelectPlatform('all')}
                className="text-xs text-pink-400 hover:underline font-bold"
              >
                Limpar filtro
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => onSelectPlatform('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                selectedPlatform === 'all'
                  ? 'bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white border-transparent shadow-lg shadow-purple-600/30'
                  : 'bg-[#18181b] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              Todas as Plataformas
            </button>

            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPlatform(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 border-white shadow-xl'
                      : 'bg-[#18181b] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${p.color}`} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
