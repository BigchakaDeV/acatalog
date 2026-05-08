'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/admin-layout';
import { adminApi, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import type { Category, Brand } from '@/lib/types';

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const brands = useQuery({ queryKey: ['admin-brands'], queryFn: adminApi.brands });
  const saveCategory = useMutation({ mutationFn: adminApi.saveCategory, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }), onError: (error) => notify(apiErrorMessage(error)) });
  const saveBrand = useMutation({ mutationFn: adminApi.saveBrand, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-brands'] }), onError: (error) => notify(apiErrorMessage(error)) });

  return (
    <AdminLayout>
      <h1 className="mb-4 text-2xl font-black">Categorias e marcas</h1>
      <div className="grid gap-5 md:grid-cols-2">
        <form className="surface grid gap-3 rounded-lg p-5" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const name = String(form.get('name'));
          saveCategory.mutate({ name, slug: slugify(name), description: '', is_active: true, is_featured: form.get('is_featured') === 'on', sort_order: Number(form.get('sort_order') || 0) });
        }}>
          <h2 className="text-xl font-black">Categorias</h2>
          <input name="name" placeholder="Nome" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
          <input name="sort_order" type="number" placeholder="Ordem na home" className="min-h-11 rounded-lg border border-ink/10 px-3" />
          <label className="flex items-center gap-2"><input name="is_featured" type="checkbox" /> Aparece na home</label>
          <button className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">Salvar</button>
          <div className="grid gap-2 text-sm">{categories.data?.map((item: Category) => <span key={item.id}>{item.name}</span>)}</div>
        </form>
        <form className="surface grid gap-3 rounded-lg p-5" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const name = String(form.get('name'));
          saveBrand.mutate({ name, slug: slugify(name), is_active: true, is_featured: form.get('is_featured') === 'on' });
        }}>
          <h2 className="text-xl font-black">Marcas</h2>
          <input name="name" placeholder="Nome" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
          <label className="flex items-center gap-2"><input name="is_featured" type="checkbox" /> Aparece na home</label>
          <button className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">Salvar</button>
          <div className="grid gap-2 text-sm">{brands.data?.map((item: Brand) => <span key={item.id}>{item.name}</span>)}</div>
        </form>
      </div>
    </AdminLayout>
  );
}
