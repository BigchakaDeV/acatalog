'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Boxes, Gift, LayoutDashboard, Moon, Receipt, Sun, Tags, Users } from 'lucide-react';
import { tokenStore } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';

const items = [
  ['Visao geral', '/admin', LayoutDashboard],
  ['Produtos', '/admin/produtos', Boxes],
  ['Promocoes', '/admin/promocoes', Gift],
  ['Categorias e marcas', '/admin/categorias', Tags],
  ['Cupons', '/admin/cupons', Receipt],
  ['Pedidos', '/admin/pedidos', BarChart3],
  ['Clientes', '/admin/clientes', Users],
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-3 left-3 hidden w-64 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-[var(--ui-text)] shadow-glass lg:block">
      <h1 className="mb-1 text-xl font-black">Acatalog Admin</h1>
      <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">Gerenciamento da loja</p>
      <nav className="grid gap-2">
        {items.map(([label, href, Icon]) => (
          <Link
            key={href as string}
            href={href as string}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${
              pathname === href ? 'bg-circuit text-white' : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]'
            }`}
          >
            <Icon className="h-4 w-4" /> {label as string}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AdminTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const logout = () => {
    tokenStore.clear();
    router.push('/admin/login');
  };

  return (
    <div className="mb-5 flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 shadow-glass">
      <div>
        <p className="text-xs font-bold uppercase text-circuit">Dashboard headless</p>
        <h2 className="font-black">Operação Acatalog Tech</h2>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 text-[var(--ui-text)]"
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <Link href="/" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[var(--ui-border)] px-4 py-2 text-sm font-bold text-[var(--ui-text)] sm:flex-none">Ver loja</Link>
        <button type="button" onClick={logout} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white sm:flex-none">Sair</button>
      </div>
      <nav className="grid w-full grid-cols-2 gap-2 lg:hidden">
        {items.map(([label, href]) => (
          <Link
            key={`mobile-${href as string}`}
            href={href as string}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-xs font-bold ${
              pathname === href
                ? 'border-circuit bg-circuit text-white'
                : 'border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text)]'
            }`}
          >
            {label as string}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(Boolean(tokenStore.get()));
  }, []);

  if (hasToken === null) {
    return (
      <main className="min-h-screen bg-frost p-3 lg:pl-72">
        <AdminSidebar />
        <div className="mb-5 min-h-16 rounded-xl border border-ink/10 bg-white px-4 shadow-glass" />
        <section className="surface mx-auto max-w-3xl rounded-xl p-8 text-center shadow-glass">
          <p className="text-sm font-bold text-graphite">Verificando sessao administrativa...</p>
        </section>
      </main>
    );
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-frost p-3 lg:pl-72">
        <AdminSidebar />
        <section className="surface mx-auto mt-20 max-w-3xl rounded-xl p-8 text-center shadow-glass">
          <p className="text-sm font-black uppercase tracking-wide text-circuit">Acesso administrativo</p>
          <h1 className="mt-2 text-3xl font-black">Entre para gerenciar a loja</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-graphite">
            O painel usa endpoints administrativos reais. Faca login para carregar produtos, clientes, pedidos e metricas.
          </p>
          <Link href="/admin/login" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 font-black text-white">
            Fazer login admin
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-frost p-3 lg:pl-72">
      <AdminSidebar />
      <AdminTopbar />
      {children}
    </main>
  );
}

export function AdminMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-xl p-5 shadow-glass">
      <p className="text-sm font-semibold text-graphite">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className="rounded-md bg-circuit/10 px-2 py-1 text-xs font-black text-circuit">{status}</span>;
}
