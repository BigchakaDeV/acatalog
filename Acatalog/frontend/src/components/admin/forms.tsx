'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, adminApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import type { Category, Brand } from '@/lib/types';

const slugify = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function ProductForm() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });
  const brands = useQuery({ queryKey: ['admin-brands'], queryFn: adminApi.brands });
  const mutation = useMutation({
    mutationFn: adminApi.saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      notify('Produto salvo na API');
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="surface grid gap-3 rounded-lg p-5 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = String(form.get('name'));
      mutation.mutate({
        name,
        slug: slugify(name),
        sku: String(form.get('sku')),
        price: String(form.get('price')),
        promotional_price: String(form.get('promotional_price') || '') || null,
        category_id: Number(form.get('category_id')),
        brand_id: Number(form.get('brand_id')),
        description: String(form.get('description')),
        specifications: {},
        is_active: form.get('is_active') === 'on',
        is_featured: form.get('is_featured') === 'on',
        is_new: form.get('is_new') === 'on',
        is_best_seller: form.get('is_best_seller') === 'on',
        inventory: { quantity: Number(form.get('quantity')), low_stock_threshold: 5, reserved: 0 },
      });
    }}>
      <input name="name" placeholder="Nome" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="sku" placeholder="SKU" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="price" placeholder="Preco" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="promotional_price" placeholder="Preco promocional" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="quantity" type="number" placeholder="Estoque" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <select name="category_id" className="min-h-11 rounded-lg border border-ink/10 px-3" required>
        <option value="">Categoria</option>
        {(categories.data as Category[])?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <select name="brand_id" className="min-h-11 rounded-lg border border-ink/10 px-3" required>
        <option value="">Marca</option>
        {(brands.data as Brand[])?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <textarea name="description" placeholder="Descricao e especificacoes" className="min-h-28 rounded-lg border border-ink/10 p-3 md:col-span-2" required />
      <label className="rounded-lg border border-dashed border-ink/20 p-5 text-sm font-semibold md:col-span-2">Upload/selecionar imagens</label>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Ativo</label>
        <label className="flex items-center gap-2"><input name="is_featured" type="checkbox" /> Destaque</label>
        <label className="flex items-center gap-2"><input name="is_new" type="checkbox" /> Lancamento</label>
        <label className="flex items-center gap-2"><input name="is_best_seller" type="checkbox" /> Mais vendido</label>
      </div>
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">{mutation.isPending ? 'Salvando...' : 'Salvar produto'}</button>
    </form>
  );
}

export function CouponForm() {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: adminApi.saveCoupon,
    onSuccess: () => notify('Cupom salvo'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="surface grid gap-3 rounded-lg p-5 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        code: String(form.get('code')).toUpperCase(),
        value: String(form.get('value')),
        valid_from: String(form.get('valid_from')),
        valid_until: String(form.get('valid_until')),
        usage_limit: Number(form.get('usage_limit') || 0),
        used_count: 0,
        discount_type: String(form.get('discount_type')),
        is_active: form.get('is_active') === 'on',
      });
    }}>
      <input name="code" placeholder="Codigo" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="value" placeholder="Valor" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="valid_from" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="valid_until" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="usage_limit" type="number" placeholder="Limite de uso" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <select name="discount_type" className="min-h-11 rounded-lg border border-ink/10 px-3"><option value="percent">Percentual</option><option value="fixed">Valor fixo</option></select>
      <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Ativo</label>
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">Salvar cupom</button>
    </form>
  );
}

export function PromotionForm() {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: adminApi.savePromotion,
    onSuccess: () => notify('Promocao salva'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="surface grid gap-3 rounded-lg p-5 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        name: String(form.get('name')),
        old_price: String(form.get('old_price') || '') || null,
        promotional_price: String(form.get('promotional_price')),
        starts_at: String(form.get('starts_at')),
        ends_at: String(form.get('ends_at')),
        badge: String(form.get('badge') || 'Oferta'),
        is_active: form.get('is_active') === 'on',
        is_featured: form.get('is_featured') === 'on',
        products: [],
      });
    }}>
      <input name="name" placeholder="Campanha" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="old_price" placeholder="Preco antigo" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="promotional_price" placeholder="Preco promocional" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="starts_at" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="ends_at" type="datetime-local" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="badge" placeholder="Selo" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked /> Ativa na loja</label>
      <label className="flex items-center gap-2"><input name="is_featured" type="checkbox" /> Destaque</label>
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">Salvar promocao</button>
    </form>
  );
}
