'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Product } from '@/types/product';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Top10Page() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated || !user) {
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname;
          router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          router.push('/signin');
        }
        return;
      }

      if (!user.approve) {
        router.push('/unauthorized');
        return;
      }

      loadProducts();
    };

    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getProducts({ limit: 1000 });
        if (response.success && response.data) {
          // Top10 상품 필터링 및 정렬 (weight가 1~10인 상품들을 순위별로)
          const top10Products = (response.data.products || [])
            .filter(p => p.weight && p.weight > 0 && p.weight <= 10)
            .sort((a, b) => (a.weight || 0) - (b.weight || 0));
          
          setProducts(top10Products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <span className="text-orange-500 mr-3">🏆</span>
            Top 10 베스트셀러
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            가장 인기 있는 상품들을 순위별로 만나보세요
          </p>
        </div>

        {/* 상품 목록 */}
        {products.length > 0 ? (
          <div className="space-y-8">
            {products.map((product, index) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* 순위 배지 */}
                    <div className="flex-shrink-0 bg-orange-500 text-white flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
                      <span className="text-2xl sm:text-3xl font-bold">{product.weight}</span>
                    </div>
                    
                    {/* 상품 정보 */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                            {product.name}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {product.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {product.category.name}
                              </span>
                            )}
                            {product.vendor && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {product.vendor.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 상품 카드 */}
                        <div className="flex-shrink-0 w-full sm:w-80">
                          <ProductCard product={product} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Top 10 상품이 없습니다</h3>
            <p className="text-gray-600">아직 베스트셀러 상품이 등록되지 않았습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
