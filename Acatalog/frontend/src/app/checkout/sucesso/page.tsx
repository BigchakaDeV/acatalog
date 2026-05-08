import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';

export default function CheckoutSuccessPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-circuit" />
        <h1 className="text-3xl font-black">Pedido criado com sucesso</h1>
        <p className="mt-3 text-graphite">O pedido foi registrado com snapshot financeiro calculado pela API.</p>
        <Link href="/conta" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 font-bold text-white">Ver meus pedidos</Link>
      </main>
      <Footer />
    </>
  );
}
