'use client';

import Link from 'next/link';
import { Heart, Menu, Search, ShoppingCart, UserRound, Moon, Sun, Headphones, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const nav = [
    ['Catalogo', '/catalogo'],
    ['Promocoes', '/catalogo?promotion=true'],
    ['Estacoes', '/catalogo?search=workstation'],
    ['Componentes', '/catalogo?category=placas-de-video'],
    ['Perifericos', '/catalogo?category=perifericos-gamer'],
    ['Atendimento', '/conta'],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 shadow-[0_8px_26px_rgba(16,24,32,0.08)] backdrop-blur">
      <div className="border-b border-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-3 px-4 text-[11px] font-bold uppercase tracking-wide text-[var(--ui-text-muted)]">
          <span className="inline-flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-circuit" /> 3 opcoes de frete</span>
          <span className="hidden items-center gap-2 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5 text-circuit" /> Compra com garantia</span>
          <span className="hidden items-center gap-2 md:inline-flex"><Headphones className="h-3.5 w-3.5 text-circuit" /> Suporte tecnico</span>
        </div>
      </div>
      <div className="mx-auto flex min-h-18 max-w-7xl items-center gap-3 px-4 py-3">
        <button className="rounded-lg border border-[var(--ui-border)] p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
        <Link href="/" className="min-w-fit text-xl font-black tracking-tight text-[var(--ui-text)]">Acatalog <span className="text-circuit">Tech</span></Link>
        <form action="/catalogo" className="hidden flex-1 items-center gap-2 rounded-lg border border-[var(--ui-border-strong)] bg-[var(--ui-surface-muted)] px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-[var(--ui-text-muted)]" />
          <input name="search" placeholder="Digite produto, marca, SKU ou categoria" className="w-full bg-transparent text-sm font-semibold outline-none" />
          <button className="min-h-9 rounded-md bg-[var(--ui-primary)] px-4 text-xs font-black uppercase text-white">Buscar</button>
        </form>
        <div className="ml-auto flex items-center gap-1">
          <Link href="/wishlist" aria-label="Wishlist" className="rounded-lg border border-transparent p-2 text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)]"><Heart className="h-5 w-5" /></Link>
          <Link href="/carrinho" aria-label="Carrinho" className="rounded-lg border border-transparent p-2 text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)]"><ShoppingCart className="h-5 w-5" /></Link>
          <Link href="/conta" aria-label="Conta" className="rounded-lg border border-transparent p-2 text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)]"><UserRound className="h-5 w-5" /></Link>
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            onClick={toggleTheme}
            className="rounded-lg border border-transparent p-2 text-[var(--ui-text-muted)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-muted)]"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="border-t border-[var(--ui-border)] bg-[var(--ui-primary)]">
        <nav className="mx-auto hidden min-h-11 max-w-7xl items-center gap-1 px-4 text-sm font-black text-white md:flex">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-3 py-2 hover:bg-white/12">{label}</Link>)}
        </nav>
      </div>
      {open ? (
        <div className="grid gap-2 border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 md:hidden">
          <form action="/catalogo" className="flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--ui-text-muted)]" />
            <input name="search" placeholder="Buscar produto ou SKU" className="w-full bg-transparent text-sm outline-none" />
          </form>
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-2 py-2 text-sm font-semibold hover:bg-[var(--ui-surface-muted)]">{label}</Link>)}
        </div>
      ) : null}
    </header>
  );
}
