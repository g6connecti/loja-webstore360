import React, { useState } from 'react';
import { X, Download, Copy, Check, Share2, Sparkles, MessageCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/format.ts';

interface SocialBannersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SocialBannersModal: React.FC<SocialBannersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'copy'>('banners');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const landscapeBannerUrl = '/src/assets/images/social_promo_banner_1790976189253.jpg';
  const squareBannerUrl = '/src/assets/images/square_promo_banner_1790976206584.jpg';

  const siteUrl = window.location.origin;

  const copyTexts = [
    {
      id: 'whatsapp',
      title: 'WhatsApp & Telegram (Direto & Alta Conversão)',
      icon: '💬',
      text: `🔥 *WEBSTORE360 - HUB DE OFERTAS & CUPONS EXCLUSIVOS!* 🔥

As melhores promoções selecionadas a dedo todos os dias:
🛍️ *Shopee*: Cupons exclusivos de desconto & Frete Grátis
📦 *Amazon Prime*: Echo Alexa, Kindle e Eletrônicos com Entrega Rápida
🚀 *Mercado Livre*: Ofertas relâmpago com Entrega Full
🛠️ *Loja do Mecânico*: Ferramentas com preços especiais

Confira todas as ofertas verificadas agora mesmo:
👉 ${siteUrl}`,
    },
    {
      id: 'instagram',
      title: 'Instagram & Threads (Com Hashtags de Alto Alcance)',
      icon: '📸',
      text: `Economizar nunca foi tão fácil! 🛒✨

No WebStore360 você encontra as melhores ofertas reunidas em um único lugar: Shopee, Amazon Prime, Mercado Livre, Loja do Mecânico e muito mais!

🔥 Cupons de desconto atualizados
⚡ Ofertas Relâmpago diárias
📦 Links 100% seguros e verificados

Link direto na Bio ou acesse:
👉 ${siteUrl}

#ofertas #promocao #achadinhos #cupomdedesconto #descontos #shopeebrasil #amazonprimebrasil #mercadolivre #comprasonline #economia #webstore360`,
    },
    {
      id: 'stories',
      title: 'Stories & Status (Curto & Chamada com Link)',
      icon: '⚡',
      text: `🚨 ACHADINHOS & SUPER OFERTAS DO DIA!
Reunimos os maiores descontos da Shopee, Amazon e Mercado Livre em um só lugar.

Aperte no link abaixo e garanta antes que acabe o estoque! ⤵️
${siteUrl}`,
    },
  ];

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      onShowToast('Texto copiado para a área de transferência!');
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast(`Download iniciado: ${filename}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/60 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl text-white shadow-lg shadow-purple-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Kit de Divulgação em Redes Sociais
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  WebStore360
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Banners profissionais e textos prontos para divulgar nas suas redes e faturar como afiliado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-900/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'banners'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners Oficiais
          </button>
          <button
            onClick={() => setActiveTab('copy')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'copy'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Textos & Legendas Prontas
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {activeTab === 'banners' && (
            <div className="space-y-8">
              {/* Banner 1: Landscape 16:9 */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Formato 16:9 Paisagem
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        Banner de Divulgação Geral & Redes
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ideal para Facebook, Twitter/X, LinkedIn, Grupos de Telegram e Cartão OpenGraph (compartilhamento de link)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(landscapeBannerUrl, 'webstore360-banner-social-16x9.jpg')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar JPG (HD)
                    </button>
                    <a
                      href={landscapeBannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                      title="Abrir imagem original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                  <img
                    src={landscapeBannerUrl}
                    alt="WebStore360 Banner 16:9 para Divulgação"
                    className="w-full aspect-[16/9] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] text-zinc-200 border border-white/10">
                    Resolução Ultra-HD • Design Oficial WebStore360
                  </div>
                </div>
              </div>

              {/* Banner 2: Square 1:1 */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/40 transition-all shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Formato 1:1 Quadrado
                      </span>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        Post Quadrado para Feed & Status
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Perfeito para Feed do Instagram, WhatsApp Status, Threads e Carrossel
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(squareBannerUrl, 'webstore360-feed-instagram-1x1.jpg')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-md shadow-pink-600/20 transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar JPG (Feed)
                    </button>
                    <a
                      href={squareBannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                      title="Abrir imagem original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="max-w-md mx-auto relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                  <img
                    src={squareBannerUrl}
                    alt="WebStore360 Feed Instagram 1:1"
                    className="w-full aspect-square object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] text-zinc-200 border border-white/10">
                    Feed Instagram / WhatsApp Status
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'copy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-200 leading-relaxed">
                  Utilize os textos prontos abaixo para legendar suas postagens no WhatsApp, Telegram e Instagram. O link do seu site já está formatado com o endereço atual!
                </p>
              </div>

              {copyTexts.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{item.icon}</span> {item.title}
                    </h4>
                    <button
                      onClick={() => handleCopy(item.text, item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-zinc-700"
                    >
                      {copiedKey === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed select-all">
                    {item.text}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>WebStore360 • Marketing & Divulgação de Afiliados</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
