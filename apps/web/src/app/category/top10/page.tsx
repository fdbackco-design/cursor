'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/products/product-card';
import { Product } from '@/types/product';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';

export default function Top10Page() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 로딩 중에는 리다이렉트하지 않음 (로딩 완료 후 판단)
    if (authLoading) return;

    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push(`/signin?redirect=${encodeURIComponent('/category/top10')}`);
      return;
    }

    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productsApi.getProducts({ limit: 1000 });
        if (response.success && response.data) {
          // Top10 상품 필터링 및 정렬 (weight가 1~10인 상품들을 순위별로)
          const top10Products = (response.data.products || [])
            .filter((p: Product) => p.weight && p.weight > 0 && p.weight <= 10)
            .sort((a: Product, b: Product) => (a.weight || 0) - (b.weight || 0));

          setProducts(top10Products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('상품 로드 실패:', err);
        setError('상품을 불러오는 중 오류가 발생했습니다.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [authLoading, isAuthenticated, user, router]);

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }

  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">3월달 한정수량</h1>
            <p className="text-lg text-gray-600">이번달 한정 수량 제품을 만나보세요</p>
          </div>
        </div>
      </section>

      {/* 상품 목록 */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">한정수량 상품</h2>
            <p className="text-gray-600">
              {loading ? '로딩 중...' : `총 ${products.length}개의 상품`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">상품을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">한정수량 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
