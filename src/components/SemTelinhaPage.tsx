import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Gamepad2,
  BookOpen,
  Palette,
  Sun,
  Smile,
  Heart,
  ShieldCheck,
  Share2,
  Code2,
  Save,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Check,
  Clock,
  Users,
  Download,
  Award,
  Star,
  Play,
  Pause,
  Film,
  Upload,
  Link2,
  RotateCcw,
  AlertTriangle,
  Video,
  Settings2,
  X,
  Volume2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { Offer } from '../types/store.ts';

interface SemTelinhaPageProps {
  onBackToHome: () => void;
  offers?: Offer[];
  onOpenOfferDetail?: (offer: Offer) => void;
  onShowToast?: (msg: string) => void;
}

const HOTMART_PURCHASE_URL = 'https://go.hotmart.com/W107978330M';
const DEFAULT_VIDEO_URL = 'https://youtube.com/shorts/FZGj8o3ly3Q?feature=share';

function parseVideoUrl(url: string): { type: 'youtube' | 'vimeo' | 'html5'; embedUrl?: string; isShort?: boolean } {
  if (!url) return { type: 'html5' };

  // YouTube Shorts or standard video detection
  const isShort = url.includes('/shorts/');
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      isShort,
    };
  }

  // Vimeo detection
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&color=8257e5`,
      isShort: false,
    };
  }

  return { type: 'html5', isShort: false };
}

export const SemTelinhaPage: React.FC<SemTelinhaPageProps> = ({
  onBackToHome,
  offers = [],
  onOpenOfferDetail,
  onShowToast,
}) => {
  const { isAdmin } = useAuth();
  const [customHtml, setCustomHtml] = useState<string>(() => {
    return localStorage.getItem('webstore360_sem_telinha_html') || '';
  });
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState(customHtml);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Video State Management (Padrão: YouTube Short Oficial)
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    const saved = localStorage.getItem('sem_telinha_video_url');
    if (!saved || saved.includes('criativo.mp4')) {
      localStorage.setItem('sem_telinha_video_url', DEFAULT_VIDEO_URL);
      return DEFAULT_VIDEO_URL;
    }
    return saved;
  });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(videoSrc);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoHasError, setVideoHasError] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isVerticalRatio, setIsVerticalRatio] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoMeta = parseVideoUrl(videoSrc);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setVideoHasError(false);
        })
        .catch((err) => {
          console.error('Erro ao iniciar vídeo:', err);
          setVideoHasError(true);
        });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoError = () => {
    console.warn('Erro ao carregar fonte de vídeo:', videoSrc);
    setVideoHasError(true);
  };

  const handleSaveVideoUrl = (newUrl: string) => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setVideoSrc(trimmed);
    localStorage.setItem('sem_telinha_video_url', trimmed);
    setVideoHasError(false);
    setIsPlaying(false);
    setIsVideoModalOpen(false);
    if (onShowToast) {
      onShowToast('Vídeo atualizado com sucesso!');
    }
  };

  const handleResetVideo = () => {
    setVideoSrc(DEFAULT_VIDEO_URL);
    setVideoUrlInput(DEFAULT_VIDEO_URL);
    localStorage.setItem('sem_telinha_video_url', DEFAULT_VIDEO_URL);
    setVideoHasError(false);
    setIsPlaying(false);
    setIsVideoModalOpen(false);
    if (onShowToast) {
      onShowToast('Vídeo oficial restaurado com sucesso.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingVideo(true);
      // Imediatamente cria URL local para pré-visualização instantânea sem atrasos
      const blobUrl = URL.createObjectURL(file);
      setVideoSrc(blobUrl);
      setVideoHasError(false);
      setIsPlaying(false);

      // Converte para base64 e salva permanentemente no servidor
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/sem-telinha/video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoBase64: base64Data,
              filename: file.name,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setVideoSrc('/sem-telinha/videos/criativo.mp4');
            localStorage.setItem('sem_telinha_video_url', '/sem-telinha/videos/criativo.mp4');
            if (onShowToast) {
              onShowToast(`Vídeo "${file.name}" salvo com sucesso no servidor!`);
            }
          }
        } catch (uploadErr) {
          console.error('Falha ao enviar arquivo para o servidor:', uploadErr);
        } finally {
          setIsUploadingVideo(false);
          setIsVideoModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      setIsUploadingVideo(false);
    }
  };

  const handleSaveHtml = () => {
    setCustomHtml(htmlDraft);
    localStorage.setItem('webstore360_sem_telinha_html', htmlDraft);
    setIsEditingHtml(false);
    if (onShowToast) {
      onShowToast('Código HTML personalizado salvo com sucesso!');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/sem-telinha`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (onShowToast) {
        onShowToast('Link da página Sem Telinha copiado para a área de transferência!');
      }
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'Como vou receber o acesso ao material Sem Telinha?',
      a: 'Assim que o pagamento for aprovado pela Hotmart, você recebe imediatamente um e-mail com os seus dados de acesso exclusivos. O download pode ser feito de forma instantânea em celulares, computadores ou tablets.',
    },
    {
      q: 'Preciso imprimir todas as atividades ou posso usar digitalmente?',
      a: 'Você tem total liberdade! O material é 100% digital em formato de alta resolução. Você pode consultar as atividades diretamente na tela do celular para orientar as brincadeiras ou imprimir as fichas lúdicas para as crianças colorirem e recortarem.',
    },
    {
      q: 'Para quais faixas etárias o programa é recomendado?',
      a: 'O guia foi estruturado com atividades práticas e dinâmicas divididas para crianças desde a primeira infância (1 a 3 anos) até os 12 anos de idade, estimulando coordenação, raciocínio e convivência.',
    },
    {
      q: 'Os materiais necessários para as brincadeiras são caros?',
      a: 'Não! O grande diferencial do método Sem Telinha é priorizar itens que você já tem em casa: papel, copos plásticos, pregadores, caixas de papelão, almofadas, lápis de cor e muita imaginação.',
    },
    {
      q: 'Como funciona a garantia incondicional de 7 dias?',
      a: 'A sua compra é intermediada e protegida pela Hotmart. Você tem 7 dias corridos para experimentar todas as atividades. Se por qualquer motivo achar que não atendeu às suas expectativas, basta solicitar o reembolso integral diretamente na plataforma da Hotmart, com total transparência.',
    },
    {
      q: 'Onde posso conferir o valor atual e formas de pagamento?',
      a: 'O valor oficial, descontos de lote e condições de parcelamento no cartão ou Pix são atualizados em tempo real diretamente na página de pagamento oficial e segura da Hotmart através dos botões desta página.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#121214] text-[#e1e1e6] flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Header Fixo com Navegação Interna e Botão de Compra */}
      <header className="sticky top-0 z-40 bg-[#121214]/95 backdrop-blur-md border-b border-zinc-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo Sem Telinha Oficial */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg shadow-purple-600/30 ring-1 ring-white/20 border border-purple-500/40 bg-zinc-950 shrink-0">
                <img
                  src="/src/assets/images/sem_telinha_logo_1791925773342.jpg"
                  alt="Logo Sem Telinha"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
                  Sem <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8257e5] to-[#ff007a]">Telinha</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-medium hidden md:inline">
                  Vida Sem Tela • Guia Digital Oficial
                </span>
              </div>
            </div>

            {/* Links de navegação interna (Desktop) */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-zinc-300">
              <button
                onClick={() => scrollToSection('sobre')}
                className="hover:text-purple-400 transition-colors"
              >
                Sobre o Guia
              </button>
              <button
                onClick={() => scrollToSection('beneficios')}
                className="hover:text-purple-400 transition-colors"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('conteudo')}
                className="hover:text-purple-400 transition-colors"
              >
                O Que Inclui
              </button>
              <button
                onClick={() => scrollToSection('garantia')}
                className="hover:text-purple-400 transition-colors"
              >
                Garantia
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="hover:text-purple-400 transition-colors"
              >
                Dúvidas
              </button>
            </nav>

            {/* Botão de Ação / Compra Oficial */}
            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <button
                  onClick={() => setIsEditingHtml(!isEditingHtml)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isEditingHtml
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-zinc-800 text-purple-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                  title="Personalizar HTML da página"
                >
                  <Code2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden xl:inline">{isEditingHtml ? 'Fechar Editor' : 'Editar HTML'}</span>
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition-all shadow-sm"
                title="Compartilhar link da página"
              >
                {copiedLink ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4 text-pink-400" />
                )}
              </button>

              <a
                href={HOTMART_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <span>Garantir Acesso</span>
                <ExternalLink className="w-3.5 h-3.5 hidden sm:inline" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Editor de HTML sob demanda (para administradores que queiram colar código HTML específico) */}
      {isEditingHtml && (
        <section className="bg-[#18181b] border-b border-purple-500/30 p-4 sm:p-6 shadow-2xl">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Código HTML Personalizado da Página &quot;Sem Telinha&quot;
                </h3>
                <p className="text-xs text-zinc-400">
                  Você pode colar um código HTML customizado. Ele será exibido em destaque nesta página.
                </p>
              </div>
              <button
                onClick={handleSaveHtml}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-xs font-bold rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>

            <textarea
              value={htmlDraft}
              onChange={(e) => setHtmlDraft(e.target.value)}
              placeholder="Cole aqui o seu código HTML personalizado..."
              rows={8}
              className="w-full font-mono text-xs bg-[#121214] text-zinc-200 p-4 rounded-xl border border-zinc-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>
        </section>
      )}

      {/* Renderiza HTML customizado caso exista */}
      {customHtml && customHtml.trim().length > 0 && (
        <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="bg-[#18181b]/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div
              className="prose prose-invert max-w-none sem-telinha-content"
              dangerouslySetInnerHTML={{ __html: customHtml }}
            />
          </div>
        </section>
      )}

      {/* MAIN LANDING PAGE CONTENT */}
      <main className="flex-1 w-full space-y-20 pb-20">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 border-b border-zinc-800/80 bg-gradient-to-b from-[#191129] via-[#14121e] to-[#121214]">
          {/* Luzes de fundo atmosféricas */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Coluna de Texto e Chamada */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Badges de Destaque */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Método Prático para Pais e Educadores</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                  Resgate a infância do seu filho{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8257e5] via-[#c084fc] to-[#ff007a]">
                    longe das telas.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Mais de <strong>100 atividades lúdicas, práticas e criativas</strong> para reduzir o uso excessivo de celulares, tablets e TV, estimulando a imaginação, o foco e momentos inesquecíveis em família.
                </p>

                {/* Lista rápida de atributos com ícones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto lg:mx-0 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Acesso imediato e 100% digital</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Materiais simples que você já tem em casa</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Para crianças de 1 a 12 anos</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Garantia incondicional de 7 dias Hotmart</span>
                  </div>
                </div>

                {/* Botões de Ação Principal */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <a
                    href={HOTMART_PURCHASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-110 active:scale-95 transition-all flex flex-col items-center justify-center group text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-extrabold">
                      <span>QUERO GARANTIR MEU ACESSO AGORA</span>
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <span className="text-xs font-semibold text-pink-100/95 mt-1">
                      2 x de R$ 10,32 * Ou R$ 19,90 à vista
                    </span>
                  </a>

                  <button
                    onClick={() => scrollToSection('conteudo')}
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-bold transition-all text-center"
                  >
                    Ver o Que Está Incluso
                  </button>
                </div>

                {/* Selos de segurança Hotmart */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Pagamento Seguro via Hotmart</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Acesso Imediato</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Satisfação Garantida</span>
                  </div>
                </div>
              </div>

              {/* Coluna Visual do Produto (Card Mockup Criativo) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8257e5]/30 to-[#ff007a]/30 rounded-3xl blur-2xl"></div>

                  <div className="relative bg-[#18181b] border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                    {/* Top card banner */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                        Produto Digital • Guia Prático
                      </span>
                    </div>

                    {/* Ilustração e Destaque do Guia */}
                    <div className="space-y-4 text-center">
                      <div className="w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-purple-600/40 ring-4 ring-white/10 border-2 border-purple-500/40 bg-zinc-950 group relative">
                        <img
                          src="/src/assets/images/sem_telinha_hero_guide_1791926142864.jpg"
                          alt="Guia Digital Sem Telinha - Livro de Atividades e Fichas"
                          className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3 bg-zinc-900/90 backdrop-blur-md border border-purple-400/40 text-purple-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg">
                          +100 Atividades
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                          Guia Oficial Sem Telinha
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          Mais de 100 atividades lúdicas e educativas passo a passo
                        </p>
                      </div>

                      {/* Lista de destaques dentro do card */}
                      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5 text-xs text-zinc-300">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Formato:</span>
                          <span className="font-bold text-white">E-book Digital + Fichas</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Atividades:</span>
                          <span className="font-bold text-emerald-400">+100 Dinâmicas Testadas</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Entrega:</span>
                          <span className="font-bold text-purple-300">Download Imediato no E-mail</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Garantia:</span>
                          <span className="font-bold text-amber-400">7 Dias Incondicionais</span>
                        </div>
                      </div>

                      {/* CTA no Card */}
                      <a
                        href={HOTMART_PURCHASE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white shadow-lg shadow-purple-600/25 hover:brightness-110 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
                      >
                        <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-wide uppercase">
                          <span>Conferir Oferta na Hotmart</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </div>
                        <span className="text-[11px] font-semibold text-pink-100/95 mt-1">
                          2 x de R$ 10,32 * Ou R$ 19,90 à vista
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO DO VÍDEO OFICIAL / VSL */}
        <section id="video" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5" /> Vídeo Explicativo {videoMeta.isShort && '• Shorts'}
            </span>
            <div className="flex items-center gap-2">
              {videoMeta.isShort && (
                <button
                  onClick={() => setIsVerticalRatio((prev) => (prev === false ? true : false))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                  title="Alternar formato do player"
                >
                  <span>{isVerticalRatio === false ? '📱 Modo Celular' : '🖥️ Modo Widescreen'}</span>
                </button>
              )}
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                title="Trocar vídeo por link do YouTube, Vimeo ou enviar arquivo local"
              >
                <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Personalizar / Trocar Vídeo</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-600/20 bg-zinc-950 p-2 sm:p-4 group">
            <div
              className={`relative w-full ${
                isVerticalRatio === false
                  ? 'aspect-video'
                  : videoMeta.isShort
                  ? 'max-w-sm sm:max-w-md mx-auto aspect-[9/16] max-h-[640px]'
                  : 'aspect-video'
              } rounded-2xl overflow-hidden bg-black flex items-center justify-center transition-all`}
            >
              {videoMeta.type === 'youtube' && videoMeta.embedUrl ? (
                <iframe
                  src={videoMeta.embedUrl}
                  title="Vídeo Sem Telinha"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full rounded-2xl border-0"
                />
              ) : videoMeta.type === 'vimeo' && videoMeta.embedUrl ? (
                <iframe
                  src={videoMeta.embedUrl}
                  title="Vídeo Sem Telinha"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-2xl border-0"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    key={videoSrc}
                    className="w-full h-full object-contain rounded-2xl bg-black"
                    controls
                    playsInline
                    preload="auto"
                    poster="/sem-telinha/images/family_fun.jpg"
                    onPlay={() => {
                      setIsPlaying(true);
                      setVideoHasError(false);
                    }}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                  >
                    <source src={videoSrc} type="video/mp4" />
                    <source src="/sem-telinha/videos/criativo.mp4" type="video/mp4" />
                    <source src="/sem-telinha/videos/criativo 000.mp4" type="video/mp4" />
                    <source src="/assets/videos/criativo.mp4" type="video/mp4" />
                    Seu navegador não suporta a tag de vídeo.
                  </video>

                  {/* Play Overlay quando pausado e sem erro */}
                  {!isPlaying && !videoHasError && (
                    <div
                      onClick={handlePlayVideo}
                      className="absolute inset-0 bg-black/40 hover:bg-black/20 transition-all flex flex-col items-center justify-center cursor-pointer group/overlay backdrop-blur-[1px]"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#8257e5] to-[#ff007a] flex items-center justify-center shadow-2xl shadow-purple-600/50 group-hover/overlay:scale-110 active:scale-95 transition-all text-white">
                        <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-white" />
                      </div>
                      <div className="mt-4 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-white/20 text-white text-xs font-bold tracking-wide shadow-lg flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Clique para Assistir a Apresentação</span>
                      </div>
                    </div>
                  )}

                  {/* Fallback de erro se o navegador recusar codecs específicos */}
                  {videoHasError && (
                    <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="max-w-md space-y-1">
                        <h4 className="text-base font-bold text-white">
                          Ajuste o Vídeo da Apresentação
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Se você possui o arquivo de vídeo original (como &quot;criativo 000.mp4&quot;) ou um link do YouTube, carregue-o abaixo para rodar perfeitamente:
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Selecionar Arquivo de Vídeo</span>
                        </button>
                        <button
                          onClick={() => setIsVideoModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5 text-pink-400" />
                          <span>Colar Link do YouTube</span>
                        </button>
                        <button
                          onClick={handleResetVideo}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar Padrão</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input escondido para upload de arquivo direto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
            />

            {/* Rodapé do Player com CTA Rápido */}
            <div className="pt-4 pb-2 px-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pronto para aplicar hoje mesmo com as crianças</span>
              </div>
              <a
                href={HOTMART_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white shadow-md hover:brightness-110 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Garantir Meu Acesso Agora</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Modal de Configuração do Vídeo */}
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-[#18181b] border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-6 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Configurar Vídeo da Apresentação</h3>
                    <p className="text-xs text-zinc-400">
                      Envie um arquivo ou utilize um link externo para exibir
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Opção 1: Enviar arquivo de vídeo (ex: criativo 000.mp4) */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-purple-400" />
                    Opção 1: Carregar Arquivo de Vídeo (MP4)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">criativo 000.mp4</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Selecione o arquivo de vídeo do seu dispositivo. Ele será reproduzido imediatamente e armazenado na sua página.
                </p>
                <button
                  disabled={isUploadingVideo}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando e salvando vídeo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Selecionar Arquivo do Computador</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opção 2: Colar URL do YouTube ou Vimeo */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-pink-400" />
                  Opção 2: Inserir Link do YouTube, Vimeo ou MP4 Direto
                </span>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all font-mono"
                />
                <button
                  onClick={() => handleSaveVideoUrl(videoUrlInput)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Salvar Link do Vídeo
                </button>
              </div>

              {/* Botão de Restaurar Padrão */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                <button
                  onClick={handleResetVideo}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Apresentação Oficial Padrão</span>
                </button>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. O PROBLEMA vs A SOLUÇÃO */}
        <section id="sobre" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-pink-400 bg-pink-500/10 px-3.5 py-1.5 rounded-full border border-pink-500/20">
              A Realidade das Famílias
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              O excesso de telas não precisa ser o padrão da sua casa
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Muitos pais se sentem sobrecarregados e sem opções quando as crianças pedem o celular para passar o tempo. Mas existe um caminho mais leve, lúdico e saudável.
            </p>
          </div>

          {/* Imagem Emocional de Família Brincando Sem Telas */}
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl group max-w-5xl mx-auto">
            <img
              src="/src/assets/images/family_screen_free_fun_1791926143827.jpg"
              alt="Família reunida brincando com jogos de tabuleiro e desenhos sem celulares"
              className="w-full max-h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/50 to-transparent flex items-end p-6 sm:p-8">
              <div className="space-y-1.5 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/80 backdrop-blur-md text-white text-[11px] font-bold">
                  <Heart className="w-3.5 h-3.5 text-pink-300 fill-pink-300" /> Momentos que Ficam para Sempre
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  Conexão real, risadas sinceras e imaginação viva em família
                </h3>
                <p className="text-xs sm:text-sm text-zinc-200">
                  Substitua o tédio e a dependência dos eletrônicos por brincadeiras práticas e envolventes que aproximam pais e filhos.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* O Desafio Sem o Guia */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  ✕
                </div>
                <h3 className="text-lg font-bold text-white">Sem uma rotina criativa:</h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>Birras e resistência intensa a cada vez que o celular precisa ser desligado.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>Menos paciência, desatenção nos estudos e falta de foco em brincadeiras manuais.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>Sensação de culpa dos pais por não terem tempo de bolar brincadeiras do zero.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-400 font-bold shrink-0">•</span>
                  <span>Falta de estímulo motor, sensorial e de convivência social real com a família.</span>
                </li>
              </ul>
            </div>

            {/* A Transformação com o Sem Telinha */}
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-purple-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">Com o Guia Sem Telinha:</h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Mais de 100 ideias prontas para aplicar em minutos, sem complicação.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Crianças mais calmas, focadas e com a imaginação estimulada todos os dias.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Fortalecimento dos laços familiares através de memórias afetivas reais.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Uso inteligente de itens caseiros sem gastar rios de dinheiro em brinquedos descartáveis.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. BENEFÍCIOS (4 PILARES) */}
        <section id="beneficios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20">
              Desenvolvimento Integral
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Os 4 Pilares Fundamentais do Programa
            </h2>
            <p className="text-sm text-zinc-400">
              Projetado para estimular todas as áreas essenciais do crescimento da criança.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 1 */}
            <div className="bg-[#18181b] border border-zinc-800 hover:border-purple-500/50 rounded-3xl p-6 space-y-4 transition-all shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Raciocínio & Estratégia</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dinâmicas de lógica, charadas e jogos que treinam a tomada de decisões, paciência e concentração sem telas piscantes.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-[#18181b] border border-zinc-800 hover:border-pink-500/50 rounded-3xl p-6 space-y-4 transition-all shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Linguagem & Imaginação</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Narrativas, fábulas participativas e desafios que expandem o vocabulário e ensinam a criança a criar seus próprios mundos.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-[#18181b] border border-zinc-800 hover:border-emerald-500/50 rounded-3xl p-6 space-y-4 transition-all shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Arte & Coordenação Motora</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dobraduras, colagens, pintura e modelagem para aprimorar a precisão motora fina tão importante na fase escolar.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-[#18181b] border border-zinc-800 hover:border-amber-500/50 rounded-3xl p-6 space-y-4 transition-all shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Movimento & Ar Livre</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Brincadeiras ativas que gastam energia física de maneira saudável, promovem o sono restaurador e melhoram o humor.
              </p>
            </div>
          </div>

          {/* Destaque Visual das Atividades Lúdicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="group relative rounded-3xl overflow-hidden border border-purple-500/30 bg-[#18181b] shadow-xl hover:border-purple-500/60 transition-all">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/src/assets/images/kids_creative_activities_1791926146130.jpg"
                  alt="Crianças desenvolvendo raciocínio e concentração com jogos lúdicos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5 sm:p-6 space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                  Raciocínio & Concentração
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Jogos de lógica, quebra-cabeças e desafios manuais
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  As crianças aprendem a manter o foco prolongado e a ter paciência para solucionar problemas por conta própria, longe de estímulos frenéticos.
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden border border-pink-500/30 bg-[#18181b] shadow-xl hover:border-pink-500/60 transition-all">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/src/assets/images/kids_outdoor_art_play_1791926146737.jpg"
                  alt="Crianças criando arte com aquarela e dobraduras ao ar livre"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5 sm:p-6 space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
                  Arte, Pintura & Ar Livre
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  Dobraduras, pintura e imaginação sem limites
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Momentos de pura liberdade criativa com materiais acessíveis, desenvolvendo coordenação motora fina e expressão artística natural.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. O QUE VOCÊ VAI RECEBER (CONTEÚDO DO GUIA) */}
        <section id="conteudo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="bg-gradient-to-br from-[#1a1329] via-[#151320] to-[#121214] border border-purple-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
                Conteúdo Detalhado
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Tudo o que você recebe ao adquirir o Sem Telinha
              </h2>
              <p className="text-sm text-zinc-400">
                Um guia completo, organizado e fácil de usar no dia a dia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">+100 Atividades Práticas</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Fichas detalhadas com instruções claras, tempo estimado e faixa etária recomendada.
                </p>
              </div>

              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Fichas Imprimíveis para Colorir</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Desenhos temáticos e jogos de recortar e montar para manter as crianças entretidas longe das telas.
                </p>
              </div>

              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Dinâmicas Rápidas (10 a 20 min)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Perfeito para pais que têm rotina corrida mas querem qualidade no tempo com os filhos.
                </p>
              </div>

              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Jogos em Família & Grupos</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ideias para irmãos de idades diferentes brincarem juntos e dinâmicas para finais de semana e feriados.
                </p>
              </div>

              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Dicas para Rotina de Sono</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Como preparar a criança para dormir sem o estímulo luminoso prejudicial dos aparelhos eletrônicos.
                </p>
              </div>

              <div className="bg-[#18181b]/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Acesso Vitalício & Atualizações</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O guia fica disponível para sempre na sua conta Hotmart para baixar quando e onde quiser.
                </p>
              </div>
            </div>

            {/* Chamada no Box */}
            <div className="pt-4 text-center">
              <a
                href={HOTMART_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-sm sm:text-base font-extrabold shadow-xl shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <span>QUERO ACESSAR O CONTEÚDO COMPLETO NA HOTMART</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 5. SEÇÃO DE GARANTIA INCONDICIONAL (HOTMART) */}
        <section id="garantia" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#18181b] border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Selo 3D de Garantia Hotmart */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-full overflow-hidden shadow-2xl shadow-amber-500/20 ring-4 ring-amber-400/20 border-2 border-amber-400/40 bg-zinc-950 shrink-0">
              <img
                src="/src/assets/images/guarantee_seal_7days_1791926145743.jpg"
                alt="Selo 7 Dias de Garantia Incondicional Hotmart"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Risco Zero para Você
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                7 Dias de Garantia Incondicional Assegurada pela Hotmart
              </h2>

              {/* Preço no Banner de Garantia */}
              <div className="pt-2">
                <div className="inline-block bg-amber-500/10 border border-amber-500/30 rounded-2xl px-6 py-3 text-center shadow-inner">
                  <div className="text-base sm:text-xl font-black text-amber-300">
                    2 x de R$ 10,32 * Ou R$ 19,90 à vista
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
              Você pode adquirir o guia com total segurança e tranquilidade. Teste as brincadeiras e atividades por <strong>7 dias</strong>. Se por qualquer motivo achar que não valeu a pena, basta solicitar o reembolso integral diretamente na plataforma da Hotmart, com 1 clique e sem burocracia.
            </p>

            <div className="pt-2">
              <a
                href={HOTMART_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center justify-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                <div className="inline-flex items-center gap-2">
                  <span>Comprar com Garantia de 7 Dias</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900/90 normal-case tracking-normal mt-0.5">
                  2 x de R$ 10,32 * Ou R$ 19,90 à vista
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* 6. FAQ - PERGUNTAS FREQUENTES INTERATIVAS */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20">
              Tire Suas Dúvidas
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Perguntas Frequentes sobre o Sem Telinha
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Clique nas perguntas abaixo para expandir e ler as respostas.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden transition-all shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4 hover:bg-zinc-800/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-purple-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/50 bg-[#141416]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. CTA FINAL COM DIRECIONAMENTO PARA A HOTMART */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-purple-900/60 via-purple-950/80 to-pink-900/60 border border-purple-500/40 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-pink-300 bg-pink-500/20 px-3.5 py-1.5 rounded-full border border-pink-400/30">
                Comece Agora Mesmo
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Dê o primeiro passo para uma infância mais criativa e conectada
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
                Garanta o seu acesso ao guia <strong>Sem Telinha</strong> através do link oficial na Hotmart com garantia incondicional de 7 dias e acesso imediato.
              </p>
            </div>

            <div className="pt-2">
              <a
                href={HOTMART_PURCHASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white text-base sm:text-lg font-black shadow-2xl shadow-purple-600/40 hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <span>QUERO MEU GUIA SEM TELINHA NA HOTMART</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <p className="text-[11px] text-zinc-400">
              Transação 100% segura e processada pela Hotmart • Acesso imediato no seu e-mail
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER DA LANDING PAGE */}
      <footer className="border-t border-zinc-800 bg-[#0e0e10] py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8257e5] to-[#ff007a] flex items-center justify-center font-bold text-white text-xs">
              360
            </div>
            <div>
              <p className="font-bold text-white">WebStore360 • Sem Telinha</p>
              <p className="text-[11px] text-zinc-500">
                Página de apresentação e vendas do produto digital Vida Sem Tela / Sem Telinha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={onBackToHome}
              className="hover:text-purple-400 transition-colors"
            >
              Catálogo de Ofertas
            </button>
            <span>•</span>
            <a
              href={HOTMART_PURCHASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              Comprar na Hotmart
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-zinc-800/60 text-center text-[11px] text-zinc-600 space-y-1">
          <p>
            Este site promove produtos digitais com links oficiais e verificados. A transação e entrega são de responsabilidade da Hotmart.
          </p>
          <p>© {new Date().getFullYear()} WebStore360 • Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
