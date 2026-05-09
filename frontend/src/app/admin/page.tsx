'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Boxes, CreditCard, ShoppingBag, Tags, TrendingUp, Users } from 'lucide-react';
import { AdminLayout, OrderStatusBadge } from '@/components/admin/admin-layout';
import { adminApi, apiErrorMessage, formatMoney, tokenStore } from '@/lib/api';
import type { Order, Product } from '@/lib/types';

type DashboardMetrics = {
  total_sales: string | number;
  total_orders: number;
  average_ticket: string | number;
  low_stock: number;
  recent_orders: Order[];
  best_sellers: Product[];
  sales_chart: Array<{ label: string; sales: string | number; orders: number }>;
};

const quickSections = [
  { title: 'Produtos', subtitle: 'Cadastro, estoque e precificacao', href: '/admin/produtos', icon: Boxes },
  { title: 'Categorias e marcas', subtitle: 'Curadoria do catalogo', href: '/admin/categorias', icon: Tags },
  { title: 'Pedidos', subtitle: 'Status, pagamento e entrega', href: '/admin/pedidos', icon: ShoppingBag },
  { title: 'Clientes', subtitle: 'Relacionamento e recorrencia', href: '/admin/clientes', icon: Users },
];

const toNumber = (value: string | number | undefined) => Number(value ?? 0);

export default function AdminPage() {
  const hasToken = typeof window !== 'undefined' && Boolean(tokenStore.get());
  const { data, isError, error, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: adminApi.metrics,
    enabled: hasToken,
  });

  const chart = data?.sales_chart ?? [];
  const chartMax = useMemo(() => Math.max(...chart.map((item) => toNumber(item.sales)), 1), [chart]);
  const salesToday = chart.length ? toNumber(chart[chart.length - 1].sales) : 0;
  const salesYesterday = chart.length > 1 ? toNumber(chart[chart.length - 2].sales) : 0;
  const salesDelta = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday) * 100 : salesToday > 0 ? 100 : 0;

  if (!hasToken) {
    return (
      <AdminLayout>
        <section className="surface mx-auto max-w-3xl rounded-2xl p-8 text-center shadow-glass">
          <p className="text-sm font-black uppercase tracking-wide text-circuit">Acesso administrativo</p>
          <h1 className="mt-2 text-3xl font-black">Entre para gerenciar a loja</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-graphite">
            O dashboard usa a API administrativa para produtos, cupons, pedidos, clientes e métricas. Faça login para liberar o painel.
          </p>
          <Link href="/admin/login" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 font-black text-white">
            Fazer login admin
          </Link>
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="rounded-2xl border border-[#0b1d3a] bg-gradient-to-r from-[#06142a] via-[#0a2347] to-[#113769] p-6 text-white shadow-glass md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Painel executivo</p>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">Visão operacional de vendas, catálogo e clientes</h1>
            <p className="mt-3 max-w-2xl text-sm text-blue-100/90">
              Acompanhe faturamento, pedidos e performance do catálogo em um só lugar para decidir mais rápido e vender melhor.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/admin/produtos" className="inline-flex min-h-10 items-center rounded-lg bg-limepulse px-4 text-sm font-black text-[#02122b]">Novo produto</Link>
              <Link href="/admin/pedidos" className="inline-flex min-h-10 items-center rounded-lg bg-white/10 px-4 text-sm font-black text-white">Acompanhar pedidos</Link>
              <Link href="/admin/categorias" className="inline-flex min-h-10 items-center rounded-lg bg-white/10 px-4 text-sm font-black text-white">Gerir categorias</Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-100/70">Pulso de vendas</p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs text-blue-100/70">Hoje</p>
                <p className="text-2xl font-black">{formatMoney(salesToday)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${salesDelta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {salesDelta >= 0 ? '+' : ''}
                {salesDelta.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-blue-100/70">Comparativo com o dia anterior.</p>
          </div>
        </div>
      </section>

      {isLoading ? <p className="mt-5 rounded-lg bg-white p-4 text-sm font-bold text-graphite">Carregando métricas do backend...</p> : null}
      {isError ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="h-5 w-5" /> {apiErrorMessage(error)}
        </div>
      ) : null}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-graphite">Faturamento total</p>
            <TrendingUp className="h-4 w-4 text-circuit" />
          </div>
          <p className="mt-3 text-3xl font-black">{formatMoney(data?.total_sales ?? 0)}</p>
        </article>
        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-graphite">Pedidos</p>
            <CreditCard className="h-4 w-4 text-circuit" />
          </div>
          <p className="mt-3 text-3xl font-black">{String(data?.total_orders ?? 0)}</p>
        </article>
        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-graphite">Ticket médio</p>
            <ShoppingBag className="h-4 w-4 text-circuit" />
          </div>
          <p className="mt-3 text-3xl font-black">{formatMoney(data?.average_ticket ?? 0)}</p>
        </article>
        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-graphite">Alerta de estoque</p>
            <Boxes className="h-4 w-4 text-circuit" />
          </div>
          <p className="mt-3 text-3xl font-black">{String(data?.low_stock ?? 0)}</p>
        </article>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Receita diária</h2>
            <span className="text-xs font-semibold uppercase text-graphite">Últimos dias</span>
          </div>
          {(chart ?? []).length ? (
            <div className="grid gap-2">
              <div className="flex h-52 items-end gap-2">
                {chart.map((item) => {
                  const value = toNumber(item.sales);
                  const height = Math.max((value / chartMax) * 180, 10);
                  return (
                    <div key={item.label} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-t-md bg-gradient-to-t from-circuit to-[#5ce8da] transition group-hover:brightness-110" style={{ height: `${height}px` }} />
                      <span className="text-[11px] font-bold text-graphite">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-ink/20 p-4 text-sm font-bold text-graphite">Sem vendas registradas ainda.</p>
          )}
        </article>

        <article className="surface rounded-xl border border-ink/10 p-5 shadow-glass">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-black text-circuit">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-2">
            {(data?.recent_orders ?? []).length ? (
              data?.recent_orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-ink/10 p-3">
                  <div className="flex items-center justify-between">
                    <strong>Pedido #{order.id}</strong>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-graphite">{formatMoney(order.total)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-ink/20 p-4 text-sm font-bold text-graphite">Nenhum pedido encontrado.</p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickSections.map((section) => (
          <Link key={section.href} href={section.href} className="surface rounded-xl border border-ink/10 p-5 shadow-glass transition hover:-translate-y-0.5 hover:shadow-focus">
            <section.icon className="h-5 w-5 text-circuit" />
            <h3 className="mt-4 text-lg font-black">{section.title}</h3>
            <p className="mt-2 text-sm text-graphite">{section.subtitle}</p>
          </Link>
        ))}
      </section>

      <section className="mt-5 surface rounded-xl border border-ink/10 p-5 shadow-glass">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Produtos mais vendidos</h2>
          <Link href="/admin/produtos" className="text-sm font-black text-circuit">Gerenciar produtos</Link>
        </div>
        <div className="grid gap-2">
          {(data?.best_sellers ?? []).length ? (
            data?.best_sellers.map((product, index) => (
              <div key={product.id} className="grid gap-2 rounded-lg border border-ink/10 p-3 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-circuit/10 text-sm font-black text-circuit">{index + 1}</span>
                <strong>{product.name}</strong>
                <span>{formatMoney(product.current_price)}</span>
                <span className="text-sm font-bold text-graphite">{product.sold_count} vendas</span>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-ink/20 p-4 text-sm font-bold text-graphite">Nenhum produto vendido ainda.</p>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
