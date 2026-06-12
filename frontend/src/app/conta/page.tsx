'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { OrderStatusBadge } from '@/components/admin/admin-layout';
import { AddressForm } from '@/components/store/forms';
import { authApi, formatMoney, storeApi, tokenStore } from '@/lib/api';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast-provider';

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const isAuthenticated = Boolean(tokenStore.get());

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?next=/conta');
    }
  }, [isAuthenticated, router]);

  const me = useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: isAuthenticated });
  const orders = useQuery({ queryKey: ['orders'], queryFn: storeApi.orders, enabled: isAuthenticated });
  const addresses = useQuery<Array<{ id: number; street: string; number: string; city: string; state: string; recipient: string }>>({
    queryKey: ['addresses'],
    queryFn: storeApi.addresses,
    enabled: isAuthenticated,
  });
  const removeAddress = useMutation({
    mutationFn: (id: number) => storeApi.deleteAddress(id),
    onSuccess: () => {
      notify('Endereco removido');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: () => notify('Nao foi possivel remover o endereco.'),
  });
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <LoadingState label="Redirecionando para login..." />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-black">Minha conta</h1>
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="glass h-fit rounded-xl p-4">
            <a href="#dados-pessoais" className="block min-h-11 rounded-lg px-3 py-2 text-left font-semibold hover:bg-white/70">Dados pessoais</a>
            <a href="#enderecos" className="block min-h-11 rounded-lg px-3 py-2 text-left font-semibold hover:bg-white/70">Enderecos</a>
            <a href="#meus-pedidos" className="block min-h-11 rounded-lg px-3 py-2 text-left font-semibold hover:bg-white/70">Meus pedidos</a>
            <a href="#meus-pedidos" className="block min-h-11 rounded-lg px-3 py-2 text-left font-semibold hover:bg-white/70">Historico de compras</a>
            <Link href="/wishlist" className="block min-h-11 rounded-lg px-3 py-2 text-left font-semibold hover:bg-white/70">Wishlist</Link>
            <button onClick={() => logout.mutate()} className="block min-h-11 w-full rounded-lg px-3 text-left font-semibold text-red-700 hover:bg-red-50">Logout</button>
          </aside>
          <section className="grid gap-5">
            {me.isLoading ? <LoadingState /> : (
              <div id="dados-pessoais" className="surface rounded-lg p-5">
                <h2 className="text-xl font-black">Dados pessoais</h2>
                <p className="mt-2 text-sm text-graphite">Nome: {me.data?.first_name || 'Nao informado'} {me.data?.last_name || ''}</p>
                <p className="mt-1 text-sm text-graphite">Usuario: {me.data?.username || 'Nao informado'}</p>
                <p className="mt-1 text-sm text-graphite">E-mail: {me.data?.email || 'Nao informado'}</p>
                <p className="mt-1 text-sm text-graphite">Telefone: {me.data?.phone || 'Nao informado'}</p>
              </div>
            )}

            <div id="enderecos" className="surface rounded-lg p-5">
              <AddressForm />
              <div className="mt-4 grid gap-2">
                {addresses.isLoading ? <LoadingState label="Carregando enderecos..." /> : null}
                {!addresses.isLoading && !addresses.data?.length ? <EmptyState title="Nenhum endereco cadastrado" description="Adicione um endereco para usar no checkout." /> : null}
                {addresses.data?.map((address) => (
                  <div key={address.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 p-3">
                    <p>{address.recipient} - {address.street}, {address.number} - {address.city}/{address.state}</p>
                    <button onClick={() => removeAddress.mutate(address.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div id="meus-pedidos" className="surface rounded-lg p-5">
              <h2 className="text-xl font-black">Meus pedidos</h2>
              <div className="mt-3 grid gap-3">
                {orders.isLoading ? <LoadingState label="Carregando pedidos..." /> : null}
                {!orders.isLoading && !orders.data?.length ? <EmptyState title="Nenhum pedido ainda" description="Quando voce finalizar compras, seus pedidos aparecerao aqui." /> : null}
                {orders.data?.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border border-ink/10 p-3">
                    <div>
                      <strong>#{order.id} - {formatMoney(order.total)}</strong>
                      <p className="text-xs text-graphite">Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
