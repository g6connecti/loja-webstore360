import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: any) => void;
  categories: string[];
  totalOffers: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  categories,
  totalOffers,
}) => {
  return (
    <div className="bg-[#121214] border-b border-zinc-800/80 py-4 shadow-md sticky top-20 z-30 backdrop-blur-md bg-[#121214]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Chips with Electric Gradient on Active */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white border-transparent shadow-md shadow-purple-600/30'
                  : 'bg-[#18181b] text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              Todas as Categorias
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#8257e5] to-[#ff007a] text-white border-transparent shadow-md shadow-purple-600/30'
                    : 'bg-[#18181b] text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Selector & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
            <span className="text-xs text-zinc-400">
              <strong className="text-white font-bold">{totalOffers}</strong> ofertas encontradas
            </span>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="py-1.5 px-2.5 text-xs font-bold rounded-xl bg-[#18181b] border border-zinc-800 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="title_asc">Ordem Alfabética (A - Z)</option>
                <option value="discount">Maior % Desconto</option>
                <option value="clicks">Mais Clicados / Populares</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="rating">Melhor Avaliação</option>
                <option value="title_desc">Ordem Alfabética (Z - A)</option>
                <option value="newest">Mais Recentes</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
