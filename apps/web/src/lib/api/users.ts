const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  createdAt?: string;
  phoneNumber?: string;
  shippingAddress?: any;
  talkMessageAgreed?: boolean;
  seller?: {
    id: string;
    companyName: string;
  } | null;
}

export const usersApi = {
  // 모든 사용자 조회
  async getAllUsers(role?: string, excludeSellerUsers?: boolean): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (excludeSellerUsers) params.append('excludeSellerUsers', 'true');
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`사용자 목록을 불러올 수 없습니다. ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      throw error;
    }
  },

  // 셀러 등록 가능한 사용자 조회 (아직 셀러로 등록되지 않은 사용자)
  async getAvailableUsersForSeller(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/available-for-seller`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`사용자 목록을 불러올 수 없습니다. ${JSON.stringify(errorData)}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('셀러 등록 가능한 사용자 목록 조회 실패:', error);
      throw error;
    }
  },

  // 회원탈퇴
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/account`, {
        method: 'DELETE',
        credentials: 'include', // 쿠키를 사용한 인증
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '회원탈퇴 처리 중 오류가 발생했습니다.');
      }
      
      return await response.json();
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      throw error;
    }
  },
};
