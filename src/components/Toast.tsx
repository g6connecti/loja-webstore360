import React from 'react';
import { CheckCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white border border-emerald-500/40 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-5 duration-200">
      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-xs font-semibold text-slate-100">{message}</span>
    </div>
  );
};
