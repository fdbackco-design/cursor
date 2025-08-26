'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ShoppingCart, Package, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { wishlistApi } from '@/lib/api/wishlist';
import { cartApi } from '@/lib/api/cart';
import { getImageUrl } from '@/lib/utils/image';

import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user, isAuthenticated, loading } = useAuth();
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
      alert('로그인이 필요합니다.');
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
      alert('찜하기 처리에 실패했습니다.');
    } finally {
      setWishlistLoading(false);
    }
  };

  // 장바구니 추가
  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!user?.id) {
      alert('사용자 정보를 불러오는 중입니다.');
      return;
    }

    setCartLoading(true);
    try {
      await cartApi.addToCart({
        userId: user.id,
        productId: product.id,
        quantity: 1
      });
      alert('상품이 장바구니에 추가되었습니다!');
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert('장바구니 추가에 실패했습니다.');
    } finally {
      setCartLoading(false);
    }
  };
  
  // 가격 표시 로직
  const getPriceDisplay = () => {
    console.log('ProductCard - 가격 표시 로직:', { 
      loading, 
      isAuthenticated, 
      userRole: user?.role,
      productId: product.id,
      productName: product.name
    });
    
    if (loading) {
      return { text: '연결 중...', price: null };
    }
    
    if (!isAuthenticated) {
      console.log('ProductCard - 인증되지 않음, 가격 숨김');
      return { text: '로그인 후 가격 확인', price: null };
    }
    
    if (user?.role === 'BIZ') {
      console.log('ProductCard - B2B 사용자, B2B 가격 표시');
      return { 
        text: 'B2B 가격', 
        price: product.priceB2B.toLocaleString() + '원' 
      };
    } else {
      console.log('ProductCard - 일반 사용자, 일반 가격 표시');
      return { 
        text: '일반 가격', 
        price: product.priceB2C.toLocaleString() + '원' 
      };
    }
  };

  const priceDisplay = getPriceDisplay();

  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card className="h-full flex flex-col border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-lg overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-200 cursor-pointer group">
        <CardHeader className="pb-3 p-0">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 mb-3 flex items-center justify-center relative overflow-hidden">
            {/* 상품 이미지 표시 */}
            {product.images && product.images.length > 0 ? (
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
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
                  <Package className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 font-medium">이미지 준비중</span>
                </div>
              </>
            )}
            
            {/* 브랜드 배지 */}
            {product.brand && (
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <span className="text-xs font-semibold text-gray-700">{product.brand}</span>
              </div>
            )}
          </div>
          <div className="px-4">
            <CardTitle className="text-sm font-medium text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-200">
              {product.name}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 px-4 pb-3">
          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
            {product.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{priceDisplay.text}</span>
              {priceDisplay.price ? (
                <span className="text-base font-extrabold text-gray-900">
                  {priceDisplay.price}
                </span>
              ) : (
                <span className="text-sm text-gray-400">
                  {priceDisplay.text}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 px-4 pb-4">
          <div className="flex gap-2 w-full">
            <Button 
              size="sm" 
              variant="outline"
              className={`flex-1 border-gray-300 hover:border-red-500 transition-colors duration-200 ${
                isWishlisted ? 'text-red-500 border-red-500' : 'text-gray-700'
              }`}
              onClick={toggleWishlist}
              disabled={wishlistLoading}
            >
              <Heart 
                className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} 
              />
              {wishlistLoading ? '처리중...' : (isWishlisted ? '찜됨' : '찜하기')}
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
              onClick={addToCart}
              disabled={cartLoading}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {cartLoading ? '추가중...' : '장바구니'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
