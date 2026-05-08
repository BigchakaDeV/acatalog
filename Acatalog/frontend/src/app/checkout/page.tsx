'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { AddressForm } from '@/components/store/forms';
import { CheckoutSteps } from '@/components/store/checkout-steps';
import { CartSummary } from '@/components/store/cart-summary';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { apiErrorMessage, storeApi } from '@/lib/api';
import type { Address } from '@/lib/types';
import { useToast } from '@/components/ui/toast-provider';

export default function CheckoutPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [addressId, setAddressId] = useState<number | null>(null);
  const cart = useQuery({ queryKey: ['cart'], queryFn: storeApi.cart });
  const addresses = useQuery<Address[]>({ queryKey: ['addresses'], queryFn: storeApi.addresses });
  const checkout = useMutation({
    mutationFn: () => storeApi.checkout({ address_id: addressId!, payment_method: 'mock_card' }),
    onSuccess: (order) => router.push(`/checkout/sucesso?pedido=${order.id}`),
    onError: (error) => notify(apiErrorMessage(error)),
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <CheckoutSteps step={1} />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="surface rounded-lg p-5">
            {addresses.isLoading ? <LoadingState label="Carregando enderecos" /> : addresses.isError ? <ErrorState title="Enderecos indisponiveis" description="Entre na conta para continuar." /> : (
              <div className="grid gap-4">
                <h2 className="text-xl font-black">Selecionar endereco</h2>
                {addresses.data?.map((address) => <label key={address.id} className="rounded-lg border border-ink/10 p-3"><input type="radio" name="address" className="mr-2" onChange={() => setAddressId(address.id)} />{address.recipient} - {address.street}, {address.number} - {address.city}/{address.state}</label>)}
                <AddressForm />
              </div>
            )}
          </section>
          <aside className="glass h-fit rounded-xl p-5">
            <h2 className="text-lg font-black">Pagamento</h2>
            <div className="mt-4 grid gap-2">
              {['Cartao mock', 'Stripe previsto', 'Mercado Pago previsto', 'Pix mock'].map((item, index) => <label key={item} className="rounded-lg border border-ink/10 bg-white p-3"><input name="payment" type="radio" className="mr-2" defaultChecked={index === 0} /> {item}</label>)}
            </div>
            <div className="my-4">{cart.data ? <CartSummary cart={cart.data} /> : cart.isLoading ? <LoadingState label="Carregando resumo" /> : <ErrorState title="Resumo indisponivel" description="Nao foi possivel carregar o carrinho." />}</div>
            <button disabled={!addressId || checkout.isPending} onClick={() => checkout.mutate()} className="mt-4 min-h-12 w-full rounded-lg bg-circuit px-4 font-black text-white disabled:opacity-50">{checkout.isPending ? 'Criando pedido...' : 'Criar pedido'}</button>
            <p className="mt-3 text-xs text-graphite">A confirmacao cria pedido pela API com snapshot dos itens e status de pagamento.</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
