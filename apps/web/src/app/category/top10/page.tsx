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
          <div className="space-y-6">
            {products.map((product, index) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-orange-100">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* 순위 배지 - 더 강조된 디자인 */}
                    <div className="relative flex-shrink-0">
                      <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-orange-500 opacity-30"></div>
                        <div className="relative z-10 text-center">
                          <div className="text-xs lg:text-sm font-semibold mb-1">RANK</div>
                          <div className="text-3xl lg:text-4xl font-black">{product.weight}</div>
                        </div>
                        {/* 순위별 특별 아이콘 */}
                        {product.weight === 1 && (
                          <div className="absolute -top-2 -right-2 text-2xl">👑</div>
                        )}
                        {product.weight === 2 && (
                          <div className="absolute -top-2 -right-2 text-2xl">🥈</div>
                        )}
                        {product.weight === 3 && (
                          <div className="absolute -top-2 -right-2 text-2xl">🥉</div>
                        )}
                      </div>
                    </div>
                    
                    {/* 상품 정보 */}
                    <div className="flex-1 p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between h-full">
                        <div className="flex-1 mb-4 lg:mb-0 lg:mr-6">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mr-3">
                              {product.name}
                            </h3>
                            {/* 순위별 특별 배지 */}
                            {product.weight === 1 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                                🏆 1위
                              </span>
                            )}
                            {product.weight === 2 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">
                                🥈 2위
                              </span>
                            )}
                            {product.weight === 3 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                                🥉 3위
                              </span>
                            )}
                            {product.weight && product.weight > 3 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                Top {product.weight}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm lg:text-base">
                            {product.shortDescription || product.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
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
                        <div className="flex-shrink-0 w-full lg:w-80">
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
