const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
    priceB2C: number;
    images?: string[];
    isActive: boolean;
    stockQuantity: number;
    lowStockThreshold?: number;
    vendor?: {
      name: string;
    };
    category?: {
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

export interface AddToCartDto {
  userId: string;
  productId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export const cartApi = {
  // 사용자의 장바구니 조회
  async getCart(userId: string): Promise<Cart | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`장바구니를 불러올 수 없습니다. ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      throw error;
    }
  },

  // 장바구니에 상품 추가
  async addToCart(addToCartDto: AddToCartDto): Promise<CartItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addToCartDto),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`장바구니 추가에 실패했습니다. ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      throw error;
    }
  },

  // 장바구니 아이템 수량 업데이트
  async updateCartItem(itemId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartItem> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateCartItemDto),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`장바구니 아이템 업데이트에 실패했습니다. ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('장바구니 아이템 업데이트 실패:', error);
      throw error;
    }
  },

  // 장바구니에서 상품 제거
  async removeFromCart(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/item/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`장바구니에서 제거에 실패했습니다. ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('장바구니에서 제거 실패:', error);
      throw error;
    }
  },

  // 장바구니 전체 비우기
  async clearCart(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/${userId}/clear`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`장바구니 비우기에 실패했습니다. ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
      throw error;
    }
  },
};
