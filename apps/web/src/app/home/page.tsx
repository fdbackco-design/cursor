'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { Search, Target, User, Truck, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types/product';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ImageSlider } from '@/components/ui/ImageSlider';
import { getImageUrl } from '@/lib/utils/image';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsApi.getProducts({ limit: 50 });
        if (response.success && response.data) {
          setProducts(response.data.products || []);
        } else {
          //console.error('상품 로드 실패:', response.error);
          setProducts([]);
        }
      } catch (error) {
        //console.error('상품 로드 실패:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // 로그인 직후 인증 상태가 아직 업데이트되지 않을 수 있으므로 잠시 대기
    const checkAuth = () => {
      // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트 (현재 URL을 쿼리 파라미터로 전달)
      if (!isAuthenticated || !user) {
        // 클라이언트 사이드에서만 window 객체 사용
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname;
          router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          router.push('/signin');
        }
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

  // 마우스 휠 이벤트로 좌우 스크롤 처리
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Shift 키를 누르고 있거나 수직 스크롤이 아닌 경우에만 좌우 스크롤
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 카테고리별 상품 분류 (안전한 필터링)
  const safeProducts = Array.isArray(products) ? products : [];
  

  
  const mdPicks = safeProducts.filter(p => p.isFeatured); // 모든 추천 상품 가져오기
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
  const electronicsProducts = safeProducts.filter(p => 
    p.category?.slug === 'electronics' || 
    p.category?.name === '전자제품' ||
    p.category?.name === '전자'
  ).slice(0, 3);
  const cosmeticsProducts = safeProducts.filter(p => 
    p.category?.slug === 'cosmetics' || 
    p.category?.name === '화장품' ||
    p.category?.name === '뷰티'
  ).slice(0, 3);
  const miscellaneousProducts = safeProducts.filter(p => 
    p.category?.slug === 'miscellaneous' || 
    p.category?.name === '잡화' ||
    p.category?.name === '기타'
  ).slice(0, 3);
  const sportsProducts = safeProducts.filter(p => 
    p.category?.slug === 'sports' || 
    p.category?.name === '스포츠용품' ||
    p.category?.name === '스포츠'
  ).slice(0, 3);
  const allProducts = safeProducts.slice(0, 6); // 전체 상품 중 6개

  // Top10 상품 - weight가 1~10인 상품들을 순위별로 정렬
  const top10Products = safeProducts
    .filter(p => p.weight && p.weight > 0 && p.weight <= 10)
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .slice(0, 10);

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
      }
    },
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

      {/* MD's Pick Section - 스크롤 가능한 그리드 */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">MD's Pick</h2>
            <p className="text-base sm:text-lg text-gray-600">엄선된 프리미엄 제품들을 만나보세요</p>
          </div>
          {mdPicks.length > 0 ? (
            <div className="relative">
              {/* 스크롤 가능한 상품 그리드 */}
              <div ref={scrollContainerRef} className="horizontal-scroll">
                <div className="flex gap-4 sm:gap-6 lg:gap-8 pb-4" style={{ width: 'max-content' }}>
                  {mdPicks.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-80 sm:w-96">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 스크롤 힌트 */}
              {mdPicks.length > 3 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">← 좌우로 스크롤하여 더 많은 상품을 확인하세요 →</p>
                </div>
              )}
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
          
          {/* 전체상품 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">전체상품</h3>
              <Link href="/category/all" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {allProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">상품이 없습니다.</p>
              </div>
            )}
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


          {/* 전자제품 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
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

          {/* 화장품 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">화장품</h3>
              <Link href="/category/cosmetics" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {cosmeticsProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {cosmeticsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">화장품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 잡화 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">잡화</h3>
              <Link href="/category/miscellaneous" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {miscellaneousProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {miscellaneousProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">잡화가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 스포츠용품 */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">스포츠용품</h3>
              <Link href="/category/sports" className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {sportsProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {sportsProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">스포츠용품이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      
    </div>
  );
}
