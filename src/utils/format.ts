import { PlatformType } from '../types/store.ts';

export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatNumber(val: number | string | undefined | null): string {
  if (!val) return '0';
  return Number(val).toLocaleString('pt-BR');
}

export interface PlatformMeta {
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
  tagline: string;
}

export const PLATFORM_CONFIG: Record<PlatformType, PlatformMeta> = {
  shopee: {
    name: 'Shopee',
    badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    badgeText: 'text-orange-600',
    borderColor: 'border-orange-500',
    accentBg: 'bg-orange-500',
    tagline: 'Frete Grátis e Cupons Exclusivos',
  },
  amazon: {
    name: 'Amazon',
    badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    badgeText: 'text-amber-600',
    borderColor: 'border-amber-500',
    accentBg: 'bg-amber-500',
    tagline: 'Entrega Prime e Garantia Total',
  },
  mercadolivre: {
    name: 'Mercado Livre',
    badgeBg: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    badgeText: 'text-yellow-600',
    borderColor: 'border-yellow-400',
    accentBg: 'bg-yellow-400 text-slate-900',
    tagline: 'Entrega Full Mais Rápida do Brasil',
  },
  lojadomecanico: {
    name: 'Loja do Mecânico',
    badgeBg: 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30',
    badgeText: 'text-stone-700',
    borderColor: 'border-stone-600',
    accentBg: 'bg-stone-800 text-white',
    tagline: 'O Maior E-commerce de Ferramentas da AL',
  },
  aliexpress: {
    name: 'AliExpress',
    badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    badgeText: 'text-red-600',
    borderColor: 'border-red-500',
    accentBg: 'bg-red-600',
    tagline: 'Choice & Remessa Conforme com Impostos Pagos',
  },
  temu: {
    name: 'Temu',
    badgeBg: 'bg-orange-600/10 text-orange-700 dark:text-orange-400 border-orange-600/30',
    badgeText: 'text-orange-600',
    borderColor: 'border-orange-600',
    accentBg: 'bg-orange-600',
    tagline: 'Mega Descontos e Envio Seguro',
  },
};

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve(true);
    } catch {
      textArea.remove();
      return Promise.resolve(false);
    }
  }
}
