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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-bold uppercase text-circuit">Catalogo</p>
            <h1 className="text-3xl font-black">Produtos de tecnologia</h1>
          </div>
          <select className="min-h-11 rounded-lg border border-ink/10 bg-white px-3">
            <option>Relevancia</option>
            <option>Menor preco</option>
            <option>Maior preco</option>
            <option>Promocao</option>
            <option>Mais vendidos</option>
          </select>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <FilterSidebar categories={categories.data ?? []} brands={brands.data ?? []} />
          {products.isLoading ? <LoadingState label="Buscando produtos" /> : products.isError ? <ErrorState title="Falha ao carregar catalogo" description="Confira se o backend esta rodando e tente novamente." /> : <ProductGrid products={products.data ?? []} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
