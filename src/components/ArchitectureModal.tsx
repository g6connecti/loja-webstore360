import React, { useState } from 'react';
import { X, Copy, Check, FolderTree, Database, Code, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { copyToClipboard } from '../utils/format.ts';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'folders' | 'sql'>('sql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const folderStructure = `webstore360/
├── .env.example                     # Variáveis de ambiente (SUPABASE_URL, SUPABASE_ANON_KEY)
├── index.html                       # Entry point HTML com metatags e viewport
├── package.json                     # React 19, Vite, Tailwind CSS v4, Lucide React, Shadcn/UI
├── vite.config.ts                   # Configuração de build, aliases @/ e proxy
├── tsconfig.json                    # Tipagem estrita TypeScript ES2022
│
├── supabase/                        # Configurações e Migrações do Supabase
│   ├── config.toml                  # Configuração do projeto Supabase local
│   ├── migrations/                  # Scripts SQL versionados
│   │   └── 20260930_init_schema.sql # Schema de produtos_ofertas, plataformas_credenciais e RLS
│   └── seed.sql                     # Dados iniciais para Shopee, Amazon e produtos
│
├── src/
│   ├── main.tsx                     # Ponto de inicialização do React DOM
│   ├── App.tsx                      # Componente raiz com Carrosséis e Showcase Público
│   ├── index.css                    # Tailwind CSS imports e tema escuro charcoal (#121214)
│   │
│   ├── lib/                         # Integrações e clientes de serviços
│   │   ├── supabase.ts              # Cliente Supabase inicializado (createClient)
│   │   ├── utils.ts                 # Utilitários Shadcn (cn com clsx e tailwind-merge)
│   │   └── firebase.ts              # Fallback / autenticação complementar
│   │
│   ├── types/                       # Interfaces TypeScript do Domínio
│   │   ├── database.types.ts        # Tipagem gerada automaticamente pelo Supabase CLI
│   │   └── store.ts                 # Offer, PlatformCredential, AdminStats, FilterTypes
│   │
│   ├── components/                  # Componentes reutilizáveis
│   │   ├── ui/                      # Componentes primitivos Shadcn UI
│   │   │   ├── button.tsx           # Botões com gradiente roxo elétrico a rosa neon
│   │   │   ├── badge.tsx            # Badges de desconto e plataformas
│   │   │   ├── card.tsx             # Cards base com elevação e bordas escuras
│   │   │   ├── dialog.tsx           # Modais acessíveis (Radix UI / Shadcn)
│   │   │   └── toast.tsx            # Notificações flutuantes
│   │   │
│   │   ├── showcase/                # Componentes da Vitrine Pública
│   │   │   ├── ShowcaseCarousel.tsx # Carrossel horizontal (até 6 cards) com contador pulsante
│   │   │   ├── OfferCard.tsx        # Card de alta conversão, % OFF e cupom
│   │   │   ├── FilterBar.tsx        # Filtros rápidos de categorias e ordenação
│   │   │   ├── HeroBanner.tsx       # Radar de ofertas e filtro por loja oficial
│   │   │   ├── OfferDetailModal.tsx # Modal de especificações completas
│   │   │   └── ShareModal.tsx       # Compartilhamento no WhatsApp e Telegram
│   │   │
│   │   ├── admin/                   # Painel Administrativo
│   │   │   ├── AdminModal.tsx       # Controle de Ofertas e Credenciais
│   │   │   ├── NewOfferModal.tsx    # Formulário de criação/edição com cálculo de margem
│   │   │   └── PlatformEditModal.tsx# Configuração de chaves de API Shopee & Amazon
│   │   │
│   │   └── layout/                  # Estrutura de layout
│   │       ├── Header.tsx           # Barra superior, busca instantânea e autenticação
│   │       └── Footer.tsx           # Rodapé com aviso legal de afiliados
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useOffers.ts             # Hook de busca reativa e filtragem
│   │   ├── usePlatforms.ts          # Hook de consulta de credenciais
│   │   └── useDebounce.ts           # Debounce para o campo de busca instantâneo
│   │
│   └── services/                    # Camada de comunicação com APIs
│       ├── offersService.ts         # Métodos de CRUD no Supabase (produtos_ofertas)
│       └── affiliateSyncService.ts  # Handlers de sincronização Shopee e Amazon`;

  const sqlCode = `-- ==============================================================================
-- WebStore360 - Schema Oficial para Banco de Dados Supabase (PostgreSQL)
-- ==============================================================================
-- 1. Tabela: public.produtos_ofertas (Suporte a Rascunho / Publicado e Descontos)
-- 2. Tabela: public.plataformas_credenciais (Chaves de API Shopee, Amazon e Afiliados)
-- RLS (Row Level Security) ativado para máxima segurança e conformidade
-- ==============================================================================

-- 1. Habilitar extensões necessárias para UUID e Criptografia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criar a Tabela: produtos_ofertas
CREATE TABLE IF NOT EXISTS public.produtos_ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) UNIQUE,
    description TEXT,
    image_url TEXT NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= 0),
    discount_price NUMERIC(10, 2) NOT NULL CHECK (discount_price >= 0),
    -- Coluna gerada automaticamente com o percentual de desconto:
    discount_percentage INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN original_price > 0 AND discount_price < original_price 
            THEN ROUND(((original_price - discount_price) / original_price) * 100)
            ELSE 0 
        END
    ) STORED,
    installments VARCHAR(100),
    affiliate_url TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('shopee', 'amazon', 'mercadolivre', 'lojadomecanico', 'temu', 'aliexpress', 'magalu')),
    category VARCHAR(60) NOT NULL,
    -- Controle de estados: 'rascunho' ou 'publicado'
    status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_flash_deal BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(2, 1) DEFAULT 4.8 CHECK (rating >= 0 AND rating <= 5.0),
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
    coupon_code VARCHAR(50),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    clicks_count INTEGER DEFAULT 0 CHECK (clicks_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Criar a Tabela: plataformas_credenciais (Shopee, Amazon e outras APIs)
CREATE TABLE IF NOT EXISTS public.plataformas_credenciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(50) NOT NULL UNIQUE CHECK (platform_name IN ('shopee', 'amazon', 'mercadolivre', 'lojadomecanico', 'temu', 'aliexpress', 'magalu')),
    display_name VARCHAR(100) NOT NULL,
    affiliate_partner_id VARCHAR(150), -- Tag/ID de parceiro (ex: webstore360-20)
    app_id VARCHAR(255),               -- Client ID da aplicação
    app_secret TEXT,                   -- Segredo da API
    api_key TEXT,                      -- Chave de API direta
    access_token TEXT,                 -- Token OAuth2
    refresh_token TEXT,                -- Token de renovação
    webhook_secret TEXT,               -- Assinatura de webhooks
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ,        -- Timestamp do último sync com a API
    sync_frequency_minutes INT DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Índices de Alta Performance para Consultas Rápidas
CREATE INDEX IF NOT EXISTS idx_produtos_ofertas_status ON public.produtos_ofertas(status);
CREATE INDEX IF NOT EXISTS idx_produtos_ofertas_platform ON public.produtos_ofertas(platform);
CREATE INDEX IF NOT EXISTS idx_produtos_ofertas_category ON public.produtos_ofertas(category);
CREATE INDEX IF NOT EXISTS idx_produtos_ofertas_clicks ON public.produtos_ofertas(clicks_count DESC);

-- 5. Trigger para Atualização Automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_produtos_ofertas_updated_at ON public.produtos_ofertas;
CREATE TRIGGER trigger_produtos_ofertas_updated_at
    BEFORE UPDATE ON public.produtos_ofertas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Políticas de RLS (Row Level Security)
ALTER TABLE public.produtos_ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plataformas_credenciais ENABLE ROW LEVEL SECURITY;

-- Regra 1: Leitura pública de ofertas apenas com status 'publicado'
DROP POLICY IF EXISTS "Leitura pública de ofertas publicadas" ON public.produtos_ofertas;
CREATE POLICY "Leitura pública de ofertas publicadas"
    ON public.produtos_ofertas
    FOR SELECT
    TO anon, authenticated
    USING (status = 'publicado');

-- Regra 2: Apenas admins autenticados podem ver rascunhos e editar tudo
DROP POLICY IF EXISTS "Admin gerencia todas as ofertas" ON public.produtos_ofertas;
CREATE POLICY "Admin gerencia todas as ofertas"
    ON public.produtos_ofertas
    FOR ALL
    TO authenticated
    USING (true);

-- Regra 3: Credenciais de API Shopee & Amazon protegidas contra acesso anônimo
DROP POLICY IF EXISTS "Apenas admin gerencia credenciais" ON public.plataformas_credenciais;
CREATE POLICY "Apenas admin gerencia credenciais"
    ON public.plataformas_credenciais
    FOR ALL
    TO authenticated
    USING (true);`;

  const handleCopy = async () => {
    const textToCopy = activeTab === 'sql' ? sqlCode : folderStructure;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      onShowToast(activeTab === 'sql' ? 'Código SQL copiado!' : 'Estrutura de pastas copiada!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-[#18181b] rounded-3xl border border-zinc-800 shadow-2xl flex flex-col h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8257e5] to-[#ff007a] flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white">
                Arquitetura do Projeto & SQL Supabase
              </h2>
              <p className="text-xs text-zinc-400">
                Especificação técnica completa solicitada para React, Vite e PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 hover:opacity-95 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Conteúdo'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-zinc-800 bg-[#141416]">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Código SQL Oficial Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'folders'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>1. Estrutura de Pastas React/Vite</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#121214]">
          {activeTab === 'sql' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
                <span>
                  ✓ Contém tabelas <code className="font-bold text-white">produtos_ofertas</code>, <code className="font-bold text-white">plataformas_credenciais</code>, políticas de RLS e triggers.
                </span>
                <span className="text-[10px] uppercase font-bold text-pink-400">PostgreSQL / Supabase</span>
              </div>
              <pre className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed selection:bg-purple-600 selection:text-white">
                {sqlCode}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
                <span>
                  ✓ Arquitetura modular moderna com componentes Shadcn UI, hooks, tipagens estritas e carrosséis.
                </span>
                <span className="text-[10px] uppercase font-bold text-purple-400">React + Vite + Tailwind</span>
              </div>
              <pre className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed selection:bg-purple-600 selection:text-white">
                {folderStructure}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
