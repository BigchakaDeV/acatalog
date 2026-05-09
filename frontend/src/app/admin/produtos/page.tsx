'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductForm } from '@/components/admin/forms';
import { adminApi, apiErrorMessage, formatMoney } from '@/lib/api';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast-provider';
import type { Product } from '@/lib/types';
import styles from './products.module.css';

const toNumber = (value?: string | number | null) => Number(value ?? 0);

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'price' | 'stock'>('revenue');

  const { data = [], isError, isLoading } = useQuery<Product[]>({ queryKey: ['admin-products'], queryFn: adminApi.products });
  const editingDetailQuery = useQuery<Product>({
    queryKey: ['admin-product-detail', editingSlug],
    queryFn: () => adminApi.productDetail(editingSlug as string),
    enabled: Boolean(editingSlug && editingSlug !== 'new'),
  });

  const editingProduct = useMemo(() => data.find((item) => item.slug === editingSlug) ?? null, [data, editingSlug]);
  const editingProductForForm = editingSlug === 'new'
    ? null
    : (editingDetailQuery.data ?? editingProduct);
  const categories = useMemo(() => Array.from(new Set(data.map((item) => item.category?.name).filter(Boolean))) as string[], [data]);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const list = data.filter((item) => {
      const hitSearch = !normalized
        || item.name.toLowerCase().includes(normalized)
        || item.sku.toLowerCase().includes(normalized)
        || (item.brand?.name ?? '').toLowerCase().includes(normalized);
      const hitStatus = statusFilter === 'all' || (statusFilter === 'in' ? item.in_stock : !item.in_stock);
      const hitCategory = categoryFilter === 'all' || item.category?.name === categoryFilter;
      return hitSearch && hitStatus && hitCategory;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortBy === 'price') return toNumber(b.current_price || b.price) - toNumber(a.current_price || a.price);
      if (sortBy === 'stock') return toNumber(b.inventory?.quantity) - toNumber(a.inventory?.quantity);
      return toNumber(b.current_price || b.price) * toNumber(b.sold_count) - toNumber(a.current_price || a.price) * toNumber(a.sold_count);
    });
    return sorted;
  }, [categoryFilter, data, search, sortBy, statusFilter]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredProducts.reduce((sum, item) => sum + toNumber(item.current_price || item.price) * toNumber(item.sold_count), 0);
    const soldUnits = filteredProducts.reduce((sum, item) => sum + toNumber(item.sold_count), 0);
    const avgTicket = soldUnits > 0 ? totalRevenue / soldUnits : 0;
    const outStock = filteredProducts.filter((item) => !item.in_stock).length;
    const avgMargin = 34.5;
    return {
      totalRevenue,
      avgTicket,
      outStock,
      avgMargin,
      dailyOrders: Math.max(1, Math.round(filteredProducts.length * 0.45)),
    };
  }, [filteredProducts]);

  const alerts = useMemo(() => {
    const ruptura = filteredProducts.filter((item) => !item.in_stock).slice(0, 3);
    const low = filteredProducts.filter((item) => toNumber(item.inventory?.quantity) > 0 && toNumber(item.inventory?.quantity) <= 5).slice(0, 3);
    const semPromo = filteredProducts.filter((item) => !item.promotional_price).slice(0, 3);
    return [
      {
        title: 'Ruptura de estoque',
        body: ruptura.length ? `${ruptura.map((item) => item.sku).join(', ')} exigem reposicao imediata.` : 'Nenhum item em ruptura no momento.',
      },
      {
        title: 'Estoque critico',
        body: low.length ? `${low.map((item) => `${item.sku} (${item.inventory?.quantity ?? 0})`).join(', ')}.` : 'Sem itens abaixo do estoque minimo.',
      },
      {
        title: 'Preco defasado / promocao',
        body: semPromo.length ? `${semPromo.map((item) => item.sku).join(', ')} sem preco promocional ativo.` : 'Todos os itens analisados possuem oferta ativa.',
      },
    ];
  }, [filteredProducts]);

  const removeProduct = useMutation({
    mutationFn: (slug: string) => adminApi.deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      if (editingSlug) setEditingSlug(null);
      notify('Produto excluido com sucesso');
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });

  return (
    <AdminLayout>
      <div className={styles.page}>
        <section className={styles.topbar}>
          <div className={styles.titleBlock}>
            <p>Centro comercial</p>
            <h1>Dashboard de produtos e operacao</h1>
          </div>
          <div className={styles.topbarActions}>
            <input className={styles.searchInput} placeholder="Busca global por SKU, nome ou marca" value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
            <button type="button" className={styles.iconButton} aria-label="Notificacoes"><Bell className="h-4 w-4" /></button>
            <button type="button" className={styles.actionButton} onClick={() => setEditingSlug('new')}><Plus className="h-4 w-4" /> Novo produto</button>
          </div>
        </section>

        <section className={styles.kpiGrid}>
          <article className={styles.kpiCard}><p>Faturamento estimado</p><strong>{formatMoney(metrics.totalRevenue)}</strong></article>
          <article className={styles.kpiCard}><p>Ticket medio</p><strong>{formatMoney(metrics.avgTicket)}</strong></article>
          <article className={styles.kpiCard}><p>Produtos sem estoque</p><strong>{String(metrics.outStock)}</strong></article>
          <article className={styles.kpiCard}><p>Margem media</p><strong>{metrics.avgMargin.toFixed(1)}%</strong></article>
          <article className={styles.kpiCard}><p>Pedidos do dia</p><strong>{String(metrics.dailyOrders)}</strong></article>
        </section>

        {isLoading ? <LoadingState label="Carregando produtos" /> : null}
        {isError ? <ErrorState title="Produtos indisponiveis" description="Verifique o login administrativo e se a API esta online." /> : null}

        {!isLoading && !isError ? (
          <section className={styles.layoutGrid}>
            <div className={styles.productPanel}>
              <div className={styles.tableHeader}>
                <h2>Catalogo operacional</h2>
                <span>{filteredProducts.length} produtos</span>
              </div>

              <div className={styles.filterRow}>
                <input className={styles.filterInput} placeholder="Filtro rapido (nome, SKU, marca)" value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
                <select className={styles.filterSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value as 'all' | 'in' | 'out')}>
                  <option value="all">Todos status</option>
                  <option value="in">Com estoque</option>
                  <option value="out">Sem estoque</option>
                </select>
                <select className={styles.filterSelect} value={categoryFilter} onChange={(event) => setCategoryFilter(event.currentTarget.value)}>
                  <option value="all">Todas categorias</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <select className={styles.filterSelect} value={sortBy} onChange={(event) => setSortBy(event.currentTarget.value as 'revenue' | 'price' | 'stock')}>
                  <option value="revenue">Ordenar por receita</option>
                  <option value="price">Ordenar por preco</option>
                  <option value="stock">Ordenar por estoque</option>
                </select>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.productCell}>Produto</th>
                      <th className={styles.skuCell}>SKU</th>
                      <th>Preco</th>
                      <th>Estoque</th>
                      <th>Fotos</th>
                      <th>Status</th>
                      <th className={styles.actionsCell}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className={styles.productCell}>
                          <div className={styles.productCellContent}>
                            {product.primary_image?.image ? <img src={product.primary_image.image} alt={product.name} className={styles.rowImage} /> : <div className={styles.rowImage} />}
                            <div>
                              <strong className={styles.productTitle}>{product.name}</strong>
                              <p className="m-0 text-xs text-[var(--ui-text-muted)]">{product.brand?.name ?? 'Sem marca'}</p>
                            </div>
                          </div>
                        </td>
                        <td className={styles.skuCell}>{product.sku}</td>
                        <td>{formatMoney(product.current_price || product.price)}</td>
                        <td>{String(product.inventory?.quantity ?? 0)}</td>
                        <td>{`${product.images?.length ?? (product.primary_image ? 1 : 0)}/${6}`}</td>
                        <td>
                          <span className={product.in_stock ? styles.statusOk : styles.statusWarn}>
                            {product.in_stock ? 'Disponivel' : 'Sem estoque'}
                          </span>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionsWrap}>
                            <button type="button" className={styles.actionGhost} onClick={() => setEditingSlug(product.slug)}><Pencil className="h-3.5 w-3.5" /> Editar</button>
                            <button
                              type="button"
                              className={styles.actionDanger}
                              onClick={() => {
                                if (!window.confirm(`Excluir o produto "${product.name}"?`)) return;
                                removeProduct.mutate(product.slug);
                              }}
                              disabled={removeProduct.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!filteredProducts.length ? <p className="mt-3 rounded-lg border border-dashed border-[var(--ui-border)] p-4 text-sm font-bold text-[var(--ui-text-muted)]">Nenhum produto encontrado para os filtros selecionados.</p> : null}

              <section className={`${styles.alertPanel} mt-3`}>
                {alerts.map((alert) => (
                  <article key={alert.title} className={styles.alertItem}>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </article>
                ))}
              </section>
            </div>

            <ProductForm
              editingProduct={editingProductForForm}
              isEditingLoading={Boolean(editingSlug && editingSlug !== 'new' && editingDetailQuery.isLoading)}
              onCancelEdit={() => setEditingSlug(null)}
            />
          </section>
        ) : null}
      </div>
    </AdminLayout>
  );
}
