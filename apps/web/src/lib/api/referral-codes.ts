import { ReferralCode, CreateReferralCodeDto, UpdateReferralCodeDto } from '@/types/referral-code';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://feedbackmall.com';

export const referralCodesApi = {
  // 추천 코드 생성
  async createReferralCode(sellerId: string, referralCodeData: CreateReferralCodeDto): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${sellerId}/referral-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referralCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('추천 코드 생성에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('추천 코드 생성 API 호출 실패:', error);
      throw error;
    }
  },

  // 추천 코드 수정
  async updateReferralCode(referralCodeId: string, referralCodeData: UpdateReferralCodeDto): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/referral-codes/${referralCodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referralCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('추천 코드 수정에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('추천 코드 수정 API 호출 실패:', error);
      throw error;
    }
  },

  // 추천 코드 삭제
  async deleteReferralCode(referralCodeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/referral-codes/${referralCodeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('추천 코드 삭제에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('추천 코드 삭제 API 호출 실패:', error);
      throw error;
    }
  },

  // 추천 코드 상태 토글
  async toggleReferralCodeStatus(referralCodeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/referral-codes/${referralCodeId}/toggle-status`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('추천 코드 상태 변경에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('추천 코드 상태 변경 API 호출 실패:', error);
      throw error;
    }
  },
};
