'use client';

import { SlidersHorizontal, BadgePercent, PackageCheck } from 'lucide-react';
import type { Brand, Category } from '@/lib/types';

export function FilterSidebar({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  return (
    <aside className="h-fit rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)]">
      <div className="flex min-h-12 items-center gap-2 border-b border-[var(--ui-border)] px-4 font-black text-[var(--ui-text)]">
        <SlidersHorizontal className="h-4 w-4 text-circuit" /> Filtrar produtos
      </div>
      <form className="grid gap-4 p-4 text-sm">
        <label className="grid gap-1 font-bold">Categoria
          <select name="category" className="min-h-11 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 font-semibold">
            <option value="">Todas categorias</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 font-bold">Marca
          <select name="brand" className="min-h-11 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 font-semibold">
            <option value="">Todas marcas</option>
            {brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <div className="grid gap-2">
          <span className="font-bold">Faixa de preco</span>
          <div className="grid grid-cols-2 gap-2">
            <input name="min_price" placeholder="Minimo" className="min-h-11 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3" />
            <input name="max_price" placeholder="Maximo" className="min-h-11 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3" />
          </div>
        </div>
        <label className="grid gap-1 font-bold">Avaliacao minima
          <select name="rating" className="min-h-11 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 font-semibold">
            <option value="">Qualquer nota</option>
            <option value="4">4 estrelas ou mais</option>
            <option value="3">3 estrelas ou mais</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--ui-border)] px-3 font-bold">
          <input type="checkbox" name="available" value="true" /> <PackageCheck className="h-4 w-4 text-circuit" /> Disponivel
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--ui-border)] px-3 font-bold">
          <input type="checkbox" name="promotion" value="true" /> <BadgePercent className="h-4 w-4 text-circuit" /> Em promocao
        </label>
        <button className="min-h-11 rounded-md bg-[var(--ui-primary)] px-4 font-black uppercase text-white hover:bg-[var(--ui-primary-strong)]">Aplicar filtros</button>
      </form>
    </aside>
  );
}
