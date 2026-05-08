'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { apiErrorMessage, formatMoney, getMediaUrl, storeApi } from '@/lib/api';
import type { WishlistItem } from '@/lib/types';
import { useToast } from '@/components/ui/toast-provider';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const query = useQuery<WishlistItem[]>({ queryKey: ['wishlist'], queryFn: storeApi.wishlist });
  const remove = useMutation({ mutationFn: storeApi.removeWishlist, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }), onError: (error) => notify(apiErrorMessage(error)) });
  const move = useMutation({ mutationFn: (productId: number) => storeApi.addToCart(productId, 1), onSuccess: () => notify('Produto movido para carrinho'), onError: (error) => notify(apiErrorMessage(error)) });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-black">Wishlist</h1>
        {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState title="Wishlist indisponivel" description="Entre na conta para carregar produtos salvos." /> : !query.data?.length ? (
          <><EmptyState title="Nenhum produto salvo ainda" description="Use o coracao nos cards para montar sua lista de compra." /><Link href="/catalogo" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 font-bold text-white">Explorar produtos</Link></>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.map((item) => (
              <div key={item.id} className="surface grid gap-4 rounded-lg p-4 sm:grid-cols-[120px_1fr]">
                <div className="relative aspect-square rounded-lg bg-white">{item.product.primary_image?.image ? <Image src={getMediaUrl(item.product.primary_image.image)} alt={item.product.name} fill className="object-cover" /> : null}</div>
                <div><h2 className="font-black">{item.product.name}</h2><p className="mt-2 font-bold">{formatMoney(item.product.current_price)}</p><div className="mt-4 flex gap-2"><button onClick={() => move.mutate(item.product.id)} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">Mover ao carrinho</button><button onClick={() => remove.mutate(item.id)} className="min-h-11 rounded-lg border border-ink/10 px-4 font-bold">Remover</button></div></div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
