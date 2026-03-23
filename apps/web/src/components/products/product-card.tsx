'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Package, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { wishlistApi } from '@/lib/api/wishlist';
import { cartApi } from '@/lib/api/cart';
import { useToast, toast } from '@/components/ui/toast';
import { getProductMainImageUrl, getOptimizedImageUrl } from '@/lib/utils/image';
import { formatPriceWithCurrency } from '@/lib/utils/price';
import Image from 'next/image';

import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // 찜하기 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, product.id]);

  const checkWishlistStatus = async () => {
    try {
      const status = await wishlistApi.checkWishlistStatus(product.id);
      setIsWishlisted(status);
    } catch (error) {
      console.error('찜하기 상태 확인 실패:', error);
    }
  };

  // 찜하기 토글
  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!isAuthenticated) {
      showToast(toast.warning('로그인 필요', '로그인이 필요한 서비스입니다.'));
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist({ productId: product.id });
        setIsWishlisted(false);
      } else {
        await wishlistApi.addToWishlist({ productId: product.id });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('찜하기 토글 실패:', error);
      showToast(toast.error('찜하기 실패', '찜하기 처리에 실패했습니다.'));
    } finally {
      setWishlistLoading(false);
    }
  };

  // 장바구니 추가
  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!isAuthenticated) {
      showToast(toast.warning('로그인 필요', '로그인이 필요한 서비스입니다.'));
      return;
    }

    if (!user?.id) {
      showToast(toast.warning('사용자 정보 로딩', '사용자 정보를 불러오는 중입니다.'));
      return;
    }

    // 재고 확인
    if (product.stockQuantity <= 0) {
      showToast(toast.error('품절', '현재 재고가 없어 구매할 수 없습니다.'));
      return;
    }

    setCartLoading(true);
    try {
      await cartApi.addToCart({
        productId: product.id,
        quantity: 1
      });
      showToast(toast.success('장바구니 추가', '상품이 장바구니에 추가되었습니다!'));
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      showToast(toast.error('장바구니 추가 실패', '장바구니 추가에 실패했습니다.'));
    } finally {
      setCartLoading(false);
    }
  };

  // 바로 결제하기
  const handleDirectPayment = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!isAuthenticated) {
      showToast(toast.warning('로그인 필요', '로그인이 필요한 서비스입니다.'));
      return;
    }

    if (product.stockQuantity <= 0) {
      showToast(toast.error('품절', '현재 품절된 상품입니다.'));
      return;
    }

    try {
      // 상품 상세 정보를 가져와서 실제 이미지 URL을 얻습니다
      const response = await fetch(`https://feedbackmall.com/api/v1/products/${product.id}`);
      let actualImageUrl = getProductMainImageUrl(product.images);
      
      if (response.ok) {
        const productDetail = await response.json();
        if (productDetail.success && productDetail.data) {
          actualImageUrl = getProductMainImageUrl(productDetail.data.images);
        }
      }

      // 상품 정보를 URL 파라미터로 전달하여 결제 페이지로 이동
      const salePrice = user?.role === 'BIZ' ? product.priceB2B : product.priceB2C;
      const productData = {
        id: product.id,
        name: product.name,
        price: salePrice,
        comparePrice: product.comparePrice ?? null,
        quantity: 1,
        image: actualImageUrl,
      };

      // 디버깅을 위한 로그
      // console.log('Product data for checkout:', {
      //   productId: product.id,
      //   productName: product.name,
      //   productImages: product.images,
      //   actualImageUrl: actualImageUrl
      // });

      const queryParams = new URLSearchParams({
        product: JSON.stringify(productData)
      });

      window.location.href = `/checkout?${queryParams.toString()}`;
    } catch (error) {
      console.error('상품 정보 가져오기 실패:', error);
      showToast(toast.error('오류', '상품 정보를 가져오는 중 오류가 발생했습니다.'));
    }
  };
  
  // 가격 표시 로직
  const getPriceDisplay = () => {
    if (loading) {
      return { text: '연결 중...', price: null };
    }
    
    if (!isAuthenticated) {
      return { text: '로그인 후 가격 확인', price: null };
    }
    
    if (user?.role === 'BIZ') {
      return { 
        text: '기업전용가격', 
        price: formatPriceWithCurrency(product.priceB2B)
      };
    } else {
      return { 
        text: '회원가격', 
        price: formatPriceWithCurrency(product.priceB2C)
      };
    }
  };

  const priceDisplay = getPriceDisplay();

  // 가격을 숫자로 변환
  const priceB2BNum = typeof product.priceB2B === 'string' ? parseFloat(product.priceB2B) : product.priceB2B;
  const priceB2CNum = typeof product.priceB2C === 'string' ? parseFloat(product.priceB2C) : product.priceB2C;
  const comparePriceNum = typeof product.comparePrice === 'string' ? parseFloat(product.comparePrice) : product.comparePrice;
  const currentPriceNum = user?.role === 'BIZ' ? priceB2BNum : priceB2CNum;

  // 디버깅을 위한 로그
  // console.log('Product price data:', {
  //   productId: product.id,
  //   productName: product.name,
  //   priceB2B: product.priceB2B,
  //   priceB2C: product.priceB2C,
  //   comparePrice: product.comparePrice,
  //   userRole: user?.role,
  //   currentPrice: currentPriceNum,
  //   shouldShowComparePrice: comparePriceNum &&
  //                           comparePriceNum > 0 &&
  //                           comparePriceNum > currentPriceNum
  // });

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-wishlist-heart]')) {
      return;
    }
    window.location.href = `/products/${product.id}`;
  };

  return (
    <Card 
      className="h-full flex flex-col border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-lg overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
        <CardHeader className="pb-2 sm:pb-3 p-0">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 mb-2 sm:mb-3 flex items-center justify-center relative overflow-hidden">
            {/* 로딩 스피너 */}
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* 상품 이미지 표시 */}
            <Image
              src={getOptimizedImageUrl(getProductMainImageUrl(product.images), 400, 400, 80)}
              alt={product.name}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setImageLoading(false);
                setImageError(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* 에러 상태일 때 기본 이미지 표시 */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* 찜하기 — 이미지 우상단 (카드 클릭과 분리) */}
            <button
              type="button"
              data-wishlist-heart
              className="absolute top-2 right-2 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white hover:ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-60"
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              aria-label={isWishlisted ? '찜 해제' : '찜하기'}
              aria-pressed={isWishlisted}
            >
              <Heart
                className={`h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5 shrink-0 transition-colors ${
                  isWishlisted
                    ? 'fill-[#FF6F0F] text-[#FF6F0F]'
                    : 'fill-transparent text-gray-700'
                }`}
                strokeWidth={2}
              />
            </button>

            {/* 브랜드 배지 */}
            {product.brand && (
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full max-w-[calc(100%-5rem)]">
                <span className="text-xs font-semibold text-gray-700 truncate block">{product.brand}</span>
              </div>
            )}

            {/* 품절 배지 — 하트와 겹치지 않도록 우측 하단 쪽 */}
            {product.stockQuantity <= 0 && (
              <div className="absolute bottom-2 right-2 z-20 bg-red-500 text-white px-2 py-1 rounded-full shadow-sm">
                <span className="text-xs font-semibold">품절</span>
              </div>
            )}
          </div>
          <div className="px-3 sm:px-4">
            <CardTitle className="text-sm font-medium text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
              {product.name}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 px-3 sm:px-4 pb-2 sm:pb-3 cursor-pointer">
          <div className="space-y-2 min-w-0">
            {/* 한 행: 네이버 가격 + comparePrice (잘리지 않도록 줄바꿈 허용) */}
            <div className="flex w-full min-w-0 items-start justify-between gap-2 sm:gap-2.5">
              <span className="shrink-0 pt-0.5 text-[10px] font-medium leading-tight text-gray-500 sm:text-[11px]">
                네이버 가격
              </span>
              <span
                className={`min-w-0 max-w-[72%] break-words text-right text-[11px] tabular-nums leading-snug [overflow-wrap:anywhere] sm:max-w-[75%] sm:text-xs ${
                  comparePriceNum &&
                  comparePriceNum > 0 &&
                  comparePriceNum > currentPriceNum
                    ? 'text-red-600 line-through'
                    : 'text-gray-400'
                }`}
              >
                {comparePriceNum &&
                comparePriceNum > 0 &&
                comparePriceNum > currentPriceNum
                  ? formatPriceWithCurrency(comparePriceNum)
                  : '—'}
              </span>
            </div>
            {/* 한 행: 회원가격 + priceB2C / 기업가 */}
            <div className="flex w-full min-w-0 items-start justify-between gap-2 sm:gap-2.5">
              <span className="shrink-0 pt-0.5 text-[10px] font-semibold leading-tight text-gray-800 sm:text-[11px]">
                {user?.role === 'BIZ' ? '기업전용가' : '회원가격'}
              </span>
              <span
                className="min-w-0 max-w-[72%] break-words text-right text-[13px] font-extrabold tabular-nums leading-snug text-[#FF6F0F] [overflow-wrap:anywhere] sm:max-w-[75%] sm:text-[15px]"
              >
                {priceDisplay.price ? (
                  priceDisplay.price
                ) : (
                  <span className="font-normal text-gray-400">{priceDisplay.text}</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-2 sm:px-4 pb-3 sm:pb-4 min-w-0">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 w-full min-w-0">
            <Button
              className={`w-full min-w-0 min-h-[44px] h-auto inline-flex items-center justify-center gap-0 px-2 sm:px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm md:text-base font-semibold leading-none whitespace-nowrap text-center ${
                product.stockQuantity <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              onClick={addToCart}
              disabled={cartLoading || product.stockQuantity <= 0}
            >
              {cartLoading ? '추가 중…' : product.stockQuantity <= 0 ? '품절' : '장바구니'}
            </Button>
            <Button
              className={`w-full min-w-0 min-h-[44px] h-auto inline-flex items-center justify-center gap-0 px-2 sm:px-3 py-2.5 sm:py-3 text-[13px] sm:text-sm md:text-base font-semibold leading-none whitespace-nowrap text-center ${
                product.stockQuantity <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#FF6F0F] text-white hover:bg-[#E5640D]'
              }`}
              onClick={handleDirectPayment}
              disabled={product.stockQuantity <= 0}
            >
              {product.stockQuantity <= 0 ? '품절' : '결제하기'}
            </Button>
          </div>
        </CardFooter>
    </Card>
  );
}
