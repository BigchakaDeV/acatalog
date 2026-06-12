'use client';

import { useMemo, useState } from 'react';
import { Truck } from 'lucide-react';
import { formatMoney } from '@/lib/api';
import { computeTotalWithShipping, formatInstallment, getSelectedShippingOption, getShippingOptions, saveSelectedShippingMethod, type ShippingMethod } from '@/lib/commerce';
import type { CartLike } from '@/lib/types';

export function CartSummary({ cart }: { cart: CartLike }) {
  const initial = getSelectedShippingOption(cart.subtotal, cart.discount);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod>(initial.id);
  const shippingOptions = useMemo(() => getShippingOptions(cart.subtotal, cart.discount), [cart.subtotal, cart.discount]);
  const shipping = shippingOptions.find((option) => option.id === selectedMethod) ?? shippingOptions[1];
  const total = computeTotalWithShipping(cart.subtotal, cart.discount, shipping.price);

  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[0_8px_24px_rgba(16,24,32,0.07)]">
      <h2 className="text-lg font-black">Resumo</h2>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><strong>{formatMoney(cart.subtotal)}</strong></div>
        <div className="flex justify-between"><span>Desconto</span><strong className="text-circuit">-{formatMoney(cart.discount)}</strong></div>

        <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
          <div className="mb-3 flex items-center gap-2 font-black"><Truck className="h-4 w-4 text-circuit" /> Escolha o frete</div>
          <div className="grid gap-2">
            {shippingOptions.map((option) => (
              <label key={option.id} className={`grid cursor-pointer gap-1 rounded-md border p-3 transition ${selectedMethod === option.id ? 'border-circuit bg-circuit/8' : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-black">
                    <input
                      type="radio"
                      name="shipping_method"
                      value={option.id}
                      checked={selectedMethod === option.id}
                      onChange={() => {
                        setSelectedMethod(option.id);
                        saveSelectedShippingMethod(option.id);
                      }}
                    />
                    {option.name}
                  </span>
                  <strong>{formatMoney(option.price)}</strong>
                </span>
                <span className="text-xs font-bold text-[var(--ui-text-muted)]">{option.carrier} - {option.deadline}</span>
                <span className="text-xs text-[var(--ui-text-muted)]">{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between"><span>Frete selecionado</span><strong>{formatMoney(shipping.price)}</strong></div>
        <div className="border-t border-ink/10 pt-3">
          <div className="flex justify-between text-xl font-black"><span>Total</span><span>{formatMoney(total)}</span></div>
          <p className="mt-2 text-xs font-semibold text-circuit">{formatInstallment(total)}</p>
          <p className="mt-1 text-xs text-graphite">{shipping.carrier}: {shipping.deadline}.</p>
        </div>
      </div>
    </div>
  );
}
