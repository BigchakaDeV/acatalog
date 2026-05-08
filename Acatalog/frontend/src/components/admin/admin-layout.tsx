import Link from 'next/link';
import { BarChart3, Boxes, Gift, LayoutDashboard, Receipt, Tags, Users } from 'lucide-react';

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
  return (
    <aside className="glass fixed inset-y-3 left-3 hidden w-64 rounded-xl p-4 lg:block">
      <h1 className="mb-6 text-xl font-black">Acatalog Admin</h1>
      <nav className="grid gap-2">
        {items.map(([label, href, Icon]) => (
          <Link key={href as string} href={href as string} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold hover:bg-white/70">
            <Icon className="h-4 w-4" /> {label as string}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AdminTopbar() {
  return (
    <div className="glass mb-5 flex min-h-16 items-center justify-between rounded-xl px-4">
      <div>
        <p className="text-xs font-bold uppercase text-circuit">Dashboard headless</p>
        <h2 className="font-black">Operacao Acatalog Tech</h2>
      </div>
      <Link href="/admin/login" className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Login admin</Link>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <div className="surface rounded-lg p-5">
      <p className="text-sm font-semibold text-graphite">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className="rounded-md bg-circuit/10 px-2 py-1 text-xs font-black text-circuit">{status}</span>;
}
