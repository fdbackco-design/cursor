import { Seller } from '@/types/seller';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const sellersApi = {
  // 모든 셀러 조회
  async getAllSellers(): Promise<Seller[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('셀러 목록을 불러올 수 없습니다.');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('셀러 목록 조회 실패:', error);
      return [];
    }
  },

  // 셀러 상세 조회
  async getSellerById(id: string): Promise<Seller | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('셀러 상세 정보를 불러올 수 없습니다.');
      }

      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('셀러 상세 조회 실패:', error);
      return null;
    }
  },

  // 새 셀러 생성
  async createSeller(sellerData: {
    userId: string;
    companyName: string;
    representativeName: string;
    phone: string;
    address: string;
    referralCodes?: string[];
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('셀러 생성에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('셀러 생성 API 호출 실패:', error);
      throw error;
    }
  },

  // 셀러 수정
  async updateSeller(id: string, sellerData: {
    companyName?: string;
    representativeName?: string;
    phone?: string;
    address?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sellerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('셀러 수정에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('셀러 수정 API 호출 실패:', error);
      throw error;
    }
  },

  // 셀러 삭제
  async deleteSeller(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('셀러 삭제에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('셀러 삭제 API 호출 실패:', error);
      throw error;
    }
  },

  // 셀러 상태 토글
  async toggleSellerStatus(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${id}/toggle-status`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('셀러 상태 변경에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('셀러 상태 변경 API 호출 실패:', error);
      throw error;
    }
  },

  // 셀러 인증 상태 토글
  async toggleSellerVerification(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sellers/${id}/toggle-verification`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('셀러 인증 상태 변경에 실패했습니다. ' + errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('셀러 인증 상태 변경 API 호출 실패:', error);
      throw error;
    }
  },
};
