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
import { ImageSlider } from '@/components/ui/ImageSlider';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsApi.getProducts({ limit: 50 });
        if (response.success && response.data) {
          setProducts(response.data.products || []);
        } else {
          console.error('상품 로드 실패:', response.error);
          setProducts([]);
        }
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // 로그인 직후 인증 상태가 아직 업데이트되지 않을 수 있으므로 잠시 대기
    const checkAuth = () => {
      // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
      if (!isAuthenticated || !user) {
        router.push('/signin');
        return;
      }
      
      // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
      if (isAuthenticated && user && !user.approve) {
        router.push('/approval-pending');
        return;
      }

      // 승인된 사용자만 상품 로드
      if (isAuthenticated && user && user.approve) {
        loadProducts();
      } else {
        setLoading(false);
      }
    };

    // 즉시 체크
    checkAuth();
    
    // 1초 후에도 다시 체크 (인증 상태 업데이트 대기)
    const timer = setTimeout(checkAuth, 1000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  // 카테고리별 상품 분류 (안전한 필터링)
  const safeProducts = Array.isArray(products) ? products : [];
  

  
  const mdPicks = safeProducts.filter(p => p.isFeatured).slice(0, 3);
  const homeAppliances = safeProducts.filter(p => 
    p.category?.slug === 'home-appliances' || 
    p.category?.name === '생활가전' ||
    p.category?.name === '가전제품'
  ).slice(0, 3);
  const kitchenProducts = safeProducts.filter(p => 
    p.category?.slug === 'kitchen' || 
    p.category?.name === '주방용품' ||
    p.category?.name === '주방'
  ).slice(0, 3);
  const healthProducts = safeProducts.filter(p => 
    p.category?.slug === 'health' || 
    p.category?.name === '건강기능식품' ||
    p.category?.name === '건강'
  ).slice(0, 3);
  const electronicsProducts = safeProducts.filter(p => 
    p.category?.slug === 'electronics' || 
    p.category?.name === '전자제품' ||
    p.category?.name === '전자'
  ).slice(0, 3);

  // 슬라이더 데이터
  const heroSlides = [
    {
      id: 1,
      image: '/main/HOIDBanner.png',
      title: '호이드 오브제<br />무선청소기 출시',
      subtitle: '프리미엄 라이프스타일',
      description: '당신의 일상을 품격있게 청소하다',
      primaryButton: {
        text: '상품 둘러보기',
        onClick: () => router.push('/products')
      }
    },
    {
      id: 2,
      image: '/main/HOIDBanner.png',
      title: '스마트 주방용품<br />특별 할인',
      subtitle: '스마트 쿠킹',
      description: '요리의 즐거움을 한층 더 업그레이드하세요',
      primaryButton: {
        text: '할인 상품 보기',
        onClick: () => router.push('/category/kitchen')
      },
      secondaryButton: {
        text: '카탈로그 다운로드',
        onClick: () => {}
      }
    },
    {
      id: 3,
      image: '/main/HOIDBanner.png',
      title: '건강한 라이프스타일<br />시작하기',
      subtitle: '웰니스 케어',
      description: '프리미엄 건강기능식품으로 더 나은 내일을',
      primaryButton: {
        text: '건강식품 보기',
        onClick: () => router.push('/category/health')
      },
      secondaryButton: {
        text: '무료 상담 신청',
        onClick: () => {}
      }
    }
  ];

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
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
      {/* Hero Slider Section */}
      <ImageSlider
        slides={heroSlides}
        autoPlay={true}
        autoPlayInterval={5000}
        showDots={true}
        showArrows={true}
        className="h-[400px] sm:h-[500px] lg:h-[600px]"
      />

      {/* MD's Pick Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">MD's Pick</h2>
            <p className="text-base sm:text-lg text-gray-600">엄선된 프리미엄 제품들을 만나보세요</p>
          </div>
          {mdPicks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {mdPicks.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500">추천 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Category Sections */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">카테고리별 상품</h2>
            <p className="text-base sm:text-lg text-gray-600">다양한 카테고리의 제품들을 확인해보세요</p>
          </div>
          
          {/* 생활가전 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">생활가전</h3>
              <Link href="/category/home-appliances" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {homeAppliances.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {homeAppliances.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">생활가전 상품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 주방용품 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">주방용품</h3>
              <Link href="/category/kitchen" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {kitchenProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {kitchenProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">주방용품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 건강기능식품 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">건강기능식품</h3>
              <Link href="/category/health" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {healthProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {healthProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">건강기능식품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 전자제품 */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">전자제품</h3>
              <Link href="/category/electronics" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {electronicsProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {electronicsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">전자제품이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
