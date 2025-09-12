'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ShoppingCart, Package, Heart, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { wishlistApi } from '@/lib/api/wishlist';
import { cartApi } from '@/lib/api/cart';
import { useToast, toast } from '@/components/ui/toast';
import { getProductMainImageUrl } from '@/lib/utils/image';
import { formatPriceWithCurrency } from '@/lib/utils/price';

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
      const productData = {
        id: product.id,
        name: product.name,
        price: user?.role === 'BIZ' ? product.priceB2B : product.priceB2C,
        quantity: 1,
        image: actualImageUrl
      };

      // 디버깅을 위한 로그
      console.log('Product data for checkout:', {
        productId: product.id,
        productName: product.name,
        productImages: product.images,
        actualImageUrl: actualImageUrl
      });

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
        text: '기업전용 가격', 
        price: formatPriceWithCurrency(product.priceB2B)
      };
    } else {
      return { 
        text: '회원 가격', 
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
  console.log('Product price data:', {
    productId: product.id,
    productName: product.name,
    priceB2B: product.priceB2B,
    priceB2C: product.priceB2C,
    comparePrice: product.comparePrice,
    userRole: user?.role,
    currentPrice: currentPriceNum,
    shouldShowComparePrice: comparePriceNum &&
                            comparePriceNum > 0 &&
                            comparePriceNum > currentPriceNum
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // 버튼 영역 클릭이 아닌 경우에만 상품 상세로 이동
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
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
            {/* 상품 이미지 표시 */}
            <img
              src={getProductMainImageUrl(product.images)} // S3 이미지 지원
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                e.currentTarget.src = '/images/placeholder-product.jpg';
              }}
            />
            
            
            {/* 브랜드 배지 */}
            {product.brand && (
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <span className="text-xs font-semibold text-gray-700">{product.brand}</span>
              </div>
            )}
            
            {/* 품절 배지 */}
            {product.stockQuantity <= 0 && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-500 text-white px-2 py-1 rounded-full">
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
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 sm:mb-4 line-clamp-2">
            {product.description}
          </p>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-600">{priceDisplay.text}</span>
              <div className="flex items-center gap-1">
                {priceDisplay.price ? (
                  <span className="text-sm sm:text-base font-extrabold text-gray-900">
                    {priceDisplay.price}
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm text-gray-400">
                    {priceDisplay.text}
                  </span>
                )}
                {comparePriceNum && 
                 comparePriceNum > 0 && 
                 comparePriceNum > currentPriceNum && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPriceWithCurrency(comparePriceNum)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-2 sm:px-4 pb-3 sm:pb-4">
          {/* 모바일: 세로 배치, 태블릿: 2열, 데스크톱: 3열 */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 w-full">
            <Button 
              size="sm" 
              variant="outline"
              className={`w-full border-gray-300 hover:border-red-500 transition-colors duration-200 text-xs ${
                isWishlisted ? 'text-red-500 border-red-500' : 'text-gray-700'
              }`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
            >
              <Heart 
                className={`h-3 w-3 mr-1 ${isWishlisted ? 'fill-current' : ''}`} 
              />
              <span className="hidden xs:inline">
                {wishlistLoading ? '처리중...' : (isWishlisted ? '찜됨' : '찜하기')}
              </span>
              <span className="xs:hidden">찜</span>
            </Button>
            <Button 
              size="sm" 
              className={`w-full text-xs ${
                product.stockQuantity <= 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
              onClick={addToCart}
              disabled={cartLoading || product.stockQuantity <= 0}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">
                {cartLoading ? '추가중...' : product.stockQuantity <= 0 ? '품절' : '장바구니'}
              </span>
              <span className="xs:hidden">
                {cartLoading ? '추가중...' : product.stockQuantity <= 0 ? '품절' : '장바구니'}
              </span>
            </Button>
            <Button 
              size="sm" 
              className={`w-full sm:col-span-2 lg:col-span-1 text-xs ${
                product.stockQuantity <= 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleDirectPayment}
              disabled={product.stockQuantity <= 0}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">
                {product.stockQuantity <= 0 ? '품절' : '결제하기'}
              </span>
              <span className="xs:hidden">
                {product.stockQuantity <= 0 ? '품절' : '결제'}
              </span>
            </Button>
          </div>
        </CardFooter>
    </Card>
  );
}
