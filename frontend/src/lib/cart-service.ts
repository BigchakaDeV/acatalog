import { computeTotalWithShipping, getSelectedShippingOption } from './commerce';
import { storeApi, tokenStore } from './api';
import type { CartLike, GuestCart, GuestCartItem, Product } from './types';

const GUEST_CART_KEY = 'acatalog_guest_cart_v1';

type GuestEntry = {
  product: Product;
  quantity: number;
};

function toMoneyString(value: number) {
  return value.toFixed(2);
}

function readGuestEntries(): GuestEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]') as GuestEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.product?.id && item.quantity > 0);
  } catch {
    return [];
  }
}

function writeGuestEntries(entries: GuestEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
}

function clearGuestEntries() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
}

function computeGuestCart(entries: GuestEntry[]): GuestCart {
  const items: GuestCartItem[] = entries.map((entry) => {
    const unit = Number(entry.product.current_price || entry.product.price || 0);
    const subtotal = unit * entry.quantity;
    return {
      id: `guest-${entry.product.id}`,
      product_id: entry.product.id,
      product: entry.product,
      quantity: entry.quantity,
      unit_price: toMoneyString(unit),
      subtotal: toMoneyString(subtotal),
    };
  });
  const subtotalValue = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const discountValue = 0;
  const shipping = getSelectedShippingOption(subtotalValue, discountValue).price;
  return {
    id: 'guest',
    items,
    subtotal: toMoneyString(subtotalValue),
    discount: toMoneyString(discountValue),
    shipping: toMoneyString(shipping),
    total: toMoneyString(computeTotalWithShipping(subtotalValue, discountValue, shipping)),
    is_guest: true,
  };
}

function withSelectedShipping<T extends { subtotal: string; discount: string; shipping: string; total: string }>(cart: T): T {
  const shipping = getSelectedShippingOption(cart.subtotal, cart.discount).price;
  return {
    ...cart,
    shipping: toMoneyString(shipping),
    total: toMoneyString(computeTotalWithShipping(cart.subtotal, cart.discount, shipping)),
  };
}

export function isAuthenticated() {
  return Boolean(tokenStore.get());
}

export async function getCart(): Promise<CartLike> {
  if (isAuthenticated()) {
    const apiCart = await storeApi.cart();
    return withSelectedShipping(apiCart);
  }
  return computeGuestCart(readGuestEntries());
}

export async function addToCart(product: Product, quantity = 1): Promise<CartLike> {
  if (isAuthenticated()) {
    const cart = await storeApi.addToCart(product.id, quantity);
    return withSelectedShipping(cart);
  }
  const entries = readGuestEntries();
  const existing = entries.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    entries.push({ product, quantity });
  }
  writeGuestEntries(entries);
  return computeGuestCart(entries);
}

export async function updateCartItem(itemId: string | number, quantity: number): Promise<CartLike> {
  if (isAuthenticated()) {
    const cart = await storeApi.updateCartItem(Number(itemId), quantity);
    return withSelectedShipping(cart);
  }
  const entries = readGuestEntries();
  const match = entries.find((entry) => `guest-${entry.product.id}` === String(itemId));
  if (match) match.quantity = Math.max(quantity, 1);
  writeGuestEntries(entries);
  return computeGuestCart(entries);
}

export async function removeCartItem(itemId: string | number): Promise<CartLike> {
  if (isAuthenticated()) {
    const cart = await storeApi.removeCartItem(Number(itemId));
    return withSelectedShipping(cart);
  }
  const entries = readGuestEntries().filter((entry) => `guest-${entry.product.id}` !== String(itemId));
  writeGuestEntries(entries);
  return computeGuestCart(entries);
}

export async function syncGuestCartToApi() {
  if (!isAuthenticated()) return;
  const entries = readGuestEntries();
  if (!entries.length) return;
  for (const entry of entries) {
    await storeApi.addToCart(entry.product.id, entry.quantity);
  }
  clearGuestEntries();
}
