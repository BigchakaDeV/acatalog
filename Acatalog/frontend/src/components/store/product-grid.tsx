import type { Product } from '@/lib/types';
import { EmptyState } from '@/components/ui/states';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return <EmptyState title="Nenhum produto encontrado" description="Ajuste filtros, busca ou faixa de preco para ver mais opcoes." />;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
