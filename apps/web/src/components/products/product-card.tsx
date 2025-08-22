'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ShoppingCart, Eye } from 'lucide-react';

interface Product {
  id: string;
  name: string;
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
  // Mock user role - in real app, get from context/state
  const userRole = 'CONSUMER';
  
  // Show consumer price by default for MVP
  const displayPrice = product.priceB2C;
  const priceLabel = '일반 가격';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">이미지</span>
        </div>
        <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.category}</p>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {product.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{priceLabel}</span>
            <span className="text-lg font-bold text-primary">
              {displayPrice.toLocaleString()}원
            </span>
          </div>

        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </Button>
          </Link>
          <Button size="sm" className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            장바구니
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
