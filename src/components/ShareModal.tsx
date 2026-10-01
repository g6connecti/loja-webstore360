import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, Link as LinkIcon, Share2 } from 'lucide-react';
import { Offer } from '../types/store.ts';
import { formatCurrency, PLATFORM_CONFIG, copyToClipboard } from '../utils/format.ts';

interface ShareModalProps {
  offer: Offer | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ offer, onClose, onShowToast }) => {
  const [copied, setCopied] = useState(false);

  if (!offer) return null;

  const platformMeta = PLATFORM_CONFIG[offer.platform];

  const shareText = `🔥 *OFERTA IMPERDÍVEL NO WEBSTORE360!* 🔥

📦 *${offer.title}*
${Number(offer.originalPrice) > Number(offer.discountPrice) ? `❌ De: ${formatCurrency(offer.originalPrice)}\n` : ''}✅ *Por apenas: ${formatCurrency(offer.discountPrice)}*
${offer.installments ? `💳 ${offer.installments}\n` : ''}${offer.couponCode ? `🎟 Use o Cupom: *${offer.couponCode}*\n` : ''}🏪 Loja: *${platformMeta?.name || offer.platform}*

👉 *Garanta o seu antes que acabe:*
${offer.affiliateUrl}`;

  const handleCopyText = async () => {
    const ok = await copyToClipboard(shareText);
    if (ok) {
      setCopied(true);
      onShowToast('Texto formatado para WhatsApp/Telegram copiado!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(offer.affiliateUrl)}&text=${encodeURIComponent(
      `🔥 ${offer.title} por ${formatCurrency(offer.discountPrice)}!`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Compartilhar Promoção
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Quick share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>
            <button
              onClick={handleTelegram}
              className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Enviar no Telegram</span>
            </button>
          </div>

          {/* Formatted Text Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              Mensagem Pronta para Grupos de Promoção:
            </label>
            <textarea
              readOnly
              value={shareText}
              rows={7}
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Fechar
          </button>
          <button
            onClick={handleCopyText}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
