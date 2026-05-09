'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Headphones, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { storeApi } from '@/lib/api';

export default function HomePage() {
  const { data, isError, isLoading, error } = useQuery({ queryKey: ['home'], queryFn: storeApi.home });

  // Debug logging
  React.useEffect(() => {
    if (isError && error) {
      console.error('Home page API error:', error);
      console.error('Error message:', (error as any)?.message);
      console.error('Error response:', (error as any)?.response?.data);
    }
  }, [isError, error]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="relative overflow-hidden rounded-xl bg-ink p-6 text-white md:p-12">
          <div className="max-w-2xl">
            <p className="font-bold uppercase text-limepulse">Semana Performance</p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">Hardware premium pronto para vender mais.</h1>
            <p className="mt-4 text-white/80">GPUs, SSDs, perifericos e mobile com vitrine publica, carrinho API-first e dashboard headless.</p>
            <Link href="/catalogo" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-limepulse px-5 font-black text-ink">Ver catalogo</Link>
          </div>
        </section>
        <section className="mt-10 grid gap-4 md:grid-cols-4">
          {['Hardware', 'Perifericos', 'Mobile', 'Gamer Pro'].map((name) => (
            <Link href={`/catalogo?search=${name}`} key={name} className="glass rounded-xl p-5 font-black hover:shadow-focus">{name}</Link>
          ))}
        </section>
        {isLoading ? <div className="mt-6"><LoadingState label="Sincronizando catalogo" /></div> : null}
        {isError ? <div className="mt-6"><ErrorState title="API indisponivel" description="Nao foi possivel carregar produtos reais do backend." /></div> : null}
        <Block title="Produtos em promocao"><ProductGrid products={data?.promotions ?? []} /></Block>
        <Block title="Lancamentos"><ProductGrid products={data?.new ?? []} /></Block>
        <Block title="Mais vendidos"><ProductGrid products={data?.best_sellers ?? []} /></Block>
        <section className="mt-12 grid gap-4 md:grid-cols-4">
          {[[CreditCard, 'Pagamento seguro'], [ShieldCheck, 'Garantia real'], [Headphones, 'Suporte tecnico'], [Truck, 'Frete inteligente']].map(([Icon, label]) => (
            <div key={label as string} className="surface rounded-lg p-5"><Icon className="mb-3 h-6 w-6 text-circuit" /><strong>{label as string}</strong></div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-12"><h2 className="mb-5 text-2xl font-black">{title}</h2>{children}</section>;
}
