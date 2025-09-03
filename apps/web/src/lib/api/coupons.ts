import { apiRequest, ApiResponse } from './base';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minAmount?: number;
  maxAmount?: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  maxUses?: number;
  userMaxUses?: number;
  currentUses: number;
  isExpired?: boolean;
  isUsageLimitReached?: boolean;
  isUsable?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userCoupons?: UserCoupon[];
}

export interface UpdateCouponDto {
  code?: string;
  name?: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  minAmount?: number;
  maxAmount?: number;
  maxUses?: number;
  userMaxUses?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface UserCoupon {
  id: string;
  userId: string;
  couponId: string;
  createdAt: string;
  updatedAt: string;
  coupon: Coupon;
}

export interface CouponsResponse extends ApiResponse<UserCoupon[]> {}
export interface CouponRegisterResponse extends ApiResponse<UserCoupon> {}

export const couponsApi = {
  // 내 쿠폰 목록 조회
  async getMyCoupons(): Promise<CouponsResponse> {
    return apiRequest<UserCoupon[]>('/coupons/my-coupons', {
      method: 'GET',
    });
  },

  // 쿠폰 코드로 쿠폰 등록
  async registerCoupon(couponCode: string): Promise<CouponRegisterResponse> {
    return apiRequest<UserCoupon>('/coupons/register', {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    });
  },

  // 쿠폰 사용 처리 (소프트 딜리트)
  async useCoupon(couponId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return apiRequest(`/coupons/${couponId}/use`, {
      method: 'POST',
    });
  },

  // 쿠폰 유효성 검증
  async validateCoupon(
    code: string,
    userId: string,
    orderAmount: number
  ): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    const params = new URLSearchParams({
      userId,
      orderAmount: orderAmount.toString(),
    });

    return apiRequest<Coupon>(`/coupons/validate/${code}?${params.toString()}`, {
      method: 'GET',
    });
  },

  // 관리자용: 모든 쿠폰 목록 조회
  async getAllCoupons(): Promise<Coupon[]> {
    const response = await apiRequest<Coupon[]>('/coupons/admin/all', {
      method: 'GET',
    });
    return response.data || [];
  },

  // 관리자용: 쿠폰 상태 토글
  async toggleCouponStatus(couponId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return apiRequest(`/coupons/admin/${couponId}/toggle`, {
      method: 'PATCH',
    });
  },

  // 관리자용: 쿠폰 삭제
  async deleteCoupon(couponId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return apiRequest(`/coupons/admin/${couponId}`, {
      method: 'DELETE',
    });
  },

  // 관리자용: 쿠폰 생성
  async createCoupon(couponData: Partial<Coupon>): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    return apiRequest<Coupon>('/coupons/admin', {
      method: 'POST',
      body: JSON.stringify(couponData),
    });
  },

  // 관리자용: 쿠폰 수정
  async updateCoupon(couponId: string, couponData: Partial<Coupon>): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    return apiRequest<Coupon>(`/coupons/admin/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify(couponData),
    });
  },

  // 쿠폰 상세 조회 (ID로)
  async getCouponById(couponId: string): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    return apiRequest<Coupon>(`/coupons/${couponId}`, {
      method: 'GET',
    });
  },

  // 관리자용: 쿠폰 상세 조회 (ID로)
  async getAdminCouponById(couponId: string): Promise<{ success: boolean; data?: Coupon; error?: string }> {
    return apiRequest<Coupon>(`/coupons/admin/${couponId}`, {
      method: 'GET',
    });
  },
};

// 쿠폰 유틸리티 함수들
export const couponUtils = {
  // 할인 금액 계산
  calculateDiscount(coupon: Coupon, orderAmount: number): number {
    if (!coupon.isUsable) return 0;

    if (coupon.minAmount && orderAmount < coupon.minAmount) {
      return 0;
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (orderAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.discountValue;
    }

    // 최대 할인 금액 적용
    if (coupon.maxAmount && discount > coupon.maxAmount) {
      discount = coupon.maxAmount;
    }

    return Math.floor(discount);
  },

  // 쿠폰 상태 텍스트
  getStatusText(coupon: Coupon): string {
    if (!coupon.isActive) return '비활성화됨';
    if (coupon.isExpired) return '만료됨';
    if (coupon.isUsageLimitReached) return '사용횟수 초과';
    if (coupon.isUsable) return '사용가능';
    return '사용불가';
  },

  // 쿠폰 상태 색상
  getStatusColor(coupon: Coupon): string {
    if (coupon.isUsable) return 'text-green-600';
    if (coupon.isExpired || coupon.isUsageLimitReached) return 'text-red-600';
    return 'text-gray-500';
  },

  // 유효기간 텍스트
  getValidityText(coupon: Coupon): string {
    if (!coupon.endsAt) return '무제한';
    
    const endsAt = new Date(coupon.endsAt);
    const now = new Date();
    const diffTime = endsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '만료됨';
    if (diffDays === 0) return '오늘 만료';
    if (diffDays === 1) return '내일 만료';
    if (diffDays <= 7) return `${diffDays}일 후 만료`;
    
    return endsAt.toLocaleDateString('ko-KR');
  },

  // 할인 표시 텍스트
  getDiscountText(coupon: Coupon): string {
    if (coupon.discountType === 'PERCENTAGE') {
      return `${coupon.discountValue}% 할인`;
    } else {
      return `${coupon.discountValue.toLocaleString()}원 할인`;
    }
  },
};