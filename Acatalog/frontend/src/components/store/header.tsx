'use client';

import Link from 'next/link';
import { Heart, Menu, Search, ShoppingCart, UserRound } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    ['Catalogo', '/catalogo'],
    ['Promocoes', '/catalogo?promotion=true'],
    ['Gamer Pro', '/catalogo?category=gamer-pro'],
    ['Suporte', '/conta'],
  ];

  return (
    <header className="sticky top-3 z-40 mx-auto w-[calc(100%-24px)] max-w-7xl rounded-xl glass">
      <div className="flex min-h-16 items-center gap-3 px-4">
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
        <Link href="/" className="text-lg font-black tracking-normal text-ink dark:text-white">Acatalog <span className="text-circuit">Tech</span></Link>
        <nav className="hidden flex-1 items-center gap-5 pl-6 text-sm font-semibold text-graphite md:flex">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <form action="/catalogo" className="hidden min-w-64 items-center gap-2 rounded-lg border border-white/70 bg-white/70 px-3 py-2 md:flex">
          <Search className="h-4 w-4" />
          <input name="search" placeholder="Buscar hardware, marca ou SKU" className="w-full bg-transparent text-sm outline-none" />
        </form>
        <Link href="/wishlist" aria-label="Wishlist" className="rounded-lg p-2 hover:bg-white/70"><Heart className="h-5 w-5" /></Link>
        <Link href="/carrinho" aria-label="Carrinho" className="rounded-lg p-2 hover:bg-white/70"><ShoppingCart className="h-5 w-5" /></Link>
        <Link href="/login" aria-label="Conta" className="rounded-lg p-2 hover:bg-white/70"><UserRound className="h-5 w-5" /></Link>
      </div>
      {open ? (
        <div className="grid gap-2 border-t border-white/60 px-4 py-3 md:hidden">
          {nav.map(([label, href]) => <Link key={href} href={href} className="py-2 text-sm font-semibold">{label}</Link>)}
        </div>
      ) : null}
    </header>
  );
}
