'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { CartSummary } from '@/components/store/cart-summary';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { apiErrorMessage, formatMoney, getMediaUrl, storeApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';
import type { Cart, CartItem } from '@/lib/types';

export default function CartPage() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const { data: cart, isError, isLoading } = useQuery({ queryKey: ['cart'], queryFn: storeApi.cart });
  const onError = (error: unknown) => notify(apiErrorMessage(error));
  const update = useMutation({ mutationFn: ({ id, quantity }: { id: number; quantity: number }) => storeApi.updateCartItem(id, quantity), onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }), onError });
  const remove = useMutation({ mutationFn: storeApi.removeCartItem, onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }), onError });
  const coupon = useMutation({ mutationFn: storeApi.applyCoupon, onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }), onError });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-black">Carrinho</h1>
        {isLoading ? <LoadingState /> : isError ? <ErrorState title="Carrinho indisponivel" description="Entre na sua conta ou verifique se a API esta online." /> : !(cart as Cart)?.items.length ? <EmptyState title="Seu carrinho esta vazio" description="Adicione produtos do catalogo para iniciar o checkout." /> : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-3">
              {(cart as Cart).items.map((item: CartItem) => (
                <div key={item.id} className="surface grid gap-4 rounded-lg p-4 md:grid-cols-[120px_1fr_auto]">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                    {item.product.primary_image?.image ? <Image src={getMediaUrl(item.product.primary_image.image)} alt={item.product.name} fill className="object-cover" /> : null}
                  </div>
                  <div><h2 className="font-black">{item.product.name}</h2><p className="text-sm text-graphite">{formatMoney(item.unit_price)}</p><p className="mt-2 font-bold">Subtotal {formatMoney(item.subtotal)}</p></div>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} defaultValue={item.quantity} onBlur={(e) => update.mutate({ id: item.id, quantity: Number(e.target.value) })} className="h-11 w-20 rounded-lg border border-ink/10 px-2" />
                    <button onClick={() => remove.mutate(item.id)} className="h-11 rounded-lg border border-ink/10 px-3 font-bold">Remover</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid h-fit gap-3">
              <form onSubmit={(e) => { e.preventDefault(); coupon.mutate(new FormData(e.currentTarget).get('code') as string); }} className="glass rounded-xl p-4">
                <input name="code" placeholder="Cupom" className="mb-2 min-h-11 w-full rounded-lg border border-ink/10 px-3" />
                <button className="min-h-11 w-full rounded-lg bg-ink font-bold text-white">Aplicar cupom</button>
              </form>
              <CartSummary cart={cart} />
              <Link href="/checkout" className="min-h-12 rounded-lg bg-circuit px-4 py-3 text-center font-black text-white">Ir para checkout</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
