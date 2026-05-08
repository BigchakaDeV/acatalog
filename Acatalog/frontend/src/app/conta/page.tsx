'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { OrderStatusBadge } from '@/components/admin/admin-layout';
import { AddressForm } from '@/components/store/forms';
import { authApi, formatMoney, storeApi } from '@/lib/api';
import { ErrorState, LoadingState } from '@/components/ui/states';
import type { Order, Address } from '@/lib/types';

export default function AccountPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: authApi.me });
  const orders = useQuery({ queryKey: ['orders'], queryFn: storeApi.orders });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: storeApi.addresses });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-black">Minha conta</h1>
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="glass h-fit rounded-xl p-4">
            {['Dados pessoais', 'Enderecos', 'Meus pedidos', 'Historico de compras', 'Wishlist', 'Logout'].map((item) => <button key={item} className="block min-h-11 w-full rounded-lg px-3 text-left font-semibold hover:bg-white/70">{item}</button>)}
          </aside>
          <section className="grid gap-5">
            {me.isLoading ? <LoadingState /> : me.isError ? <ErrorState title="Conta indisponivel" description="Faca login para carregar seus dados." /> : <div className="surface rounded-lg p-5"><h2 className="text-xl font-black">Dados pessoais</h2><p className="mt-2 text-sm text-graphite">{me.data.first_name || me.data.username} - {me.data.email}</p></div>}
            <div className="surface rounded-lg p-5"><AddressForm /><div className="mt-4 grid gap-2">{(addresses.data as Address[])?.map((address) => <p key={address.id} className="rounded-lg border border-ink/10 p-3">{address.street}, {address.number} - {address.city}/{address.state}</p>)}</div></div>
            <div className="surface rounded-lg p-5"><h2 className="text-xl font-black">Meus pedidos</h2><div className="mt-3 grid gap-3">{(orders.data as Order[])?.map((order) => <div key={order.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-3"><strong>#{order.id} - {formatMoney(order.total)}</strong><OrderStatusBadge status={order.status} /></div>)}</div></div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
