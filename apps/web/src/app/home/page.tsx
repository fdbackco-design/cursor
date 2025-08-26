'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { Search, Target, User, Truck, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types/product';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('HomePage - useEffect 실행:', { 
      isAuthenticated, 
      user, 
      userApprove: user?.approve,
      userStructure: JSON.stringify(user, null, 2)
    });
    
    // 인증 상태 상세 로깅
    console.log('HomePage - 인증 상태 상세:', {
      isAuthenticated,
      userExists: !!user,
      userRole: user?.role,
      userApprove: user?.approve,
      userFields: user ? Object.keys(user) : [],
      userValues: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approve: user.approve
      } : null
    });
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      console.log('HomePage - 승인되지 않은 사용자, 승인 대기 페이지로 이동');
      router.push('/approval-pending');
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await productsApi.getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error('상품 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    // 승인된 사용자만 상품 로드
    if (isAuthenticated && user && user.approve) {
      console.log('HomePage - 승인된 사용자, 상품 로드 시작');
      loadProducts();
    } else {
      console.log('HomePage - 상품 로드 조건 불충족:', { 
        isAuthenticated, 
        userExists: !!user, 
        userApprove: user?.approve,
        userKeys: user ? Object.keys(user) : []
      });
    }
  }, [isAuthenticated, user, router]);

  // 카테고리별 상품 분류
  const mdPicks = products.filter(p => p.isFeatured).slice(0, 3);
  const homeAppliances = products.filter(p => p.category?.slug === 'home-appliances').slice(0, 3);
  const kitchenProducts = products.filter(p => p.category?.slug === 'kitchen').slice(0, 3);
  const healthProducts = products.filter(p => p.category?.slug === 'health').slice(0, 3);

  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            최고의 제품을<br />
            <span className="text-yellow-300">합리적인 가격</span>으로
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            B2B와 B2C 고객을 위한 프리미엄 제품 라인업
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              상품 둘러보기
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              자세히 알아보기
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">왜 FEEDBACK을 선택해야 할까요?</h2>
            <p className="text-lg text-gray-600">품질과 가격의 완벽한 균형</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">정확한 타겟팅</h3>
              <p className="text-gray-600">B2B와 B2C 고객의 니즈에 맞는 맞춤형 솔루션</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">고객 중심</h3>
              <p className="text-gray-600">고객의 성공을 위한 지속적인 지원과 서비스</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">빠른 배송</h3>
              <p className="text-gray-600">전국 어디든 신속하고 안전한 배송</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">편리한 구매</h3>
              <p className="text-gray-600">간편한 온라인 주문과 결제 시스템</p>
            </div>
          </div>
        </div>
      </section>

      {/* MD's Pick Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">MD's Pick</h2>
            <p className="text-lg text-gray-600">엄선된 프리미엄 제품들을 만나보세요</p>
          </div>
          {mdPicks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mdPicks.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">추천 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Category Sections */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">카테고리별 상품</h2>
            <p className="text-lg text-gray-600">다양한 카테고리의 제품들을 확인해보세요</p>
          </div>
          
          {/* 생활가전 */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">생활가전</h3>
              <Link href="/category/home-appliances" className="text-blue-600 hover:text-blue-800 font-medium">
                더보기 →
              </Link>
            </div>
            {homeAppliances.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {homeAppliances.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">생활가전 상품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 주방용품 */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">주방용품</h3>
              <Link href="/category/kitchen" className="text-blue-600 hover:text-blue-800 font-medium">
                더보기 →
              </Link>
            </div>
            {kitchenProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {kitchenProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">주방용품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 건강기능식품 */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">건강기능식품</h3>
              <Link href="/category/health" className="text-blue-600 hover:text-blue-800 font-medium">
                더보기 →
              </Link>
            </div>
            {healthProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {healthProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">건강기능식품이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            최고의 제품과 서비스로 여러분의 비즈니스를 성장시켜보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              무료 상담 신청
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              제품 카탈로그 다운로드
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
