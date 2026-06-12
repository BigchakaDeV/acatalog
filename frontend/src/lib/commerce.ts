import { formatMoney } from './api';

export type ShippingMethod = 'economy' | 'standard' | 'express';

export type ShippingOption = {
  id: ShippingMethod;
  name: string;
  carrier: string;
  deadline: string;
  description: string;
  price: number;
};

export const SHIPPING_STORAGE_KEY = 'acatalog_shipping_method_v1';
export const INSTALLMENT_TIMES = 12;

export function formatInstallment(value: string | number, times = INSTALLMENT_TIMES) {
  const numeric = Number(value || 0);
  const installment = numeric / times;
  return `ou ${times}x de ${formatMoney(installment)} sem juros`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function postalCodeNoise(postalCode?: string) {
  const digits = (postalCode ?? '').replace(/\D/g, '');
  if (digits.length < 5) return 0;
  return digits.split('').reduce((sum, digit, index) => sum + Number(digit) * (index + 1), 0) % 9;
}

export function getShippingOptions(subtotal: string | number, discount: string | number = 0, postalCode?: string): ShippingOption[] {
  const base = Math.max(Number(subtotal || 0) - Number(discount || 0), 0);
  const valueScore = Math.min(30, base / 350);
  const insuranceFactor = Math.min(10, base * 0.0015);
  const routeNoise = (Math.round(base / 10) + postalCodeNoise(postalCode)) % 11;
  const economy = roundMoney(clamp(15 + valueScore * 0.32 + insuranceFactor * 0.3 + routeNoise * 0.45, 15, 60));
  const standard = roundMoney(clamp(economy + 7 + valueScore * 0.25 + routeNoise * 0.35, 15, 60));
  const express = roundMoney(clamp(standard + 9 + valueScore * 0.3 + insuranceFactor * 0.55 + routeNoise * 0.25, 15, 60));

  return [
    {
      id: 'economy',
      name: 'Rodoviario economico',
      carrier: 'Jadlog Package',
      deadline: '6 a 9 dias uteis',
      description: 'Transporte rodoviario, menor custo e rastreio nacional.',
      price: economy,
    },
    {
      id: 'standard',
      name: 'Aereo intermediario',
      carrier: 'GOLLOG Standard',
      deadline: '3 a 5 dias uteis',
      description: 'Malha aerea com prazo equilibrado para capitais e regioes centrais.',
      price: standard,
    },
    {
      id: 'express',
      name: 'Aereo expresso',
      carrier: 'Azul Cargo Express',
      deadline: '1 a 2 dias uteis',
      description: 'Prioridade de separacao e envio aereo para pedidos urgentes.',
      price: express,
    },
  ];
}

export function getDefaultShippingOption(subtotal: string | number, discount: string | number = 0) {
  return getShippingOptions(subtotal, discount)[1];
}

export function readSelectedShippingMethod(): ShippingMethod {
  if (typeof window === 'undefined') return 'standard';
  const stored = localStorage.getItem(SHIPPING_STORAGE_KEY);
  return stored === 'economy' || stored === 'standard' || stored === 'express' ? stored : 'standard';
}

export function saveSelectedShippingMethod(method: ShippingMethod) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHIPPING_STORAGE_KEY, method);
}

export function getSelectedShippingOption(subtotal: string | number, discount: string | number = 0, method?: ShippingMethod) {
  const selected = method ?? readSelectedShippingMethod();
  return getShippingOptions(subtotal, discount).find((option) => option.id === selected) ?? getDefaultShippingOption(subtotal, discount);
}

export function computeTotalWithShipping(subtotal: string | number, discount: string | number, shipping: string | number) {
  const result = Number(subtotal || 0) - Number(discount || 0) + Number(shipping || 0);
  return Math.max(result, 0);
}
