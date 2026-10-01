import React, { useState, useEffect } from 'react';
import { X, Key, Shield, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PlatformCredential } from '../types/store.ts';

interface PlatformEditModalProps {
  platform: PlatformCredential | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<PlatformCredential>) => Promise<void>;
  onSync: (id: string) => Promise<void>;
}

export const PlatformEditModal: React.FC<PlatformEditModalProps> = ({
  platform,
  onClose,
  onSave,
  onSync,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [affiliatePartnerId, setAffiliatePartnerId] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [syncFrequencyMinutes, setSyncFrequencyMinutes] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (platform) {
      setDisplayName(platform.displayName);
      setAffiliatePartnerId(platform.affiliatePartnerId || '');
      setAppId(platform.appId || '');
      setAppSecret(platform.appSecret || '');
      setApiKey(platform.apiKey || '');
      setWebhookSecret(platform.webhookSecret || '');
      setSyncFrequencyMinutes(platform.syncFrequencyMinutes || 60);
      setIsActive(platform.isActive);
      setStatusMsg(null);
    }
  }, [platform]);

  if (!platform) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      await onSave(platform.id, {
        displayName,
        affiliatePartnerId: affiliatePartnerId.trim() || null,
        appId: appId.trim() || null,
        appSecret: appSecret.trim() || null,
        apiKey: apiKey.trim() || null,
        webhookSecret: webhookSecret.trim() || null,
        syncFrequencyMinutes: Number(syncFrequencyMinutes) || 60,
        isActive,
      });
      setStatusMsg('Credenciais salvas com sucesso no banco de dados!');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message || 'Falha ao salvar'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      await onSync(platform.id);
      setStatusMsg('Sincronização de catálogo efetuada com sucesso!');
    } catch (err: any) {
      setStatusMsg(`Erro na sincronização: ${err.message || 'Falha'}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Configurar API: {platform.displayName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tabela <code className="text-emerald-500 font-mono">public.plataformas_credenciais</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.includes('Erro')
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {statusMsg.includes('Erro') ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Affiliate Partner ID / Tag de Afiliado
            </label>
            <input
              type="text"
              value={affiliatePartnerId}
              onChange={(e) => setAffiliatePartnerId(e.target.value)}
              placeholder="Ex: webstore360-20 ou BR_AFF_SHOPEE_8829"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                App ID / Client ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Ex: 104829012"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Frequência de Sync (minutos)
              </label>
              <input
                type="number"
                min="15"
                step="5"
                value={syncFrequencyMinutes}
                onChange={(e) => setSyncFrequencyMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              API Key / Access Token
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              App Secret / Webhook Secret
            </label>
            <input
              type="password"
              value={appSecret}
              onChange={(e) => setAppSecret(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Plataforma Ativa para Coleta
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Se desativada, ofertas desta loja não serão atualizadas automaticamente
              </span>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Sync action & submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Testar & Sincronizar'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Chaves'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
