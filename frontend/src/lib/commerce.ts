import { formatMoney } from './api';

export const STATIC_SHIPPING = 29.9;
export const INSTALLMENT_TIMES = 12;

export function formatInstallment(value: string | number, times = INSTALLMENT_TIMES) {
  const numeric = Number(value || 0);
  const installment = numeric / times;
  return `ou ${times}x de ${formatMoney(installment)} sem juros`;
}

export function computeStaticTotal(subtotal: string | number, discount: string | number) {
  const result = Number(subtotal || 0) - Number(discount || 0) + STATIC_SHIPPING;
  return Math.max(result, 0);
}
