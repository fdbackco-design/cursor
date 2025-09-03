import { apiRequest } from './base';

export interface DeliveryTrackingQuery {
  orderNumber?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface DeliveryStep {
  title: string;
  description: string;
  completed: boolean;
  date: Date | null;
}

export interface DeliveryTrackingInfo {
  orderNumber: string;
  status: string;
  statusText: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: any;
  items: any[];
  customerInfo: {
    name: string;
    phone: string | null;
  };
  deliverySteps: DeliveryStep[];
  estimatedDelivery: Date | null;
  shipment?: {
    id: string;
    trackingNumber: string;
    carrier: string;
    status: string;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    metadata: any;
  } | null;
}

export interface DeliveryStats {
  totalOrders: number;
  statusBreakdown: Record<string, number>;
  recentOrders: Array<{
    orderNumber: string;
    status: string;
    statusText: string;
    customerName: string;
    totalAmount: number;
    createdAt: Date;
  }>;
}

export const deliveryApi = {
  // 배송 통계 조회
  async getStats(): Promise<{ success: boolean; data?: DeliveryStats; error?: string }> {
    return apiRequest<DeliveryStats>('/delivery/stats', {
      method: 'GET',
    });
  },

  // 주문번호로 배송 추적
  async trackByOrderNumber(orderNumber: string): Promise<{ success: boolean; data?: DeliveryTrackingInfo[]; error?: string }> {
    return apiRequest<DeliveryTrackingInfo[]>(`/delivery/track/${orderNumber}`, {
      method: 'GET',
    });
  },

  // 사용자 배송 추적 (인증 필요)
  async getUserDeliveryTracking(query: DeliveryTrackingQuery = {}): Promise<{ success: boolean; data?: DeliveryTrackingInfo[]; error?: string }> {
    const params = new URLSearchParams();
    if (query.orderNumber) params.append('orderNumber', query.orderNumber);
    if (query.status) params.append('status', query.status);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    
    const queryString = params.toString();
    const endpoint = `/orders/delivery/tracking${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<DeliveryTrackingInfo[]>(endpoint, {
      method: 'GET',
    });
  },
};
