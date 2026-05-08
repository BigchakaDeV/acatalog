import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <h2 className="font-black">Acatalog <span className="text-circuit">Tech</span></h2>
          <p className="mt-3 text-sm text-graphite">E-commerce headless para hardware, perifericos e componentes profissionais.</p>
        </div>
        {['Loja', 'Cliente', 'Operacao'].map((title) => (
          <div key={title}>
            <h3 className="font-semibold">{title}</h3>
            <div className="mt-3 grid gap-2 text-sm text-graphite">
              <Link href="/catalogo">Catalogo</Link>
              <Link href="/conta">Minha conta</Link>
              <Link href="/admin">Dashboard admin</Link>
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
