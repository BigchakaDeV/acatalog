'use client';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, formatMoney, storeApi } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useToast } from '@/components/ui/toast-provider';
import { formatInstallment } from '@/lib/commerce';
import { addToCart as addToCartHybrid } from '@/lib/cart-service';

export function RatingStars({ rating }: { rating: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
      <Star className="h-4 w-4 fill-amber-500" /> {Number(rating).toFixed(1)}
    </span>
  );
}

export function PriceBlock({ product }: { product: Product }) {
  const promo = product.promotional_price && product.promotional_price !== product.price;
  return (
    <div>
      {promo ? <p className="text-xs text-graphite line-through">{formatMoney(product.price)}</p> : null}
      <p className="text-xl font-black text-[var(--ui-text)]">{formatMoney(product.current_price)}</p>
      <p className="text-xs font-semibold text-circuit">{formatInstallment(product.current_price)}</p>
    </div>
  );
}

export function WishlistButton({ productId }: { productId: number }) {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: () => storeApi.addWishlist(productId),
    onSuccess: () => notify('Produto salvo na lista de interesse'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <button onClick={() => mutation.mutate()} className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-2 shadow-sm" aria-label={`Salvar produto ${productId}`}>
      <Heart className="h-4 w-4 text-[var(--ui-text-muted)]" />
    </button>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: () => addToCartHybrid(product, 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      notify('Produto adicionado ao carrinho');
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });

  return (
    <article className="group surface overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] transition hover:-translate-y-1 hover:shadow-focus">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.primary_image?.image ? (
            <img src={product.primary_image.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : null}
          {product.promotional_price ? <span className="absolute left-3 top-3 rounded-md bg-[#19c37d] px-2 py-1 text-xs font-black text-[#052537]">OFERTA</span> : null}
          {!product.in_stock ? <span className="absolute right-3 top-3 rounded-md bg-[#203848] px-2 py-1 text-xs font-bold text-white">SEM ESTOQUE</span> : null}
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-circuit">{product.brand?.name ?? 'Marca'}</p>
            <Link href={`/produto/${product.slug}`} className="line-clamp-2 min-h-11 font-bold text-[var(--ui-text)]">{product.name}</Link>
          </div>
          <WishlistButton productId={product.id} />
        </div>
        <RatingStars rating={product.average_rating} />
        <PriceBlock product={product} />
        <button onClick={() => mutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ui-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--ui-primary-strong)]">
          <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}
