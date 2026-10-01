import React from 'react';
import { ShieldCheck, Heart, Sparkles, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-base">
              360
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">
                WebStore<span className="text-emerald-400">360</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Hub de Curadoria de Ofertas & Afiliados Inteligente
              </p>
            </div>
          </div>

          {/* Cloud SQL connection badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Banco de Dados: <strong className="text-emerald-400">Cloud SQL PostgreSQL</strong></span>
          </div>
        </div>

        {/* Affiliate disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-1.5 text-[11px] leading-relaxed">
          <p className="font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Transparência com o Consumidor (Aviso de Afiliados):
          </p>
          <p>
            Os preços, estoques e cupons informados podem sofrer alterações pelas lojas parceiras sem aviso prévio. Ao clicar nos links de promoção e efetuar compras na Shopee, Amazon, Mercado Livre, Loja do Mecânico, Magalu, AliExpress ou Temu, a WebStore360 poderá receber uma comissão de afiliado sem qualquer custo adicional para você.
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px] pt-4">
          <p>© {new Date().getFullYear()} WebStore360. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Construído com alta performance e PostgreSQL para máxima conversão
          </p>
        </div>

      </div>
    </footer>
  );
};
