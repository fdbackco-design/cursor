import { apiRequest } from './base';
import { Order as TypeOrder } from '@/types/order';

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  finalPrice: number;
  metadata?: any;
  returns?: {
    id: string;
    type: 'RETURN' | 'EXCHANGE' | 'CANCEL';
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
    reason: string;
    createdAt: string;
  }[];
}

export interface CreateOrderRequest {
  orderNumber: string;
  couponId?: string;
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  referralCodeUsed?: string;
  couponCodeUsed?: string;
  shippingAddress: any;
  billingAddress: any;
  notes?: string;
  metadata?: any;
  items: OrderItem[];
  paymentKey: string;
  paymentMethod: string;
  paidAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: any;
  billingAddress: any;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderResponse {
  success: boolean;
  data?: Order;
  message?: string;
  error?: string;
}

export interface OrderDetailResponse {
  success: boolean;
  data?: Order & {
    user?: {
      name: string;
      email: string;
      phoneNumber?: string;
    };
  };
  error?: string;
}

export interface OrderListResponse {
  success: boolean;
  data?: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } | undefined;
  error?: string;
}

export const ordersApi = {
  // 주문 생성
  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // 주문 취소
  async cancelOrder(orderNumber: string, reason: string): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
    return apiRequest(`/orders/${orderNumber}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // 사용자 주문 목록 조회
  async getUserOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<OrderListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    
    const queryString = params.toString();
    const endpoint = `/orders${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<OrderListResponse['data']>(endpoint, {
      method: 'GET',
    });
  },

  // 사용자 주문 목록 조회 (별칭)
  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<OrderListResponse> {
    return this.getUserOrders(options);
  },

  async getOrderByNumber(orderNumber: string): Promise<{ success: boolean; data?: Order; error?: string }> {
    return apiRequest<Order>(`/orders/${orderNumber}`, {
      method: 'GET',
    });
  },

  // 주문 상세 조회
  async getOrderDetail(orderNumber: string): Promise<{ success: boolean; data?: TypeOrder; error?: string }> {
    return apiRequest<TypeOrder>(`/orders/${orderNumber}`, {
      method: 'GET',
    });
  },

  // 주문 메모 업데이트
  async updateOrderNotes(orderNumber: string, notes: string): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    return apiRequest(`/orders/admin/${orderNumber}/update-notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
  },
};