import { PackageSearch } from 'lucide-react';

export function LoadingState({ label = 'Carregando' }: { label?: string }) {
  return <div className="surface rounded-lg p-8 text-center text-sm text-graphite">{label}...</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="surface rounded-lg p-10 text-center">
      <PackageSearch className="mx-auto mb-3 h-10 w-10 text-circuit" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-graphite">{description}</p>
    </div>
  );
}

export function ErrorState({ title = 'Nao foi possivel carregar', description = 'Tente novamente em instantes.' }) {
  return <EmptyState title={title} description={description} />;
}
