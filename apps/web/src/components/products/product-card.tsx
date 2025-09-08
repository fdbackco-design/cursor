'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ShoppingCart, Package, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { wishlistApi } from '@/lib/api/wishlist';
import { cartApi } from '@/lib/api/cart';
import { useToast, toast } from '@/components/ui/toast';
import { getImageUrl } from '@/lib/utils/image';
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
        text: 'B2B 가격', 
        price: formatPriceWithCurrency(product.priceB2B)
      };
    } else {
      return { 
        text: '일반 가격', 
        price: formatPriceWithCurrency(product.priceB2C)
      };
    }
  };

  const priceDisplay = getPriceDisplay();

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
            {product.images && product.images.length > 0 && product.images[0] ? (
              <img
                src={getImageUrl(product.images[0])} // 첫 번째 이미지 사용
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <>
                {/* 이미지가 없을 때의 대체 디자인 */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-60"></div>
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-3 sm:p-4">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-1 sm:mb-2" />
                  <span className="text-xs text-gray-500 font-medium">이미지 준비중</span>
                </div>
              </>
            )}
            
            {/* 브랜드 배지 */}
            {product.brand && (
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <span className="text-xs font-semibold text-gray-700">{product.brand}</span>
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
              {priceDisplay.price ? (
                <span className="text-sm sm:text-base font-extrabold text-gray-900">
                  {priceDisplay.price}
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">
                  {priceDisplay.text}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex gap-1.5 sm:gap-2 w-full">
            <Button 
              size="sm" 
              variant="outline"
              className={`flex-1 border-gray-300 hover:border-red-500 transition-colors duration-200 text-xs sm:text-sm ${
                isWishlisted ? 'text-red-500 border-red-500' : 'text-gray-700'
              }`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
            >
              <Heart 
                className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isWishlisted ? 'fill-current' : ''}`} 
              />
              {wishlistLoading ? '처리중...' : (isWishlisted ? '찜됨' : '찜하기')}
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 text-xs sm:text-sm"
              onClick={addToCart}
              disabled={cartLoading}
            >
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              {cartLoading ? '추가중...' : '장바구니'}
            </Button>
          </div>
        </CardFooter>
    </Card>
  );
}
