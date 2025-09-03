import { apiRequest } from './base';

export interface CreateReviewData {
  productId: string;
  orderId: string;
  orderItemId: string;
  rating: number;
  title?: string;
  content: string;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  content?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
    images: string[];
  };
}

export interface AvailableReviewItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productImages: string[];
  quantity: number;
  finalPrice: number;
  hasReview: boolean;
  reviewId: string | null;
}

export const reviewsApi = {
  // 상품별 리뷰 목록 조회
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ 
    success: boolean; 
    data?: { 
      reviews: Review[]; 
      stats: {
        totalReviews: number;
        averageRating: number;
        ratingDistribution: Array<{
          rating: number;
          count: number;
          percentage: number;
        }>;
      };
      pagination: any 
    }; 
    error?: string 
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    return apiRequest(`/reviews/product/${productId}?${params}`);
  },

  // 내 리뷰 목록 조회
  async getMyReviews(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ success: boolean; data?: { reviews: Review[]; pagination: any }; error?: string }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    return apiRequest(`/reviews/my?${params}`);
  },

  // 리뷰 상세 조회
  async getReviewById(id: string): Promise<{ success: boolean; data?: Review; error?: string }> {
    return apiRequest(`/reviews/${id}`);
  },

  // 리뷰 작성
  async createReview(data: CreateReviewData): Promise<{ success: boolean; data?: Review; message?: string; error?: string }> {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 리뷰 수정
  async updateReview(id: string, data: UpdateReviewData): Promise<{ success: boolean; data?: Review; message?: string; error?: string }> {
    return apiRequest(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 리뷰 삭제
  async deleteReview(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return apiRequest(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },

  // 주문 상품별 리뷰 작성 가능 여부 확인
  async getAvailableReviewItems(orderId: string): Promise<{
    success: boolean;
    data?: {
      orderId: string;
      orderStatus: string;
      items: AvailableReviewItem[];
    };
    error?: string;
  }> {
    return apiRequest(`/reviews/order/${orderId}/available`);
  },

  // 관리자용 리뷰 목록 조회
  async getAdminReviews(options: {
    page?: number;
    limit?: number;
    rating?: number;
    search?: string;
    productId?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    success: boolean;
    data?: {
      reviews: Review[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.rating) params.append('rating', options.rating.toString());
    if (options.search) params.append('search', options.search);
    if (options.productId) params.append('productId', options.productId);
    if (options.userId) params.append('userId', options.userId);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    
    const queryString = params.toString();
    const endpoint = `/reviews/admin${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint, {
      method: 'GET',
    });
  }
};
