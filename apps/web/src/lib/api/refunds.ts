import { apiRequest } from './base';

export interface RefundReason {
  PRODUCT_DEFECT: '상품 불량';
  CUSTOMER_CHANGE: '구매자 변심';
  DELIVERY_ERROR: '배송 오류';
  WRONG_ITEM: '잘못된 상품 배송';
  DAMAGED_PACKAGE: '포장 손상';
  SIZE_MISMATCH: '사이즈 불일치';
  COLOR_MISMATCH: '색상 불일치';
  OTHER: '기타';
}

export interface RefundStatus {
  PENDING: '환불 대기';
  PROCESSING: '환불 처리 중';
  COMPLETED: '환불 완료';
  FAILED: '환불 실패';
  CANCELLED: '환불 취소';
}

export interface RefundCalculationResult {
  orderId: string;
  totalRefundAmount: number;
  itemRefunds: Array<{
    orderItemId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    alreadyRefunded: number;
    refundableAmount: number;
  }>;
  couponRefundAmount: number;
  shippingRefundAmount: number;
  alreadyRefundedAmount: number;
  refundableAmount: number;
  isFullRefund: boolean;
}

export interface CreateRefundRequest {
  returnId: string;
  orderId: string;
  orderItemIds?: string[];
  refundReason: keyof RefundReason;
  notes?: string;
}

export interface ProcessRefundRequest {
  processedBy: string;
  notes?: string;
}

export interface RefundQueryDto {
  orderId?: string;
  returnId?: string;
  status?: keyof RefundStatus;
  refundReason?: keyof RefundReason;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface RefundStats {
  totalRefunds: number;
  completedRefunds: number;
  pendingRefunds: number;
  failedRefunds: number;
  totalRefundAmount: number;
}

export const refundsApi = {
  /**
   * 환불 금액 계산
   */
  async calculateRefundAmount(
    orderId: string,
    orderItemIds?: string[],
    refundReason?: keyof RefundReason
  ): Promise<{ success: boolean; data?: RefundCalculationResult; error?: string }> {
    try {
      const response = await apiRequest<RefundCalculationResult>('/refunds/calculate', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          orderItemIds,
          refundReason
        }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 금액 계산 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 금액 계산에 실패했습니다.' 
      };
    }
  },

  /**
   * 환불 생성
   */
  async createRefund(refundData: CreateRefundRequest): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiRequest('/refunds', {
        method: 'POST',
        body: JSON.stringify(refundData),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 생성 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 생성에 실패했습니다.' 
      };
    }
  },

  /**
   * 환불 처리 (토스페이먼츠 API 호출)
   */
  async processRefund(
    refundId: string, 
    processData: ProcessRefundRequest
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiRequest(`/refunds/${refundId}/process`, {
        method: 'PATCH',
        body: JSON.stringify(processData),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 처리 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 처리에 실패했습니다.' 
      };
    }
  },

  /**
   * 환불 내역 조회
   */
  async getRefunds(query?: RefundQueryDto): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (query?.orderId) params.append('orderId', query.orderId);
      if (query?.returnId) params.append('returnId', query.returnId);
      if (query?.status) params.append('status', query.status);
      if (query?.refundReason) params.append('refundReason', query.refundReason);
      if (query?.startDate) params.append('startDate', query.startDate);
      if (query?.endDate) params.append('endDate', query.endDate);
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());

      const response = await apiRequest<any>(`/refunds?${params.toString()}`, {
        method: 'GET',
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 내역 조회 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 내역 조회에 실패했습니다.' 
      };
    }
  },

  /**
   * 환불 통계 조회
   */
  async getRefundStats(): Promise<{ success: boolean; data?: RefundStats; error?: string }> {
    try {
      const response = await apiRequest<RefundStats>('/refunds/stats', {
        method: 'GET',
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 통계 조회 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 통계 조회에 실패했습니다.' 
      };
    }
  },

  /**
   * 특정 환불 상세 조회
   */
  async getRefund(refundId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiRequest(`/refunds/${refundId}`, {
        method: 'GET',
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('환불 상세 조회 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '환불 상세 조회에 실패했습니다.' 
      };
    }
  }
};

// 환불 사유 옵션
export const REFUND_REASONS: RefundReason = {
  PRODUCT_DEFECT: '상품 불량',
  CUSTOMER_CHANGE: '구매자 변심',
  DELIVERY_ERROR: '배송 오류',
  WRONG_ITEM: '잘못된 상품 배송',
  DAMAGED_PACKAGE: '포장 손상',
  SIZE_MISMATCH: '사이즈 불일치',
  COLOR_MISMATCH: '색상 불일치',
  OTHER: '기타'
};

// 환불 상태 옵션
export const REFUND_STATUSES: RefundStatus = {
  PENDING: '환불 대기',
  PROCESSING: '환불 처리 중',
  COMPLETED: '환불 완료',
  FAILED: '환불 실패',
  CANCELLED: '환불 취소'
};
