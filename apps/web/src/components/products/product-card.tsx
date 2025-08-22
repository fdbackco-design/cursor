'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  priceB2B: number;
  priceB2C: number;
  images: string[];
  category: string;
  isActive: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user, loading } = useAuth();
  
  // 가격 표시 로직
  const getPriceDisplay = () => {
    if (loading) {
      return { text: '연결 중...', price: null };
    }
    
    if (!user?.isAuthenticated) {
      return { text: '로그인 후 가격 확인', price: null };
    }
    
    if (user.role === 'BIZ') {
      return { 
        text: 'B2B 가격', 
        price: product.priceB2B.toLocaleString() + '원' 
      };
    } else {
      return { 
        text: '일반 가격', 
        price: product.priceB2C.toLocaleString() + '원' 
      };
    }
  };

  const priceDisplay = getPriceDisplay();

  return (
    <Card className="h-full flex flex-col border-0 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-lg overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow duration-200">
      <CardHeader className="pb-3 p-0">
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 mb-3 flex items-center justify-center relative overflow-hidden">
          {/* 이미지가 없을 때의 대체 디자인 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
            <Package className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500 font-medium">이미지 준비중</span>
          </div>
          {/* 브랜드 배지 */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-xs font-semibold text-gray-700">{product.brand}</span>
          </div>
        </div>
        <div className="px-4">
          <CardTitle className="text-sm font-medium text-gray-900 leading-tight">
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
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900">
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </Button>
          </Link>
          <Button size="sm" className="flex-1 bg-gray-900 text-white hover:bg-gray-800">
            <ShoppingCart className="h-4 w-4 mr-2" />
            장바구니
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
