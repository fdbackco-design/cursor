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
      return result.data || [];
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      return [];
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
        throw new Error('상품 상세 정보를 불러올 수 없습니다.');
      }

      const result = await response.json();
      return result.data || null;
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
  console.log('updateProduct - 전송할 데이터:', productData);
  try {
    // FormData를 사용하여 이미지와 함께 데이터 전송
    const formData = new FormData();
    
    // 필수 필드만 추가 (undefined, null, 빈 문자열 제외)
    if (productData.name && productData.name.trim()) formData.append('name', productData.name.trim());
    if (productData.description && productData.description.trim()) formData.append('description', productData.description.trim());
    if (productData.shortDescription && productData.shortDescription.trim()) formData.append('shortDescription', productData.shortDescription.trim());
    if (productData.priceB2B && productData.priceB2B > 0) formData.append('priceB2B', productData.priceB2B.toString());
    if (productData.priceB2C && productData.priceB2C > 0) formData.append('priceB2C', productData.priceB2C.toString());
    if (productData.comparePrice && productData.comparePrice > 0) formData.append('comparePrice', productData.comparePrice.toString());
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

    // FormData 디버깅
    console.log('FormData 내용:');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });

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