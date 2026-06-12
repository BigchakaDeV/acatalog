'use client';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Zap, PackageCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiErrorMessage, formatMoney, storeApi } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useToast } from '@/components/ui/toast-provider';
import { formatInstallment } from '@/lib/commerce';
import { addToCart as addToCartHybrid } from '@/lib/cart-service';

export function RatingStars({ rating }: { rating: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
      <Star className="h-3.5 w-3.5 fill-amber-500" /> {Number(rating).toFixed(1)}
    </span>
  );
}

export function PriceBlock({ product }: { product: Product }) {
  const promo = product.promotional_price && product.promotional_price !== product.price;
  const discount = promo
    ? Math.max(0, Math.round(((Number(product.price) - Number(product.current_price)) / Number(product.price)) * 100))
    : 0;
  return (
    <div className="grid gap-1">
      <div className="flex min-h-5 items-center gap-2">
        {promo ? <p className="text-xs font-bold text-[var(--ui-text-muted)] line-through">{formatMoney(product.price)}</p> : null}
        {discount > 0 ? <span className="rounded bg-[#ffd166] px-1.5 py-0.5 text-[10px] font-black text-[#3a2a00]">-{discount}%</span> : null}
      </div>
      <p className="text-2xl font-black leading-none text-[var(--ui-text)]">{formatMoney(product.current_price)}</p>
      <p className="inline-flex items-center gap-1 text-xs font-black text-circuit"><Zap className="h-3.5 w-3.5" /> {formatInstallment(product.current_price)}</p>
    </div>
  );
}

export function WishlistButton({ productId }: { productId: number }) {
  const { notify } = useToast();
  const [liked, setLiked] = useState(false);
  const mutation = useMutation({
    mutationFn: () => storeApi.addWishlist(productId),
    onSuccess: () => {
      setLiked(true);
      notify('Produto salvo na lista de interesse');
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <button onClick={() => mutation.mutate()} className={`inline-grid h-9 w-9 place-items-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-sm transition hover:border-circuit hover:text-circuit ${liked ? 'wishlist-pop border-circuit text-circuit' : ''}`} aria-label={`Salvar produto ${productId}`}>
      <Heart className={`h-4 w-4 transition ${liked ? 'fill-current' : ''}`} />
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
    <article className="group grid min-h-full overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[0_8px_24px_rgba(16,24,32,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[0_16px_38px_rgba(16,24,32,0.14)]">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[1.08] overflow-hidden border-b border-[var(--ui-border)] bg-white p-4">
          {product.primary_image?.image ? (
            <img src={product.primary_image.image} alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center rounded-md bg-[var(--ui-surface-muted)] text-xs font-black uppercase tracking-wide text-[var(--ui-text-muted)]">Sem imagem</div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.promotional_price ? <span className="rounded-md bg-[#19c37d] px-2 py-1 text-[10px] font-black uppercase text-[#052537]">Oferta</span> : null}
            {product.is_new ? <span className="rounded-md bg-[#ffd166] px-2 py-1 text-[10px] font-black uppercase text-[#3a2a00]">Novo</span> : null}
          </div>
          {!product.in_stock ? <span className="absolute right-3 top-3 rounded-md bg-[#203848] px-2 py-1 text-[10px] font-black uppercase text-white">Sem estoque</span> : null}
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-circuit">{product.brand?.name ?? 'Marca'}</p>
            <Link href={`/produto/${product.slug}`} className="line-clamp-2 mt-1 min-h-11 text-sm font-black leading-snug text-[var(--ui-text)] hover:text-circuit">{product.name}</Link>
            <p className="mt-1 text-[11px] font-bold uppercase text-[var(--ui-text-muted)]">SKU {product.sku}</p>
          </div>
          <WishlistButton productId={product.id} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <RatingStars rating={product.average_rating} />
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-black ${product.in_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <PackageCheck className="h-3.5 w-3.5" /> {product.in_stock ? 'Disponivel' : 'Indisponivel'}
          </span>
        </div>
        <PriceBlock product={product} />
        <button disabled={!product.in_stock || mutation.isPending} onClick={() => mutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--ui-primary)] px-4 text-sm font-black uppercase text-white transition hover:bg-[var(--ui-primary-strong)] disabled:opacity-50">
          <ShoppingCart className="h-4 w-4" /> Comprar
        </button>
      </div>
    </article>
  );
}
