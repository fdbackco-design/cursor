import { WishlistResponse, AddToWishlistRequest, RemoveFromWishlistRequest } from '@/types/wishlist';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const wishlistApi = {
  // 찜목록 조회
  async getWishlist(): Promise<WishlistResponse> {
    try {
      // console.log('=== 찜목록 조회 요청 시작 ===');
      // console.log('현재 쿠키:', document.cookie);
      // console.log('API URL:', `${API_BASE_URL}/api/v1/wishlist`);
      
      const requestOptions = {
        method: 'GET',
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      //console.log('요청 옵션:', requestOptions);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist`, requestOptions);

      // console.log('찜목록 조회 응답:', response.status, response.statusText);
      // console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error('찜목록을 불러올 수 없습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('찜목록 조회 실패:', error);
      throw error;
    }
  },

  // 찜하기 추가
  async addToWishlist(data: AddToWishlistRequest): Promise<WishlistResponse> {
    try {
      // console.log('=== 찜하기 추가 요청 시작 ===');
      // console.log('요청 데이터:', data);
      // console.log('현재 쿠키:', document.cookie);
      // console.log('API URL:', `${API_BASE_URL}/api/v1/wishlist`);
      
      const requestOptions = {
        method: 'POST',
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      };
      
      //console.log('요청 옵션:', requestOptions);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist`, requestOptions);

      // console.log('찜하기 추가 응답:', response.status, response.statusText);
      // console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        // TODO: 로그인 유도 처리
        throw new Error('인증이 필요합니다.');
      }
      if (!response.ok) {
        throw new Error('찜하기 추가에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('찜하기 추가 실패:', error);
      throw error;
    }
  },

  // 찜하기 제거
  async removeFromWishlist(data: RemoveFromWishlistRequest): Promise<WishlistResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('찜하기 제거에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('찜하기 제거 실패:', error);
      throw error;
    }
  },

  // 상품이 찜되어 있는지 확인
  async checkWishlistStatus(productId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wishlist/check/${productId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.data?.isWishlisted || false;
    } catch (error) {
      console.error('찜하기 상태 확인 실패:', error);
      return false;
    }
  },
};
