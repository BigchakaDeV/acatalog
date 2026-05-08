'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout, OrderStatusBadge } from '@/components/admin/admin-layout';
import { adminApi, apiErrorMessage, formatMoney } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import type { Order } from '@/lib/types';

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const orders = useQuery<Order[]>({ queryKey: ['admin-orders'], queryFn: adminApi.orders });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.updateOrder(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-black">Pedidos</h1>
      <div className="surface rounded-lg p-5">
        {orders.data?.map((order) => <div key={order.id} className="grid gap-3 border-b border-ink/10 py-3 md:grid-cols-[1fr_1fr_auto_auto]"><strong>#{order.id}</strong><span>{formatMoney(order.total)}</span><OrderStatusBadge status={order.status} /><select defaultValue={order.status} onChange={(e) => update.mutate({ id: order.id, status: e.target.value })} className="rounded-lg border border-ink/10 px-2"><option value="pending">pendente</option><option value="paid">pago</option><option value="shipped">enviado</option><option value="delivered">entregue</option><option value="canceled">cancelado</option></select></div>)}
        {!orders.data?.length ? <p className="text-sm text-graphite">Nenhum pedido encontrado.</p> : null}
      </div>
    </AdminLayout>
  );
}
