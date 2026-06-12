'use client';

import Link from 'next/link';
import { ShieldCheck, Truck, Headphones, CreditCard, ArrowUpRight, Activity, Cpu, HardDrive, BadgePercent, TimerReset } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { storeApi } from '@/lib/api';

export default function HomePage() {
  const { data, isError, isLoading } = useQuery({ queryKey: ['home'], queryFn: storeApi.home });
  const fallbackProducts = data ? [...data.promotions, ...data.new, ...data.best_sellers] : [];
  const promotionProducts = data?.promotions.length ? data.promotions : fallbackProducts;
  const newProducts = data?.new.length ? data.new : fallbackProducts;
  const bestSellerProducts = data?.best_sellers.length ? data.best_sellers : fallbackProducts;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="relative overflow-hidden rounded-lg border border-[#10445a] bg-gradient-to-br from-[#0e2432] via-[#12374c] to-[#1a4f63] p-7 text-white shadow-[0_18px_48px_rgba(14,36,50,0.25)] md:p-10">
            <div className="grid min-h-[390px] gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <p className="inline-flex rounded-md bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Loja tecnica de hardware</p>
                <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">Componentes, perifericos e maquinas prontas para vender mais rapido.</h1>
                <p className="mt-4 max-w-2xl text-sm font-semibold text-cyan-100/90 md:text-base">
                  Estoque real, ofertas ativas e catalogo organizado para compra B2B/B2C sem friccao.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#19c37d] px-5 text-sm font-black uppercase text-[#04212f]">
                    Ver catalogo <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link href="/catalogo?promotion=true" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/35 bg-white/10 px-5 text-sm font-black uppercase text-white">
                    Ofertas do dia
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-cyan-100"><TimerReset className="h-4 w-4" /> Operacao em tempo real</div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Metric icon={Activity} label="Disponibilidade" value="99,4%" />
                  <Metric icon={Cpu} label="SKUs premium" value="2.1k" />
                  <Metric icon={HardDrive} label="Expedicao" value="24h" />
                </div>
                <p className="text-xs font-semibold text-cyan-100/80">Indicadores comerciais para compra, reposicao e atendimento.</p>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <DealCard title="Campanha ativa" text="Produtos em promocao com pronta entrega." href="/catalogo?promotion=true" icon={BadgePercent} />
            <DealCard title="Monte seu setup" text="GPU, CPU, memoria e storage por categoria." href="/catalogo" icon={Cpu} />
          </aside>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ['Workstations', 'performance-corporativa'],
            ['GPUs e IA local', 'placas-de-video'],
            ['Storage NVMe', 'ssds-e-armazenamento'],
            ['Redes e energia', 'fontes'],
          ].map(([name, slug]) => (
            <Link key={name} href={`/catalogo?category=${slug}`} className="group rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 font-black text-[var(--ui-text)] shadow-[0_6px_18px_rgba(16,24,32,0.05)] transition hover:border-circuit">
              <span className="text-xs uppercase tracking-wide text-circuit">Departamento</span>
              <span className="mt-1 block">{name}</span>
            </Link>
          ))}
        </section>

        {isLoading ? <div className="mt-6"><LoadingState label="Sincronizando catalogo" /></div> : null}
        {isError ? <div className="mt-6"><ErrorState title="API indisponivel" description="Nao foi possivel carregar produtos reais do backend." /></div> : null}

        {!isLoading && !isError ? (
          <>
            <Block title="Ofertas estrategicas" subtitle="Produtos com preco agressivo e giro rapido"><ProductGrid products={promotionProducts} /></Block>
            <Block title="Lancamentos tecnicos" subtitle="Novidades para atualizar o catalogo"><ProductGrid products={newProducts} /></Block>
            <Block title="Mais vendidos" subtitle="Itens com maior tracao comercial"><ProductGrid products={bestSellerProducts} /></Block>
          </>
        ) : null}

        <section className="mt-12 grid gap-4 md:grid-cols-4">
          {[[CreditCard, 'Pagamento corporativo'], [ShieldCheck, 'Garantia validada'], [Headphones, 'Consultoria tecnica'], [Truck, 'Logistica nacional']].map(([Icon, label]) => (
            <div key={label as string} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
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
    <div className="rounded-md border border-white/15 bg-white/10 p-3">
      <Icon className="mx-auto mb-1 h-4 w-4" />
      <p className="m-0 text-[11px] font-bold text-cyan-100/80">{label}</p>
      <strong className="text-sm">{value}</strong>
    </div>
  );
}

function DealCard({ title, text, href, icon: Icon }: { title: string; text: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="grid min-h-[188px] content-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[0_8px_24px_rgba(16,24,32,0.07)] transition hover:border-circuit">
      <Icon className="h-7 w-7 text-circuit" />
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--ui-text-muted)]">{text}</p>
      </div>
    </Link>
  );
}

function Block({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-circuit">Vitrine</p>
          <h2 className="text-2xl font-black text-[var(--ui-text)]">{title}</h2>
          <p className="m-0 text-sm font-semibold text-[var(--ui-text-muted)]">{subtitle}</p>
        </div>
        <Link href="/catalogo" className="rounded-md border border-[var(--ui-border)] px-3 py-2 text-sm font-black text-[var(--ui-text)] hover:border-circuit">Ver todos</Link>
      </div>
      {children}
    </section>
  );
}
