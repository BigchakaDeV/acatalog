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
    <Suspense fallback={<><Header /><main className="mx-auto max-w-7xl px-4 py-8"><LoadingState label="Preparando catálogo" /></main></>}>
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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-circuit">Catálogo técnico</p>
              <h1 className="text-3xl font-black text-[var(--ui-text)]">Produtos de alta performance</h1>
              <p className="m-0 text-sm text-graphite">Selecione por categoria, marca, faixa de preço e disponibilidade para acelerar sua decisão.</p>
            </div>
            <select className="min-h-11 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3">
              <option>Relevância comercial</option>
              <option>Menor preço</option>
              <option>Maior preço</option>
              <option>Em promoção</option>
              <option>Mais vendidos</option>
            </select>
          </div>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <FilterSidebar categories={categories.data ?? []} brands={brands.data ?? []} />
            {products.isLoading ? <LoadingState label="Buscando produtos" /> : products.isError ? <ErrorState title="Falha ao carregar catálogo" description="Confira se o backend está rodando e tente novamente." /> : <ProductGrid products={products.data ?? []} />}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
