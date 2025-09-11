import { Product } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const productsApi = {
  // 모든 상품 조회
  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('상품 목록을 불러올 수 없습니다.');
      }

      const result = await response.json();
      // API 응답 형태: { success: true, data: { products: Product[], pagination: {...} } }
      if (result.success && result.data && Array.isArray(result.data.products)) {
        return result.data.products;
      } else if (Array.isArray(result.data)) {
        return result.data;
      } else if (Array.isArray(result)) {
        return result;
      } else {
        console.warn('예상치 못한 API 응답 형태:', result);
        return [];
      }
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      return [];
    }
  },

  // 상품 조회 (필터링 옵션 포함)
  async getProducts(options: {
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ success: boolean; data?: { products: Product[]; pagination?: any }; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const queryString = params.toString();
      const endpoint = `/api/v1/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('상품 목록을 불러올 수 없습니다.');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      return { success: false, error: '상품 목록을 불러올 수 없습니다.' };
    }
  },

  // 카테고리별 상품 조회
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products/category/${categorySlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('카테고리별 상품 목록을 불러올 수 없습니다.');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('카테고리별 상품 목록 조회 실패:', error);
      return [];
    }
  },

  // 상품 상세 조회
  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`상품 상세 정보를 불러올 수 없습니다. (${response.status})`);
      }

      const result = await response.json();
      return result.data || result || null;
    } catch (error) {
      console.error('상품 상세 조회 실패:', error);
      return null;
    }
  },

  // 상품 검색
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('상품 검색에 실패했습니다.');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('상품 검색 실패:', error);
      return [];
    }
  },
};

export const createProduct = async (productData: {
  name: string;
  description: string;
  shortDescription?: string;
  priceB2B: number;
  priceB2C: number;
  comparePrice?: number;
  sku?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  category: string;
  vendor?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  stockQuantity: number;
  lowStockThreshold?: number;
  tags?: string[];
  metadata?: any;
  images?: File[];
  descriptionImages?: File[];
}) => {
  try {
    // FormData를 사용하여 이미지와 함께 데이터 전송
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    if (productData.shortDescription) {
      formData.append('shortDescription', productData.shortDescription);
    }
    formData.append('priceB2B', productData.priceB2B.toString());
    formData.append('priceB2C', productData.priceB2C.toString());
    if (productData.comparePrice) {
      formData.append('comparePrice', productData.comparePrice.toString());
    }
    if (productData.sku) {
      formData.append('sku', productData.sku);
    }
    if (productData.weight) {
      formData.append('weight', productData.weight.toString());
    }
    if (productData.length) {
      formData.append('length', productData.length.toString());
    }
    if (productData.width) {
      formData.append('width', productData.width.toString());
    }
    if (productData.height) {
      formData.append('height', productData.height.toString());
    }
    formData.append('category', productData.category);
    if (productData.vendor) {
      formData.append('vendor', productData.vendor);
    }
    if (productData.isActive !== undefined) {
      formData.append('isActive', productData.isActive.toString());
    }
    if (productData.isFeatured !== undefined) {
      formData.append('isFeatured', productData.isFeatured.toString());
    }
    formData.append('stockQuantity', productData.stockQuantity.toString());
    if (productData.lowStockThreshold) {
      formData.append('lowStockThreshold', productData.lowStockThreshold.toString());
    }
    if (productData.tags && productData.tags.length > 0) {
      formData.append('tags', JSON.stringify(productData.tags));
    }
    if (productData.metadata) {
      formData.append('metadata', JSON.stringify(productData.metadata));
    }
    
    if (productData.images) {
      productData.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    if (productData.descriptionImages) {
      productData.descriptionImages.forEach((image) => {
        formData.append('descriptionImages', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('상품 등록에 실패했습니다. ' + errorText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 등록 API 호출 실패:', error);
    throw error;
  }
};

// 상품 수정
export const updateProduct = async (id: string, productData: {
  name?: string;
  description?: string;
  shortDescription?: string;
  priceB2B?: number;
  priceB2C?: number;
  comparePrice?: number;
  sku?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  category?: string;
  vendor?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  tags?: string[];
  metadata?: any;
  images?: File[];
  descriptionImages?: File[];
}) => {

  try {
    // FormData를 사용하여 이미지와 함께 데이터 전송
    const formData = new FormData();
    
    // 필수 필드만 추가 (undefined, null, 빈 문자열 제외)
    if (productData.name && productData.name.trim()) formData.append('name', productData.name.trim());
    if (productData.description && productData.description.trim()) formData.append('description', productData.description.trim());
    if (productData.shortDescription && productData.shortDescription.trim()) formData.append('shortDescription', productData.shortDescription.trim());
    if (productData.priceB2B !== undefined && productData.priceB2B !== null) formData.append('priceB2B', productData.priceB2B.toString());
    if (productData.priceB2C !== undefined && productData.priceB2C !== null) formData.append('priceB2C', productData.priceB2C.toString());
    if (productData.comparePrice !== undefined && productData.comparePrice !== null) formData.append('comparePrice', productData.comparePrice.toString());
    if (productData.sku && productData.sku.trim()) formData.append('sku', productData.sku.trim());
    if (productData.weight && productData.weight > 0) formData.append('weight', productData.weight.toString());
    if (productData.length && productData.length > 0) formData.append('length', productData.length.toString());
    if (productData.width && productData.width > 0) formData.append('width', productData.width.toString());
    if (productData.height && productData.height > 0) formData.append('height', productData.height.toString());
    if (productData.category && productData.category.trim()) formData.append('category', productData.category.trim());
    if (productData.vendor && productData.vendor.trim()) formData.append('vendor', productData.vendor.trim());
    if (productData.isActive !== undefined) formData.append('isActive', productData.isActive.toString());
    if (productData.isFeatured !== undefined) formData.append('isFeatured', productData.isFeatured.toString());
    if (productData.stockQuantity && productData.stockQuantity > 0) formData.append('stockQuantity', productData.stockQuantity.toString());
    if (productData.lowStockThreshold && productData.lowStockThreshold > 0) formData.append('lowStockThreshold', productData.lowStockThreshold.toString());
    
    // 배열과 객체는 실제 데이터가 있을 때만 추가
    if (productData.tags && Array.isArray(productData.tags) && productData.tags.length > 0) {
      formData.append('tags', JSON.stringify(productData.tags));
    }
    if (productData.metadata && typeof productData.metadata === 'object' && Object.keys(productData.metadata).length > 0) {
      formData.append('metadata', JSON.stringify(productData.metadata));
    }
    
    // 이미지는 실제 파일이 있을 때만 추가
    if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
      productData.images.forEach((image) => {
        if (image instanceof File && image.size > 0) {
          formData.append('images', image);
        }
      });
    }
    
    if (productData.descriptionImages && Array.isArray(productData.descriptionImages) && productData.descriptionImages.length > 0) {
      productData.descriptionImages.forEach((image) => {
        if (image instanceof File && image.size > 0) {
          formData.append('descriptionImages', image);
        }
      });
    }

    // 삭제된 이미지 인덱스 추가
    if (productData.deletedImageIndexes && Array.isArray(productData.deletedImageIndexes) && productData.deletedImageIndexes.length > 0) {
      formData.append('deletedImageIndexes', JSON.stringify(productData.deletedImageIndexes));
    }
    
    if (productData.deletedDescriptionImageIndexes && Array.isArray(productData.deletedDescriptionImageIndexes) && productData.deletedDescriptionImageIndexes.length > 0) {
      formData.append('deletedDescriptionImageIndexes', JSON.stringify(productData.deletedDescriptionImageIndexes));
    }



    const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('상품 수정에 실패했습니다. ' + errorText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 수정 API 호출 실패:', error);
    throw error;
  }
};

// 상품 삭제
export const deleteProduct = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('상품 삭제에 실패했습니다. ' + errorText);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 삭제 API 호출 실패:', error);
    throw error;
  }
};
