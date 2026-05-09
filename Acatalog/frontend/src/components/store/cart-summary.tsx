import { formatMoney } from '@/lib/api';
import type { Cart } from '@/lib/types';

export function CartSummary({ cart }: { cart?: Cart | null }) {
  if (!cart) {
    return (
      <div className="glass rounded-xl p-5">
        <h2 className="text-lg font-black">Resumo</h2>
        <div className="mt-4 animate-pulse space-y-3">
          <div className="h-4 w-full rounded bg-slate-300"></div>
          <div className="h-4 w-full rounded bg-slate-300"></div>
          <div className="h-4 w-full rounded bg-slate-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 transition-all duration-300">
      <h2 className="text-lg font-black">Resumo</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong>{formatMoney(cart.subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Desconto</span>
          <strong className={cart.discount && parseFloat(cart.discount) > 0 ? 'text-circuit' : ''}>
            -{formatMoney(cart.discount)}
          </strong>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <strong>{formatMoney(cart.shipping)}</strong>
        </div>
        <div className="border-t border-ink/10 pt-3">
          <div className="flex justify-between text-xl font-black">
            <span>Total</span>
            <span>{formatMoney(cart.total)}</span>
          </div>
          <p className="mt-2 text-xs text-graphite">Valores recalculados pela API Django.</p>
        </div>
      </div>
    </div>
  );
}
