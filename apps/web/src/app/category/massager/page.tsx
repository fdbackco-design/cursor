'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/products/product-card';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/contexts/AuthContext';

export default function MassagerPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productsApi.getProducts({
          category: '마사지기',
          limit: 50
        });
        if (response.success && response.data) {
          setProducts(response.data.products || []);
        } else {
          setError('상품을 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('마사지기 상품 조회 실패:', err);
        setError('상품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return null;
  if (isAuthenticated && user && !user.approve) return null;

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">마사지기</h1>
            <p className="text-lg text-gray-600">편안한 휴식을 위한 마사지기</p>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">마사지기 상품</h2>
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
              <p className="text-gray-600">마사지기 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
