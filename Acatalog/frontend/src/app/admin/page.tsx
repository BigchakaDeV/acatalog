'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminLayout, AdminMetricCard, OrderStatusBadge } from '@/components/admin/admin-layout';
import { adminApi, formatMoney } from '@/lib/api';

export default function AdminPage() {
  const { data } = useQuery({ queryKey: ['admin-metrics'], queryFn: adminApi.metrics });
  return (
    <AdminLayout>
      <section className="grid gap-4 md:grid-cols-4">
        <AdminMetricCard label="Total de vendas" value={formatMoney(data?.total_sales ?? 0)} />
        <AdminMetricCard label="Total de pedidos" value={String(data?.total_orders ?? 0)} />
        <AdminMetricCard label="Ticket medio" value={formatMoney(data?.average_ticket ?? 0)} />
        <AdminMetricCard label="Estoque baixo" value={String(data?.low_stock ?? 0)} />
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="surface rounded-lg p-5"><h2 className="text-xl font-black">Grafico de vendas</h2><div className="mt-5 flex h-52 items-end gap-3">{(data?.sales_chart ?? []).map((item: { label: string; sales: number }) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t bg-circuit" style={{ height: `${Math.max(item.sales / 300, 12)}px` }} /><span className="text-xs font-bold">{item.label}</span></div>)}</div></div>
        <div className="surface rounded-lg p-5"><h2 className="text-xl font-black">Pedidos recentes</h2><div className="mt-4 grid gap-2">{['#1045', '#1044', '#1043'].map((id) => <div key={id} className="flex justify-between rounded-lg border border-ink/10 p-3"><strong>{id}</strong><OrderStatusBadge status="pago" /></div>)}</div></div>
      </section>
    </AdminLayout>
  );
}
