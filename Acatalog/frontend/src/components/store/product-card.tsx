'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage, formatMoney, getMediaUrl, storeApi } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useToast } from '@/components/ui/toast-provider';

export function RatingStars({ rating }: { rating: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
      <Star className="h-4 w-4 fill-amber-400" /> {Number(rating).toFixed(1)}
    </span>
  );
}

export function PriceBlock({ product }: { product: Product }) {
  const promo = product.promotional_price && product.promotional_price !== product.price;
  return (
    <div>
      {promo ? <p className="text-xs text-graphite line-through">{formatMoney(product.price)}</p> : null}
      <p className="text-xl font-black text-ink dark:text-white">{formatMoney(product.current_price)}</p>
      <p className="text-xs font-semibold text-circuit">Resumo financeiro final vem da API no carrinho</p>
    </div>
  );
}

export function WishlistButton({ productId }: { productId: number }) {
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: () => storeApi.addWishlist(productId),
    onSuccess: () => notify('Produto salvo na wishlist'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <button onClick={() => mutation.mutate()} className="rounded-lg bg-white/85 p-2 shadow-sm" aria-label={`Salvar produto ${productId}`}>
      <Heart className="h-4 w-4" />
    </button>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Usuário não autenticado. Faça login para adicionar produtos ao carrinho.');
      }
      return storeApi.addToCart(product.id, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      notify('Produto adicionado ao carrinho');
    },
    onError: (error) => {
      const message = apiErrorMessage(error);
      if (message.includes('não autenticado') || message.includes('credenciais')) {
        // Redirecionar para login se não autenticado
        window.location.href = '/login';
      } else {
        notify(message);
      }
    },
  });

  return (
    <article className="group surface overflow-hidden rounded-lg transition hover:-translate-y-1 hover:shadow-focus">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.primary_image?.image ? (
            <Image 
              src={getMediaUrl(product.primary_image.image)} 
              alt={product.name} 
              fill 
              className="object-cover transition duration-500 group-hover:scale-105"
              onError={(e) => {
                // Fallback em caso de erro ao carregar imagem
                const img = e.currentTarget as HTMLImageElement;
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="16"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
              Sem imagem
            </div>
          )}
          {product.promotional_price ? <span className="absolute left-3 top-3 rounded-md bg-limepulse px-2 py-1 text-xs font-black text-ink">PROMO</span> : null}
          {!product.in_stock ? <span className="absolute right-3 top-3 rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">ESGOTADO</span> : null}
        </div>
      </Link>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-circuit">{product.brand.name}</p>
            <Link href={`/produto/${product.slug}`} className="line-clamp-2 min-h-11 font-bold">{product.name}</Link>
          </div>
          <WishlistButton productId={product.id} />
        </div>
        <RatingStars rating={product.average_rating} />
        <PriceBlock product={product} />
        <button onClick={() => mutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white hover:bg-circuit">
          <ShoppingCart className="h-4 w-4" /> Adicionar
        </button>
      </div>
    </article>
  );
}
