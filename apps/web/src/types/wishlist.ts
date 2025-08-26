export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    brand: string;
    description: string;
    priceB2B: number;
    priceB2C: number;
    images: string[];
    descriptionImages?: string[];
    category: string;
    isActive: boolean;
  };
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
