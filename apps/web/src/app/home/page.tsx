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
import Head from 'next/head';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
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
  

  
  // length 순서대로 정렬된 상품들 (홈페이지 노출 순서 관리에서 설정된 순서)
  const sortedProducts = safeProducts.sort((a, b) => {
    // length 값이 있는 상품들을 먼저 정렬 (오름차순)
    if (a.length && b.length) {
      return a.length - b.length;
    }
    if (a.length && !b.length) return -1;
    if (!a.length && b.length) return 1;
    
    // length 값이 없는 상품들은 createdAt 기준 내림차순
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // MD's Pick 상품들을 width 순서대로 정렬
  const mdPicks = safeProducts
    .filter(p => p.isFeatured)
    .sort((a, b) => {
      // width 값이 있는 상품들을 먼저 정렬 (오름차순)
      if (a.width && b.width) {
        // Decimal 타입인지 확인하고 안전하게 변환
        const aWidth = typeof a.width === 'number' ? a.width : 
          (a.width && typeof a.width === 'object' && 'toNumber' in a.width) ? 
            (a.width as any).toNumber() : Number(a.width);
        const bWidth = typeof b.width === 'number' ? b.width : 
          (b.width && typeof b.width === 'object' && 'toNumber' in b.width) ? 
            (b.width as any).toNumber() : Number(b.width);
        return aWidth - bWidth;
      }
      if (a.width && !b.width) return -1;
      if (!a.width && b.width) return 1;
      
      // width 값이 없는 상품들은 createdAt 기준 내림차순
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 디버깅: MD's Pick 정렬 결과 확인
  // console.log('MD\'s Pick 정렬 결과:', mdPicks.map(p => {
  //   const widthValue = p.width ? 
  //     (typeof p.width === 'number' ? p.width : 
  //       (p.width && typeof p.width === 'object' && 'toNumber' in p.width) ? 
  //         (p.width as any).toNumber() : Number(p.width)) : null;
    
  //   return {
  //     id: p.id,
  //     name: p.name,
  //     width: p.width,
  //     widthType: typeof p.width,
  //     widthValue: widthValue
  //   };
  // }));
  const allProducts = sortedProducts.slice(0, 6); // 전체 상품 중 6개

  // Top10 상품 - weight가 1~10인 상품들을 순위별로 정렬
  const top10Products = safeProducts
    .filter(p => p.weight && p.weight > 0 && p.weight <= 10)
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .slice(0, 10);

  // 배너 데이터 로드
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch('/api/admin/banners', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const bannerSlides = data.data.map((banner: any) => ({
              id: banner.id,
              image: banner.image,
              title: banner.title.replace(/\n/g, '<br />'),
              subtitle: '',
              description: banner.description,
              primaryButton: {
                text: banner.buttonText || '상품 둘러보기',
                onClick: () => router.push(banner.buttonLink || '/products')
              }
            }));
            setBanners(bannerSlides);
          } else {
            // 배너가 없으면 기본 배너 사용
            setBanners([
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
              }
            ]);
          }
        } else {
          // 에러 시 기본 배너 사용
          setBanners([
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
            }
          ]);
        }
      } catch (error) {
        console.error('배너 로드 실패:', error);
        // 에러 시 기본 배너 사용
        setBanners([
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
          }
        ]);
      }
    };

    loadBanners();
  }, [router]);

  // 슬라이더 데이터
  const heroSlides = banners.length > 0 ? banners : [
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
    <>
      <Head>
        <title>FeedbackMall - 프리미엄 쇼핑몰</title>
        <meta name="description" content="프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요" />
        <meta property="og:title" content="FeedbackMall - 프리미엄 쇼핑몰" />
        <meta property="og:description" content="프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요" />
        <meta property="og:image" content="https://feedbackmall.com/images/feedbackmall.png" />
        <meta property="og:url" content="https://feedbackmall.com/home" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="FeedbackMall" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FeedbackMall - 프리미엄 쇼핑몰" />
        <meta name="twitter:description" content="프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요" />
        <meta name="twitter:image" content="https://feedbackmall.com/images/feedbackmall.png" />
      </Head>
      <div className="min-h-screen bg-white">
      {/* Hero Slider Section */}
      <ImageSlider
        slides={heroSlides}
        autoPlay={true}
        autoPlayInterval={5000}
        showDots={true}
        showArrows={true}
        className=""
      />

      {/* 한정수량 Section */}
      {top10Products.length > 0 && (
        <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-orange-500 mr-3"></span>
                3월달 한정수량
              </h2>
              <p className="text-base sm:text-lg text-gray-600">한달간 한정 수량으로 판매되는 상품들을 만나보세요</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {top10Products.slice(0, 8).map((product) => (
                <div key={product.id} className="relative group">
                  {/* 순위 배지 */}
                  <div className="absolute -top-2 -left-2 z-10">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <div className="text-lg font-black">{product.weight}</div>
                      </div>
                    </div>
                    {/* 순위별 특별 아이콘 */}
                    {product.weight === 1 && (
                      <div className="absolute -top-1 -right-1 text-lg">👑</div>
                    )}
                    {product.weight === 2 && (
                      <div className="absolute -top-1 -right-1 text-lg">🥈</div>
                    )}
                    {product.weight === 3 && (
                      <div className="absolute -top-1 -right-1 text-lg">🥉</div>
                    )}
                  </div>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link 
                href="/category/top10" 
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors duration-200"
              >
                전체 한정수량 제품 보기 →
              </Link>
            </div>
          </div>
        </section>
      )}

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

      {/* Category Sections - 3월 한정: 3월달 한정수량, 전체상품만 */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">상품 둘러보기</h2>
            <p className="text-base sm:text-lg text-gray-600">3월 한정 상품과 전체 상품을 확인해보세요</p>
          </div>
          
          {/* 3월달 한정수량 */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">3월달 한정수량</h3>
              <Link href="/category/top10" className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base">
                더보기 →
              </Link>
            </div>
            {top10Products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {top10Products.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500">3월달 한정수량 상품이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 전체상품 */}
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">전체상품</h3>
              <Link href="/category/all" className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base">
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
        </div>
      </section>

      
      </div>
    </>
  );
}
