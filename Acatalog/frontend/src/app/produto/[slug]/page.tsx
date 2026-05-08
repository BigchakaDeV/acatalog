'use client';

import { useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { ProductGallery } from '@/components/store/product-gallery';
import { PriceBlock, RatingStars, WishlistButton } from '@/components/store/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { storeApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast-provider';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { notify } = useToast();
  const productQuery = useQuery({ queryKey: ['product', slug], queryFn: () => storeApi.product(slug) });
  const product = productQuery.data;
  const reviews = useQuery({ queryKey: ['reviews', product?.id], queryFn: () => storeApi.reviews(product!.id), enabled: !!product });
  const related = useQuery({ queryKey: ['related', product?.category.slug], queryFn: () => storeApi.products({ category: product!.category.slug }), enabled: !!product });
  const add = useMutation({ mutationFn: () => storeApi.addToCart(product!.id, 1), onSuccess: () => notify('Carrinho recalculado pela API') });

  if (productQuery.isLoading) return <><Header /><main className="mx-auto max-w-7xl px-4 py-8"><LoadingState label="Carregando produto" /></main></>;
  if (productQuery.isError || !product) return <><Header /><main className="mx-auto max-w-7xl px-4 py-8"><ErrorState title="Produto nao carregado" description="Nao foi possivel consultar o produto na API." /></main></>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="grid gap-8 lg:grid-cols-[1fr_460px]">
          <ProductGallery product={product} />
          <div className="glass h-fit rounded-xl p-6">
            <p className="font-bold uppercase text-circuit">{product.brand.name} / {product.category.name}</p>
            <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
            <div className="mt-3"><RatingStars rating={product.average_rating} /></div>
            <div className="mt-5"><PriceBlock product={product} /></div>
            <p className="mt-4 text-sm font-semibold">{product.in_stock ? 'Em estoque' : 'Indisponivel'}</p>
            <div className="mt-5 grid gap-3">
              <input placeholder="Calcular frete por CEP" className="min-h-11 rounded-lg border border-ink/10 px-3" />
              <button onClick={() => add.mutate()} className="min-h-12 rounded-lg bg-ink px-4 font-black text-white">Adicionar ao carrinho</button>
              <button onClick={() => add.mutate()} className="min-h-12 rounded-lg bg-circuit px-4 font-black text-white">Comprar agora</button>
              <WishlistButton productId={product.id} />
            </div>
          </div>
        </section>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="surface rounded-lg p-6"><h2 className="text-xl font-black">Descricao</h2><p className="mt-3 text-graphite">{product.description}</p></div>
          <div className="surface rounded-lg p-6"><h2 className="text-xl font-black">Especificacoes tecnicas</h2><dl className="mt-3 grid gap-2">{Object.entries(product.specifications ?? {}).map(([k, v]) => <div className="flex justify-between border-b border-ink/10 py-2" key={k}><dt>{k}</dt><dd className="font-bold">{String(v)}</dd></div>)}</dl></div>
        </section>
        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="surface rounded-lg p-5">
            <h2 className="text-xl font-black">Avaliacoes</h2>
            <div className="mt-3 grid gap-3">
              {reviews.data?.length ? reviews.data.map((review: { id: number; rating: number; comment: string }) => <div key={review.id} className="rounded-lg border border-ink/10 p-3"><RatingStars rating={review.rating} /><p className="mt-2 text-sm">{review.comment}</p></div>) : <p className="text-sm text-graphite">Ainda nao ha avaliacoes para este produto.</p>}
            </div>
          </div>
          <div className="surface rounded-lg p-5"><h2 className="text-xl font-black">Frete</h2><p className="mt-2 text-sm text-graphite">Calculo de frete mockado no frontend para apresentacao. Total final permanece no backend.</p></div>
        </section>
        <section className="mt-10"><h2 className="mb-4 text-xl font-black">Produtos relacionados</h2><ProductGrid products={((related.data ?? []) as any[]).filter((item: any) => item.id !== product.id)} /></section>
      </main>
      <Footer />
    </>
  );
}
