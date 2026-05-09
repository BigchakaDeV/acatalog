'use client';

import Link from 'next/link';
import { Heart, Menu, Search, ShoppingCart, UserRound, BellDot, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const nav = [
    ['Catálogo', '/catalogo'],
    ['Promoções', '/catalogo?promotion=true'],
    ['Estações', '/catalogo?search=workstation'],
    ['Atendimento', '/conta'],
  ];

  return (
    <header className="sticky top-3 z-40 mx-auto w-[calc(100%-24px)] max-w-7xl rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]/90 shadow-[0_10px_35px_rgba(16,24,32,0.09)] backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4">
        <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
        <Link href="/" className="text-lg font-black tracking-tight text-[var(--ui-text)]">Acatalog <span className="text-circuit">Tech</span></Link>
        <nav className="hidden flex-1 items-center gap-5 pl-6 text-sm font-bold text-[var(--ui-text-muted)] md:flex">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-2 py-1 hover:bg-[var(--ui-surface-muted)]">{label}</Link>)}
        </nav>
        <form action="/catalogo" className="hidden min-w-72 items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-[var(--ui-text-muted)]" />
          <input name="search" placeholder="Buscar hardware, marca ou SKU" className="w-full bg-transparent text-sm outline-none" />
        </form>
        <Link href="/wishlist" aria-label="Wishlist" className="rounded-lg p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]"><Heart className="h-5 w-5" /></Link>
        <Link href="/carrinho" aria-label="Carrinho" className="rounded-lg p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]"><ShoppingCart className="h-5 w-5" /></Link>
        <Link href="/conta" aria-label="Conta" className="rounded-lg p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]"><UserRound className="h-5 w-5" /></Link>
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)]"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button type="button" aria-label="Notificações" className="hidden rounded-lg p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] lg:inline-flex"><BellDot className="h-5 w-5" /></button>
      </div>
      {open ? (
        <div className="grid gap-2 border-t border-[var(--ui-border)] px-4 py-3 md:hidden">
          {nav.map(([label, href]) => <Link key={href} href={href} className="rounded-md px-2 py-2 text-sm font-semibold hover:bg-[var(--ui-surface-muted)]">{label}</Link>)}
        </div>
      ) : null}
    </header>
  );
}
