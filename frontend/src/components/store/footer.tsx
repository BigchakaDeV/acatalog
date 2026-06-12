import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <h2 className="font-black text-[var(--ui-text)]">Acatalog <span className="text-circuit">Tech</span></h2>
          <p className="mt-3 text-sm text-graphite">E-commerce especializado em hardware de alta performance para público técnico, corporativo e entusiasta.</p>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--ui-text)]">Loja</h3>
          <div className="mt-3 grid gap-2 text-sm text-graphite">
            <Link href="/catalogo">Catálogo completo</Link>
            <Link href="/catalogo?promotion=true">Ofertas da semana</Link>
            <Link href="/wishlist">Lista de interesse</Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--ui-text)]">Cliente</h3>
          <div className="mt-3 grid gap-2 text-sm text-graphite">
            <Link href="/conta">Minha conta</Link>
            <Link href="/checkout">Finalizar compra</Link>
            <Link href="/conta">Suporte e atendimento</Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-[var(--ui-text)]">Operação</h3>
          <div className="mt-3 grid gap-2 text-sm text-graphite">
            <Link href="/admin">Painel administrativo</Link>
            <Link href="/admin/produtos">Gestão de catálogo</Link>
            <Link href="/admin/pedidos">Gestão de pedidos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
