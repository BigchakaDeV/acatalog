'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { Brand, Category } from '@/lib/types';

export function FilterSidebar({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  return (
    <aside className="glass h-fit rounded-xl p-4">
      <div className="mb-4 flex items-center gap-2 font-bold"><SlidersHorizontal className="h-4 w-4" /> Filtros</div>
      <form className="grid gap-4 text-sm">
        <label className="grid gap-1">Categoria
          <select name="category" className="rounded-lg border border-ink/10 bg-white p-3">
            <option value="">Todas</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Marca
          <select name="brand" className="rounded-lg border border-ink/10 bg-white p-3">
            <option value="">Todas</option>
            {brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input name="min_price" placeholder="Preco min." className="rounded-lg border border-ink/10 p-3" />
          <input name="max_price" placeholder="Preco max." className="rounded-lg border border-ink/10 p-3" />
        </div>
        <label className="grid gap-1">Avaliacao minima
          <select name="rating" className="rounded-lg border border-ink/10 bg-white p-3">
            <option value="">Qualquer</option>
            <option value="4">4 estrelas</option>
            <option value="3">3 estrelas</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="available" value="true" /> Somente disponiveis</label>
        <button className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">Aplicar filtros</button>
      </form>
    </aside>
  );
}
