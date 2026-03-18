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
import { getImageUrl } from '@/lib/utils/image';
import Head from 'next/head';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsApi.getProducts({ limit: 500 });
        if (response.success && response.data) {
          setProducts(response.data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
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

  // 카테고리별 상품 분류 (안전한 필터링)
  const safeProducts = Array.isArray(products) ? products : [];

  // Top10 상품 - weight가 1~10인 상품들을 순위별로 정렬
  const top10Products = safeProducts
    .filter(p => p.weight && p.weight > 0 && p.weight <= 10)
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .slice(0, 10);

  // 카테고리별 상품 (6개씩) - API category name과 표시명 매핑
  const CATEGORY_SECTIONS = [
    { key: '생활가전', label: '생활가전', href: '/category/home-appliances' },
    { key: '주방용품', label: '주방용품', href: '/category/kitchen' },
    { key: '화장품', label: '피부&미용', href: '/category/cosmetics' },
    { key: '잡화', label: '잡화', href: '/category/miscellaneous' },
    { key: '마사지기', label: '마사지기', href: '/category/massager' },
    { key: '침구류', label: '침구류', href: '/category/bedding' },
  ] as const;

  const getProductsByCategory = (categoryName: string) =>
    safeProducts
      .filter(p => p.category?.name === categoryName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

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
              link: banner.link || banner.buttonLink || '',
              openInNewTab: banner.openInNewTab ?? false,
            }));
            setBanners(bannerSlides);
          } else {
            // 배너가 없으면 기본 배너 사용
            setBanners([
              {
                id: 1,
                image: '/main/HOIDBanner.png',
                link: '/category/all',
                openInNewTab: false,
              }
            ]);
          }
        } else {
          // 에러 시 기본 배너 사용
          setBanners([
            {
              id: 1,
              image: '/main/HOIDBanner.png',
              link: '/category/all',
              openInNewTab: false,
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
            link: '/category/all',
            openInNewTab: false,
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
      link: '/category/all',
      openInNewTab: false,
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
                  <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 z-10">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <div className="text-sm sm:text-base lg:text-lg font-black">{product.weight}</div>
                      </div>
                    </div>
                    {/* 순위별 특별 아이콘 */}
                    {product.weight === 1 && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-sm sm:text-base lg:text-lg">👑</div>
                    )}
                    {product.weight === 2 && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-sm sm:text-base lg:text-lg">🥈</div>
                    )}
                    {product.weight === 3 && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-sm sm:text-base lg:text-lg">🥉</div>
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

      {/* Category Sections - 카테고리별 상품 6개씩 */}
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {CATEGORY_SECTIONS.map(({ key, label, href }) => {
            const categoryProducts = getProductsByCategory(key);
            return (
              <div key={key} className="mb-8 sm:mb-12 lg:mb-16 last:mb-0">
                <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{label}</h3>
                  <Link href={href} className="text-primary hover:text-primary/80 font-medium text-sm sm:text-base">
                    더보기 →
                  </Link>
                </div>
                {categoryProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500">{label} 상품이 없습니다.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      
      </div>
    </>
  );
}
