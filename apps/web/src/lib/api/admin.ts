import { apiRequest } from './base';

export interface AdminOrder {
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
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    finalPrice: number;
    product: {
      id: string;
      name: string;
      images: string[];
      priceB2C: number;
      vendor?: {
        id: string;
        name: string;
        code: string;
      };
    };
  }[];
}

export interface AdminOrderListResponse {
  success: boolean;
  data?: {
    orders: AdminOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

export interface AdminOrderResponse {
  success: boolean;
  data?: AdminOrder;
  message?: string;
  error?: string;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface VendorListResponse {
  success: boolean;
  data?: Vendor[];
  message?: string;
  error?: string;
}

export interface AdminStats {
  totalProducts: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
  };
  activeSellers: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
  };
  todayOrders: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
  };
  lowStockProducts: {
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
  };
}

export const adminApi = {
  // 관리자 주문 목록 조회
  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    vendorId?: string;
  } = {}): Promise<AdminOrderListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status && options.status !== 'all') params.append('status', options.status);
    if (options.search) params.append('search', options.search);
    if (options.vendorId && options.vendorId !== 'all') params.append('vendorId', options.vendorId);
    
    const queryString = params.toString();
    const endpoint = `/orders/admin/all${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AdminOrderListResponse['data']>(endpoint, {
      method: 'GET',
    }) as Promise<AdminOrderListResponse>;
  },

  // 관리자 주문 상태 변경
  async updateOrderStatus(orderNumber: string, status: string): Promise<AdminOrderResponse> {
    return apiRequest<AdminOrder>(`/orders/admin/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // 관리자 vendor 목록 조회
  async getVendors(): Promise<VendorListResponse> {
    return apiRequest<Vendor[]>('/orders/admin/vendors', {
      method: 'GET',
    });
  },

  // 관리자 통계 조회
  async getStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
    return apiRequest<AdminStats>('/admin/stats', {
      method: 'GET',
    });
  },

  // 주문 배송 정보 업데이트
  async updateOrderDelivery(orderId: string, deliveryInfo: {
    courier: string;
    trackingNumber: string;
  }): Promise<AdminOrderResponse> {
    return apiRequest<AdminOrder>(`/orders/admin/${orderId}/delivery`, {
      method: 'PATCH',
      body: JSON.stringify(deliveryInfo),
    });
  },

  // 관리자 주문 상세 조회
  async getOrderDetail(orderNumber: string): Promise<AdminOrderResponse> {
    return apiRequest<AdminOrder>(`/orders/admin/${orderNumber}`, {
      method: 'GET',
    });
  },
};

// getAdminStats 함수를 별도로 export (기존 코드 호환성)
export const getAdminStats = adminApi.getStats;