'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDetail } from '@/components/products/product-detail';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 체크 및 상품 로드
  useEffect(() => {
    console.log('ProductPage useEffect:', { 
      authLoading, 
      isAuthenticated, 
      user: user ? { id: user.id, approve: user.approve } : null,
      productId: params.id 
    });

    // 인증 로딩 중이면 아무것도 하지 않음
    if (authLoading) {
      console.log('Auth loading, waiting...');
      return;
    }

    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      console.log('Not authenticated, redirecting to signin');
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname;
        router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      } else {
        router.push('/signin');
      }
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (!user.approve) {
      console.log('User not approved, redirecting to approval-pending');
      router.push('/approval-pending');
      return;
    }

    console.log('User authenticated and approved, loading product...');

    // 상품 로드
    const loadProduct = async () => {
      if (!params.id) {
        console.log('No product ID provided');
        setError('상품 ID가 없습니다.');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading product with ID:', params.id);
        setLoading(true);
        setError(null);
        const productData = await productsApi.getProductById(params.id as string);
        
        console.log('Product data received:', productData);
        if (productData) {
          setProduct(productData);
        } else {
          console.log('No product data found');
          setError('상품을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('상품 로드 실패:', err);
        setError('상품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id, isAuthenticated, user, router, authLoading]);

  // 인증 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자나 승인되지 않은 사용자는 리다이렉트 중이므로 아무것도 렌더링하지 않음
  if (!isAuthenticated || !user || !user.approve) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error || '요청하신 상품이 존재하지 않습니다.'}</p>
          <a 
            href="/home" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} />
    </div>
  );
}
