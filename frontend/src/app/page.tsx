'use client';

import Link from 'next/link';
import { ShieldCheck, Truck, Headphones, CreditCard, ArrowUpRight, Activity, Cpu, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { storeApi } from '@/lib/api';

export default function HomePage() {
  const { data, isError, isLoading } = useQuery({ queryKey: ['home'], queryFn: storeApi.home });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="relative overflow-hidden rounded-2xl border border-[#10445a] bg-gradient-to-br from-[#0e2432] via-[#113347] to-[#1a4f63] p-7 text-white shadow-[0_20px_60px_rgba(14,36,50,0.35)] md:p-10">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">Operacao comercial de alta performance</p>
              <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Infraestrutura premium para vender hardware com margem e velocidade.</h1>
              <p className="mt-4 max-w-2xl text-sm text-cyan-100/90 md:text-base">
                Catálogo técnico, disponibilidade real de estoque e oferta comercial pronta para B2B/B2C em componentes de alto desempenho.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#19c37d] px-5 text-sm font-black text-[#04212f]">
                  Explorar catálogo <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/catalogo?promotion=true" className="inline-flex min-h-11 items-center rounded-xl border border-white/35 bg-white/10 px-5 text-sm font-bold text-white">
                  Ver oportunidades de promoção
                </Link>
              </div>
            </div>
            <div className="grid gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Metric icon={Activity} label="Disponibilidade" value="99,4%" />
                <Metric icon={Cpu} label="SKUs premium" value="2.1k" />
                <Metric icon={HardDrive} label="Expedição 24h" value="91%" />
              </div>
              <p className="text-xs text-cyan-100/80">Indicadores de operação para acelerar decisão de compra e reposição.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ['Estações e Workstations', 'performance-corporativa'],
            ['GPUs e IA local', 'gpu-e-ia-local'],
            ['Storage NVMe e Backup', 'storage-nvme-e-backup'],
            ['Redes e Infraestrutura', 'redes-e-infraestrutura'],
          ].map(([name, slug]) => (
            <Link key={name} href={`/catalogo?category=${slug}`} className="surface rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 font-bold text-[var(--ui-text)] transition hover:-translate-y-0.5 hover:shadow-focus">
              {name}
            </Link>
          ))}
        </section>

        {isLoading ? <div className="mt-6"><LoadingState label="Sincronizando catálogo" /></div> : null}
        {isError ? <div className="mt-6"><ErrorState title="API indisponível" description="Não foi possível carregar produtos reais do backend." /></div> : null}

        <Block title="Ofertas estratégicas" subtitle="Margem otimizada e giro rápido"><ProductGrid products={data?.promotions ?? []} /></Block>
        <Block title="Lançamentos técnicos" subtitle="Novidades para atualização de portfólio"><ProductGrid products={data?.new ?? []} /></Block>
        <Block title="Mais vendidos" subtitle="Itens com maior tração comercial"><ProductGrid products={data?.best_sellers ?? []} /></Block>

        <section className="mt-12 grid gap-4 md:grid-cols-4">
          {[[CreditCard, 'Pagamento corporativo'], [ShieldCheck, 'Garantia validada'], [Headphones, 'Consultoria técnica'], [Truck, 'Logística nacional']].map(([Icon, label]) => (
            <div key={label as string} className="surface rounded-xl border border-[var(--ui-border)] p-5">
              <Icon className="mb-3 h-6 w-6 text-circuit" />
              <strong>{label as string}</strong>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3">
      <Icon className="mx-auto mb-1 h-4 w-4" />
      <p className="m-0 text-[11px] text-cyan-100/80">{label}</p>
      <strong className="text-sm">{value}</strong>
    </div>
  );
}

function Block({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[var(--ui-text)]">{title}</h2>
          <p className="m-0 text-sm text-graphite">{subtitle}</p>
        </div>
        <Link href="/catalogo" className="text-sm font-bold text-circuit">Ver todos</Link>
      </div>
      {children}
    </section>
  );
}
