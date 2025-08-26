const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minAmount?: number;
  maxAmount?: number;
  maxUses?: number;
  currentUses: number;
  userMaxUses?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCoupons?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;

}

export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minAmount?: number;
  maxAmount?: number;
  maxUses?: number;
  userMaxUses?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface UpdateCouponDto {
  code?: string;
  name?: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue?: number;
  minAmount?: number;
  maxAmount?: number;
  maxUses?: number;
  userMaxUses?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export const couponsApi = {
  // 모든 쿠폰 조회
  async getAllCoupons(): Promise<Coupon[]> {
    const response = await fetch(`${API_BASE_URL}/coupons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 목록을 불러올 수 없습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 상세 조회
  async getCouponById(id: string): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 정보를 불러올 수 없습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 생성
  async createCoupon(couponData: CreateCouponDto): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 생성에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 수정
  async updateCoupon(id: string, couponData: UpdateCouponDto): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 수정에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 삭제
  async deleteCoupon(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 삭제에 실패했습니다.');
    }
  },

  // 쿠폰 활성화/비활성화 토글
  async toggleCouponStatus(id: string): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons/${id}/toggle-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 상태 변경에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 유효성 검증
  async validateCoupon(code: string, userId: string, orderAmount: number): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons/validate/${code}?userId=${userId}&orderAmount=${orderAmount}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 검증에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  },

  // 쿠폰 사용
  async useCoupon(couponId: string, userId: string): Promise<Coupon> {
    const response = await fetch(`${API_BASE_URL}/coupons/${couponId}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '쿠폰 사용에 실패했습니다.');
    }

    const data = await response.json();
    return data.data;
  }
};
