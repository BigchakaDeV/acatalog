'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { adminApi } from '@/lib/api';

type Customer = { id: number; email: string; username: string; first_name?: string; last_name?: string };

export default function AdminCustomersPage() {
  const customers = useQuery<Customer[]>({ queryKey: ['admin-customers'], queryFn: adminApi.customers });
  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-black">Clientes</h1>
      <div className="surface rounded-lg p-5">
        {customers.data?.map((customer) => <div key={customer.id} className="grid gap-2 border-b border-ink/10 py-3 md:grid-cols-3"><strong>{customer.email}</strong><span>{customer.first_name} {customer.last_name}</span><span>{customer.username}</span></div>)}
        {!customers.data?.length ? <p className="text-sm text-graphite">Nenhum cliente encontrado.</p> : null}
      </div>
    </AdminLayout>
  );
}
