'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { FilterSidebar } from '@/components/store/filter-sidebar';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { storeApi } from '@/lib/api';

export default function CatalogPage() {
  return (
    <Suspense fallback={<><Header /><main className="mx-auto max-w-7xl px-4 py-8"><LoadingState label="Preparando catalogo" /></main></>}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogContent() {
  const params = useSearchParams();
  const queryParams = Object.fromEntries(params.entries());
  const products = useQuery({ queryKey: ['products', queryParams], queryFn: () => storeApi.products(queryParams) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: storeApi.categories });
  const brands = useQuery({ queryKey: ['brands'], queryFn: storeApi.brands });
  const count = products.data?.length ?? 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[0_8px_24px_rgba(16,24,32,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-circuit">Catalogo tecnico</p>
              <h1 className="mt-1 text-3xl font-black text-[var(--ui-text)]">Produtos de alta performance</h1>
              <p className="m-0 text-sm font-semibold text-[var(--ui-text-muted)]">Compare por categoria, marca, preco, disponibilidade e avaliacao.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--ui-surface-muted)] px-3 py-2 text-sm font-black text-[var(--ui-text)]">{count} itens</span>
              <select name="ordering" className="min-h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm font-bold" aria-label="Ordenar produtos">
                <option value="">Relevancia comercial</option>
                <option value="price">Menor preco</option>
                <option value="-price">Maior preco</option>
                <option value="-sold_count">Mais vendidos</option>
                <option value="-created_at">Mais recentes</option>
              </select>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[292px_1fr]">
          <FilterSidebar categories={categories.data ?? []} brands={brands.data ?? []} />
          <section>
            {products.isLoading ? <LoadingState label="Buscando produtos" /> : null}
            {products.isError ? <ErrorState title="Falha ao carregar catalogo" description="Confira se o backend esta rodando e tente novamente." /> : null}
            {!products.isLoading && !products.isError ? <ProductGrid products={products.data ?? []} /> : null}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
