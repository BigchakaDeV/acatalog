'use client';

import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductForm } from '@/components/admin/forms';
import { adminApi, formatMoney } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function AdminProductsPage() {
  const { data = [] } = useQuery({ queryKey: ['admin-products'], queryFn: adminApi.products });
  return (
    <AdminLayout>
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <section className="surface rounded-lg p-5">
          <h1 className="mb-4 text-2xl font-black">Produtos</h1>
          <div className="grid gap-3">{(data as Product[]).map((product) => <div key={product.id} className="grid gap-2 rounded-lg border border-ink/10 p-3 md:grid-cols-[1fr_auto_auto]"><strong>{product.name}</strong><span>{formatMoney(product.current_price)}</span><span>{product.in_stock ? 'Ativo' : 'Sem estoque'}</span></div>)}</div>
        </section>
        <ProductForm />
      </div>
    </AdminLayout>
  );
}
