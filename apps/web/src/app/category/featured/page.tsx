'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from '@/components/products/product-card';
import { RefreshCw, Star } from 'lucide-react';

const FeaturedProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // 추천상품 데이터 로드
  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      // 모든 상품을 가져온 후 클라이언트에서 추천상품만 필터링
      const result = await productsApi.getProducts({ limit: 10000 });
      if (result.success && result.data && Array.isArray(result.data.products)) {
        const featuredProducts = result.data.products.filter(product => product.isFeatured);
        setProducts(featuredProducts);
      } else {
        // fallback으로 getAllProducts 사용
        const allProducts = await productsApi.getAllProducts();
        const featuredProducts = allProducts.filter(product => product.isFeatured);
        setProducts(featuredProducts);
      }
    } catch (error) {
      console.error('추천상품 로드 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">추천상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16 py-2 sm:py-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mr-2" />
                추천상품
              </h1>
              <span className="text-sm sm:text-base text-gray-500">
                ({products.length}개)
              </span>
            </div>
            <button
              onClick={loadFeaturedProducts}
              className="flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">새로고침</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">추천상품이 없습니다</h3>
            <p className="text-gray-500">현재 추천상품으로 등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProductsPage;
