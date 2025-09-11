const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://feedbackmall.com';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    images?: any;
    priceB2C: number;
    stockQuantity: number;
    lowStockThreshold?: number;
    category?: {
      name: string;
    };
    vendor?: {
      name: string;
    };
  };
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: Cart | null;
  error?: string;
}

export interface CartItemResponse {
  success: boolean;
  message: string;
  data: CartItem | null;
  error?: string;
}

export const cartApi = {
  // 장바구니 조회
  async getCart(): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      throw error;
    }
  },

  // 장바구니에 상품 추가
  async addToCart(data: AddToCartRequest): Promise<CartItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      throw error;
    }
  },

  // 장바구니 아이템 수량 업데이트
  async updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<CartItemResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('장바구니 아이템 업데이트 실패:', error);
      throw error;
    }
  },

  // 장바구니에서 아이템 제거
  async removeFromCart(itemId: string): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('장바구니 아이템 제거 실패:', error);
      throw error;
    }
  },

  // 장바구니 전체 비우기
  async clearCart(): Promise<CartResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
      throw error;
    }
  },
};