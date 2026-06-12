export type Category = { id: number; name: string; slug: string; is_featured?: boolean };
export type Brand = { id: number; name: string; slug: string };

export type ProductImage = {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  sort_order?: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category?: Category | null;
  brand?: Brand | null;
  description?: string;
  specifications?: Record<string, string>;
  price: string;
  promotional_price?: string | null;
  current_price: string;
  average_rating: string;
  sold_count: number;
  is_active?: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  in_stock: boolean;
  primary_image?: ProductImage | null;
  images?: ProductImage[];
  inventory?: { quantity: number; available: number; is_low_stock: boolean };
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type Cart = {
  id: number;
  items: CartItem[];
  coupon_code?: string;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
};

export type GuestCartItem = {
  id: string;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type GuestCart = {
  id: 'guest';
  items: GuestCartItem[];
  coupon_code?: string;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  is_guest: true;
};

export type CartLike = Cart | GuestCart;

export type Order = {
  id: number;
  status: string;
  total: string;
  subtotal: string;
  discount: string;
  shipping: string;
  created_at: string;
  items?: Array<{ id: number; product_name: string; quantity: number; subtotal: string }>;
};

export type Address = {
  id: number;
  label: string;
  recipient: string;
  zip_code: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
};

export type WishlistItem = {
  id: number;
  product: Product;
  created_at: string;
};

export type Review = {
  id: number;
  product: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: { first_name?: string; username: string };
};
