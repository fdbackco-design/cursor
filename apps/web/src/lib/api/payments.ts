const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://feedbackmall.com';

export interface PaymentPrepareRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string | undefined;
  customerName?: string;
  customerMobilePhone?: string | undefined;
}

export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
  orderMetadata?: {
    items?: Array<{
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      finalPrice: number;
    }>;
    shippingAddress?: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    addressId?: string;
    couponId?: string;
    discountAmount?: number;
    shippingAmount?: number;
  };
}

export const paymentsApi = {
  // 결제 준비
  async preparePayment(data: PaymentPrepareRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 준비에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 준비 실패:', error);
      throw error;
    }
  },

  // 결제 승인 (반드시 결제 위젯 성공 후 호출, 주문은 승인 성공 시에만 생성됨)
  async confirmPayment(data: PaymentConfirmRequest) {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || '결제 승인에 실패했습니다.');
    }
    return json;
  },

  // 결제 정보 조회 (쿠폰 정보 포함)
  async getPaymentInfo(paymentKey: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentKey}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 정보 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 정보 조회 실패:', error);
      throw error;
    }
  },

  // 결제 조회
  async getPayment(paymentKey: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 조회 실패:', error);
      throw error;
    }
  },

  // 주문 ID로 결제 조회
  async getPaymentByOrderId(orderId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 조회에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 조회 실패:', error);
      throw error;
    }
  },

  // 결제 취소
  async cancelPayment(paymentKey: string, data: {
    cancelReason: string;
    cancelAmount?: number;
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 취소에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('결제 취소 실패:', error);
      throw error;
    }
  },
};
