import React from 'react';
import { Search, SlidersHorizontal, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAdmin: () => void;
  onOpenArchitecture?: () => void;
  activeFilterCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAdmin,
}) => {
  const { user, adminUser, logout, isAdmin } = useAuth();
  const currentAdmin = adminUser || (user?.email?.toLowerCase() === 'lagarelli@gmail.com' ? user : null);

  return (
    <header className="sticky top-0 z-40 bg-[#121214]/95 backdrop-blur-md border-b border-zinc-800/80 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo with Electric Purple to Neon Pink Glow */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8257e5] to-[#ff007a] flex items-center justify-center shadow-lg shadow-purple-600/30 ring-1 ring-white/20">
              <span className="text-white font-black text-xl tracking-tighter">360</span>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  WebStore<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8257e5] to-[#ff007a]">360</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Hub Inteligente de Ofertas
              </p>
            </div>
          </div>

          {/* Enhanced / Highlighted Search Bar */}
          <div className="flex-1 max-w-2xl mx-1 sm:mx-4">
            <div className="relative group">
              {/* Subtle ambient glow behind search bar */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/40 via-pink-600/30 to-purple-600/40 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-300 pointer-events-none"></div>
              
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-purple-400 group-focus-within:text-pink-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar produtos, cupons, marcas ou lojas..."
                  className="w-full pl-11 pr-11 py-2.5 sm:py-3 bg-[#18181b] border border-purple-500/30 group-hover:border-purple-500/50 focus:border-purple-400 rounded-xl text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Admin Dashboard Action */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isAdmin
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 shadow-sm shadow-purple-500/20'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750'
              }`}
              title="Gerenciador de Ofertas e Credenciais"
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Painel Admin</span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              )}
            </button>

            {/* Auth Button */}
            {currentAdmin ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={currentAdmin.displayName || 'Admin'}
                    className="w-8 h-8 rounded-full border border-purple-400 ring-2 ring-purple-500/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    {(currentAdmin.displayName || currentAdmin.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-xs text-zinc-300 font-medium">
                  {currentAdmin.email}
                </span>
                <button
                  onClick={logout}
                  title="Sair da conta"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#8257e5] to-[#ff007a] hover:from-[#7145d6] hover:to-[#e0006c] text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition-all active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
