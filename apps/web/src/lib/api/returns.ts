import { apiRequest } from './base';

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId?: string;
  type: 'RETURN' | 'EXCHANGE' | 'CANCEL';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  refundAmount?: number;
  notes?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  refundId?: string;
  trackingNumber?: string;
  carrier?: string;
  exchangeTrackingNumber?: string;
  exchangeCarrier?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    orderNumber: string;
    user: {
      name: string;
      email: string;
      phoneNumber?: string;
    };
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      finalPrice: number;
    }>;
  };
  orderItem?: {
    id: string;
    productName: string;
    quantity: number;
    finalPrice: number;
    product: {
      name: string;
      images: string[];
    };
  };
}

export interface CreateReturnDto {
  orderId: string;
  orderItemId?: string;
  type: 'RETURN' | 'EXCHANGE' | 'CANCEL';
  reason: string;
  notes?: string;
  refundAmount?: number;
}

export interface UpdateReturnStatusDto {
  status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  adminNotes?: string;
  processedBy?: string;
  refundId?: string;
  trackingNumber?: string;
  carrier?: string;
  exchangeTrackingNumber?: string;
  exchangeCarrier?: string;
}

export interface ReturnQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  orderNumber?: string;
  customerName?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReturnStats {
  totalReturns: number;
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  reasonBreakdown: Record<string, number>;
  recentReturns: ReturnRequest[];
}

export interface ReturnListResponse {
  success: boolean;
  data?: {
    returns: ReturnRequest[];
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

export interface ReturnResponse {
  success: boolean;
  data?: ReturnRequest;
  message?: string;
  error?: string;
}

export interface ReturnStatsResponse {
  success: boolean;
  data?: ReturnStats;
  error?: string;
}

export const returnsApi = {
  // 반품/교환/취소 요청 생성
  async createReturn(createReturnDto: CreateReturnDto): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>('/returns', {
      method: 'POST',
      body: JSON.stringify(createReturnDto),
    });
  },

  // 반품/교환/취소 목록 조회 (관리자용)
  async getReturns(query: ReturnQueryDto = {}): Promise<ReturnListResponse> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.status) params.append('status', query.status);
    if (query.type) params.append('type', query.type);
    if (query.orderNumber) params.append('orderNumber', query.orderNumber);
    if (query.customerName) params.append('customerName', query.customerName);
    if (query.reason) params.append('reason', query.reason);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    
    const queryString = params.toString();
    const endpoint = `/returns/admin${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<ReturnListResponse['data']>(endpoint, {
      method: 'GET',
    }) as Promise<ReturnListResponse>;
  },

  // 반품/교환/취소 상세 조회
  async getReturnById(id: string): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/${id}`, {
      method: 'GET',
    });
  },

  // 반품/교환/취소 상태 업데이트 (관리자용)
  async updateReturnStatus(id: string, updateDto: UpdateReturnStatusDto): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/admin/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateDto),
    });
  },

  // 반품 통계 조회 (관리자용)
  async getReturnStats(): Promise<ReturnStatsResponse> {
    return apiRequest<ReturnStats>('/returns/admin/stats', {
      method: 'GET',
    });
  },

  // 자동 승인 규칙 적용
  async processAutoApproval(id: string): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/admin/${id}/auto-approve`, {
      method: 'POST',
    });
  },

  // 환불 처리
  async processRefund(id: string, refundData: { refundAmount: number; reason?: string }): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/admin/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  },

  // 교환 상품 출고 처리
  async processExchangeShipment(id: string, shipmentData: { trackingNumber: string; carrier: string }): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/admin/${id}/exchange-ship`, {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  },

  // 반품 회수 요청
  async requestPickup(id: string, pickupData: { carrier: string; pickupDate?: string }): Promise<ReturnResponse> {
    return apiRequest<ReturnRequest>(`/returns/admin/${id}/pickup-request`, {
      method: 'POST',
      body: JSON.stringify(pickupData),
    });
  },
};
