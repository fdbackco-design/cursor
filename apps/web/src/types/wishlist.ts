import type { Product } from './product';

/** API `include: { product: true }` 기준 — ProductCard 등에 그대로 전달 */
export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
  product: Product;
}

export interface WishlistResponse {
  success: boolean;
  message: string;
  data?: WishlistItem[];
}

export interface AddToWishlistRequest {
  productId: string;
}

export interface RemoveFromWishlistRequest {
  productId: string;
}
