'use client';

import { SlidersHorizontal } from 'lucide-react';
import type { Brand, Category } from '@/lib/types';

export function FilterSidebar({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  return (
    <aside className="surface h-fit rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4">
      <div className="mb-4 flex items-center gap-2 font-bold text-[var(--ui-text)]"><SlidersHorizontal className="h-4 w-4" /> Filtros comerciais</div>
      <form className="grid gap-4 text-sm">
        <label className="grid gap-1">Categoria
          <select name="category" className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3">
            <option value="">Todas</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Marca
          <select name="brand" className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3">
            <option value="">Todas</option>
            {brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input name="min_price" placeholder="Preço mín." className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3" />
          <input name="max_price" placeholder="Preço máx." className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3" />
        </div>
        <label className="grid gap-1">Avaliação mínima
          <select name="rating" className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3">
            <option value="">Qualquer</option>
            <option value="4">4 estrelas</option>
            <option value="3">3 estrelas</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="available" value="true" /> Somente itens disponíveis</label>
        <button className="min-h-11 rounded-lg bg-[var(--ui-primary)] px-4 font-bold text-white hover:bg-[var(--ui-primary-strong)]">Aplicar filtros</button>
      </form>
    </aside>
  );
}
