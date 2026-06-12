'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { ProductGallery } from '@/components/store/product-gallery';
import { PriceBlock, RatingStars, WishlistButton } from '@/components/store/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { apiErrorMessage, storeApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast-provider';
import { addToCart as addToCartHybrid } from '@/lib/cart-service';
import { getShippingOptions } from '@/lib/commerce';
import { formatMoney } from '@/lib/api';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [shippingCep, setShippingCep] = useState('');
  const [calculatedCep, setCalculatedCep] = useState('');
  const productQuery = useQuery({ queryKey: ['product', slug], queryFn: () => storeApi.product(slug) });
  const product = productQuery.data;
  const reviews = useQuery({ queryKey: ['reviews', product?.id], queryFn: () => storeApi.reviews(product!.id), enabled: !!product });
  const relatedCategory = useQuery({
    queryKey: ['related-category', product?.category?.slug],
    queryFn: () => storeApi.products({ category: product!.category!.slug }),
    enabled: !!product?.category?.slug,
  });
  const relatedBrand = useQuery({
    queryKey: ['related-brand', product?.brand?.slug],
    queryFn: () => storeApi.products({ brand: product!.brand!.slug }),
    enabled: !!product?.brand?.slug,
  });
  const relatedFallback = useQuery({
    queryKey: ['related-fallback'],
    queryFn: () => storeApi.home().then((home) => home.best_sellers),
    enabled: !!product,
  });
  useEffect(() => {
    if (!product?.name) return;
    document.title = `${product.name} | Acatalog Tech`;
  }, [product?.name]);
  const add = useMutation({
    mutationFn: () => addToCartHybrid(product!, 1),
    onSuccess: () => notify('Produto adicionado ao carrinho'),
  });
  const createReview = useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      storeApi.createReview({ product: product!.id, rating: payload.rating, comment: payload.comment }),
    onSuccess: () => {
      notify('Avaliacao enviada');
      queryClient.invalidateQueries({ queryKey: ['reviews', product?.id] });
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });

  const relatedItems = useMemo(() => {
    if (!product) return [];
    const merged = [
      ...(relatedCategory.data ?? []),
      ...(relatedBrand.data ?? []),
      ...(relatedFallback.data ?? []),
    ];
    const dedup = new Map<number, (typeof merged)[number]>();
    for (const item of merged) {
      if (item.id === product.id || dedup.has(item.id)) continue;
      dedup.set(item.id, item);
      if (dedup.size >= 8) break;
    }
    return Array.from(dedup.values());
  }, [product, relatedBrand.data, relatedCategory.data, relatedFallback.data]);
  const specificationEntries = useMemo(() => {
    if (!product?.specifications) return [];
    return Object.entries(product.specifications).filter(([key, value]) => key.trim() && String(value).trim());
  }, [product?.specifications]);
  const fallbackSpecificationEntries = product
    ? [
        ['SKU', product.sku],
        ['Marca', product.brand?.name ?? 'Nao informada'],
        ['Categoria', product.category?.name ?? 'Nao informada'],
        ['Estoque', product.in_stock ? 'Disponivel para compra' : 'Indisponivel'],
      ]
    : [];
  const shippingPreview = product ? getShippingOptions(product.current_price, 0, calculatedCep) : [];
  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  if (productQuery.isLoading) return <><Header /><main className="mx-auto max-w-7xl px-4 py-8"><LoadingState label="Carregando produto" /></main></>;
  if (productQuery.isError || !product) return <><Header /><main className="mx-auto max-w-7xl px-4 py-8"><ErrorState title="Produto nao carregado" description="Nao foi possivel consultar o produto na API." /></main></>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="grid gap-8 lg:grid-cols-[1fr_460px]">
          <ProductGallery product={product} />
          <div className="glass h-fit rounded-xl p-6">
            <p className="font-bold uppercase text-circuit">{product.brand?.name ?? 'Marca'} / {product.category?.name ?? 'Categoria'}</p>
            <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
            <div className="mt-3"><RatingStars rating={product.average_rating} /></div>
            <div className="mt-5"><PriceBlock product={product} /></div>
            <p className="mt-4 text-sm font-semibold">{product.in_stock ? 'Em estoque' : 'Indisponivel'}</p>
            <div className="mt-5 grid gap-3">
              <form
                className="rounded-lg border border-ink/10 bg-[var(--ui-surface)] p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const digits = shippingCep.replace(/\D/g, '');
                  if (digits.length < 8) {
                    notify('Informe um CEP com 8 digitos.');
                    return;
                  }
                  setShippingCep(formatCep(digits));
                  setCalculatedCep(digits);
                }}
              >
                <label className="grid gap-2 text-sm font-black">
                  Simular frete
                  <div className="flex gap-2">
                    <input
                      value={shippingCep}
                      onChange={(event) => setShippingCep(formatCep(event.target.value))}
                      inputMode="numeric"
                      maxLength={9}
                      pattern="\d{5}-?\d{3}"
                      placeholder="55555-555"
                      aria-label="CEP no formato 55555-555"
                      title="Digite um CEP com 8 digitos no formato 55555-555"
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-ink/10 px-3 font-semibold"
                    />
                    <button className="min-h-11 rounded-lg bg-circuit px-4 font-black text-white">Calcular</button>
                  </div>
                </label>
                <p className="mt-2 text-xs font-semibold text-graphite">Cotacao simulada com Jadlog, GOLLOG e Azul Cargo.</p>
                {calculatedCep ? (
                  <div className="mt-3 grid gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-circuit">Opcoes para {calculatedCep.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                    {shippingPreview.map((option) => (
                      <div key={option.id} className="rounded-lg border border-ink/10 bg-[var(--ui-surface-muted)] p-3 text-sm">
                        <div className="flex justify-between gap-3 font-black"><span>{option.carrier}</span><span>{formatMoney(option.price)}</span></div>
                        <p className="mt-1 text-xs font-semibold text-graphite">{option.name} - {option.deadline}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </form>
              <button onClick={() => add.mutate()} className="min-h-12 rounded-lg bg-ink px-4 font-black text-white">Adicionar ao carrinho</button>
              <button onClick={async () => { await add.mutateAsync(); router.push('/carrinho'); }} className="min-h-12 rounded-lg bg-circuit px-4 font-black text-white">Comprar agora</button>
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </section>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="surface rounded-lg p-6"><h2 className="text-xl font-black">Descricao</h2><p className="mt-3 text-graphite">{product.description}</p></div>
          <div className="surface rounded-lg p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Especificacoes tecnicas</h2>
                <p className="mt-1 text-sm font-semibold text-graphite">
                  {specificationEntries.length ? `${specificationEntries.length} detalhes cadastrados no catalogo.` : 'Dados basicos do produto enquanto a ficha completa nao foi cadastrada.'}
                </p>
              </div>
              <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-black uppercase text-circuit">Ficha tecnica</span>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {(specificationEntries.length ? specificationEntries : fallbackSpecificationEntries).map(([key, value]) => (
                <div className="rounded-lg border border-ink/10 bg-[var(--ui-surface-muted)] p-3" key={key}>
                  <dt className="text-xs font-black uppercase text-graphite">{key}</dt>
                  <dd className="mt-1 text-sm font-black text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="surface rounded-lg p-5">
            <h2 className="text-xl font-black">Avaliacoes</h2>
            <form
              className="mt-4 grid gap-3 rounded-lg border border-ink/10 bg-[var(--ui-surface)] p-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                createReview.mutate({
                  rating: Number(form.get('rating')),
                  comment: String(form.get('comment') || ''),
                });
                event.currentTarget.reset();
              }}
            >
              <label className="grid gap-1 text-sm font-bold">
                Nota
                <select name="rating" defaultValue="5" className="min-h-11 rounded-lg border border-ink/10 bg-white px-3">
                  <option value="5">5 - Excelente</option>
                  <option value="4">4 - Muito bom</option>
                  <option value="3">3 - Bom</option>
                  <option value="2">2 - Regular</option>
                  <option value="1">1 - Ruim</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Comentario
                <textarea name="comment" rows={3} placeholder="Conte como foi sua experiencia com o produto" className="rounded-lg border border-ink/10 px-3 py-2" />
              </label>
              <button disabled={createReview.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white disabled:opacity-50">
                {createReview.isPending ? 'Enviando avaliacao...' : 'Enviar avaliacao'}
              </button>
              <p className="text-xs font-semibold text-graphite">E necessario estar logado e cada cliente pode avaliar o produto uma vez.</p>
            </form>
            <div className="mt-3 grid gap-3">
              {reviews.data?.length ? reviews.data.map((review: { id: number; rating: number; comment: string }) => <div key={review.id} className="rounded-lg border border-ink/10 p-3"><RatingStars rating={review.rating} /><p className="mt-2 text-sm">{review.comment}</p></div>) : <p className="text-sm text-graphite">Ainda nao ha avaliacoes para este produto.</p>}
            </div>
          </div>
          <div className="surface rounded-lg p-5">
            <h2 className="text-xl font-black">Compra segura</h2>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="rounded-lg border border-ink/10 p-3">
                <strong>Garantia validada</strong>
                <p className="mt-1 text-graphite">Produto conferido pelo time Acatalog, com suporte para troca dentro das regras da loja.</p>
              </div>
              <div className="rounded-lg border border-ink/10 p-3">
                <strong>Estoque sincronizado</strong>
                <p className="mt-1 text-graphite">{product.in_stock ? 'Item disponivel para separacao apos confirmacao do pedido.' : 'Item indisponivel no momento para compra imediata.'}</p>
              </div>
              <div className="rounded-lg border border-ink/10 p-3">
                <strong>Pagamento flexivel</strong>
                <p className="mt-1 text-graphite">Compra com cartao, Pix ou boleto no checkout, com resumo completo antes de finalizar.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-10"><h2 className="mb-4 text-xl font-black">Produtos relacionados</h2><ProductGrid products={relatedItems} /></section>
      </main>
      <Footer />
    </>
  );
}
