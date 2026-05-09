import axios, { AxiosError } from 'axios';
import type { Brand, Cart, Category, Order, Product } from './types';

type AuthResponse = {
  access: string;
  user: { id: number; email: string; username: string; role: string; first_name?: string; last_name?: string };
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api',
  withCredentials: true,
});

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem('acatalog_access')),
  set: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('acatalog_access', token);
  },
  clear: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('acatalog_access');
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean });
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        const response = await api.post<{ access: string }>('/auth/refresh/');
        tokenStore.set(response.data.access);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${response.data.access}`;
        return api(original);
      } catch {
        tokenStore.clear();
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.non_field_errors) && typeof data.non_field_errors[0] === 'string') return data.non_field_errors[0];
    const firstFieldError = Object.values(data ?? {}).find((value) => Array.isArray(value) && typeof value[0] === 'string');
    if (Array.isArray(firstFieldError)) return firstFieldError[0];
    if (typeof data === 'string') return data;
    if (!error.response) return 'API indisponivel. Verifique se o backend esta online.';
    return 'Nao foi possivel concluir a operacao.';
  }
  return 'Nao foi possivel concluir a operacao.';
}

const saveAuth = (response: AuthResponse) => {
  tokenStore.set(response.access);
  return response;
};

export const storeApi = {
  home: () => api.get<{ featured: Product[]; promotions: Product[]; new: Product[]; best_sellers: Product[] }>('/products/home/').then((r) => r.data),
  products: (params?: Record<string, string>) => api.get<Product[]>('/products/', { params }).then((r) => r.data),
  product: (slug: string) => api.get<Product>(`/products/${slug}/`).then((r) => r.data),
  reviews: (productId: number) => api.get('/reviews/', { params: { product: productId } }).then((r) => r.data),
  createReview: (payload: { product: number; rating: number; comment: string }) => api.post('/reviews/', payload).then((r) => r.data),
  categories: () => api.get<Category[]>('/categories/').then((r) => r.data),
  brands: () => api.get<Brand[]>('/brands/').then((r) => r.data),
  addresses: () => api.get('/addresses/').then((r) => r.data),
  createAddress: (payload: Record<string, string | boolean>) => api.post('/addresses/', payload).then((r) => r.data),
  deleteAddress: (id: number) => api.delete(`/addresses/${id}/`).then((r) => r.data),
  cart: () => api.get<Cart>('/cart/current/').then((r) => r.data),
  addToCart: (productId: number, quantity = 1) => api.post<Cart>('/cart/add/', { product_id: productId, quantity }).then((r) => r.data),
  updateCartItem: (itemId: number, quantity: number) => api.patch<Cart>(`/cart/items/${itemId}/`, { quantity }).then((r) => r.data),
  removeCartItem: (itemId: number) => api.delete<Cart>(`/cart/items/${itemId}/`).then((r) => r.data),
  applyCoupon: (code: string) => api.post<Cart>('/cart/coupon/', { code }).then((r) => r.data),
  checkout: (payload: { address_id: number; payment_method: string }) => api.post<Order>('/orders/checkout/', payload).then((r) => r.data),
  orders: () => api.get<Order[]>('/orders/').then((r) => r.data),
  wishlist: () => api.get('/wishlist/').then((r) => r.data),
  addWishlist: (productId: number) => api.post('/wishlist/', { product_id: productId }).then((r) => r.data),
  removeWishlist: (id: number) => api.delete(`/wishlist/${id}/`).then((r) => r.data),
};

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login/', { email, password }).then((r) => saveAuth(r.data)),
  adminLogin: (email: string, password: string) => api.post<AuthResponse>('/auth/admin-login/', { email, password }).then((r) => saveAuth(r.data)),
  register: (payload: Record<string, string>) => api.post<AuthResponse>('/auth/register/', payload).then((r) => saveAuth(r.data)),
  google: (credential: string) => api.post<AuthResponse>('/auth/google/', { credential }).then((r) => saveAuth(r.data)),
  me: () => api.get('/auth/me/').then((r) => r.data),
  logout: () => api.post('/auth/logout/').finally(() => tokenStore.clear()),
};

export const adminApi = {
  metrics: () => api.get('/dashboard/metrics/').then((r) => r.data),
  products: () => storeApi.products(),
  productDetail: (slug: string) => storeApi.product(slug),
  saveProduct: (payload: Record<string, unknown>) => api.post('/products/', payload).then((r) => r.data),
  updateProduct: (slug: string, payload: Record<string, unknown>) => api.patch(`/products/${slug}/`, payload).then((r) => r.data),
  uploadProductImage: (payload: { productId: number; file: File; altText?: string; isPrimary?: boolean; sortOrder?: number; onProgress?: (percent: number) => void }) => {
    const form = new FormData();
    form.append('product', String(payload.productId));
    form.append('image', payload.file);
    form.append('alt_text', payload.altText ?? '');
    form.append('is_primary', payload.isPrimary ? 'true' : 'false');
    form.append('sort_order', String(payload.sortOrder ?? 0));
    return api
      .post('/product-images/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!payload.onProgress || !progressEvent.total) return;
          payload.onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  replaceProductImage: (payload: { imageId: number; file?: File; altText?: string; isPrimary?: boolean; sortOrder?: number; onProgress?: (percent: number) => void }) => {
    const form = new FormData();
    if (payload.file) form.append('image', payload.file);
    if (payload.altText !== undefined) form.append('alt_text', payload.altText);
    if (payload.isPrimary !== undefined) form.append('is_primary', payload.isPrimary ? 'true' : 'false');
    if (payload.sortOrder !== undefined) form.append('sort_order', String(payload.sortOrder));
    return api
      .patch(`/product-images/${payload.imageId}/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!payload.onProgress || !progressEvent.total) return;
          payload.onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  importProductImagesByUrl: (payload: { productId: number; urls: string[]; altText?: string; startSortOrder?: number; setFirstAsPrimary?: boolean }) =>
    api.post('/product-images/import-by-url/', {
      product: payload.productId,
      urls: payload.urls,
      alt_text: payload.altText ?? '',
      start_sort_order: payload.startSortOrder ?? 0,
      set_first_as_primary: payload.setFirstAsPrimary ?? false,
    }).then((r) => r.data as { created: Array<{ id: number; image: string; alt_text: string; is_primary: boolean; sort_order: number }>; errors: Array<{ url: string; reason: string }> }),
  deleteProductImage: (imageId: number) => api.delete(`/product-images/${imageId}/`).then((r) => r.data),
  deleteProduct: (slug: string) => api.delete(`/products/${slug}/`).then((r) => r.data),
  categories: () => storeApi.categories(),
  brands: () => storeApi.brands(),
  saveCategory: (payload: Record<string, unknown>) => api.post('/categories/', payload).then((r) => r.data),
  saveBrand: (payload: Record<string, unknown>) => api.post('/brands/', payload).then((r) => r.data),
  saveCoupon: (payload: Record<string, unknown>) => api.post('/coupons/', payload).then((r) => r.data),
  savePromotion: (payload: Record<string, unknown>) => api.post('/promotions/', payload).then((r) => r.data),
  orders: () => api.get<Order[]>('/orders/').then((r) => r.data),
  updateOrder: (id: number, status: string) => api.patch(`/orders/${id}/`, { status }).then((r) => r.data),
  customers: () => api.get('/customers/').then((r) => r.data),
};

export const formatMoney = (value: string | number) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
