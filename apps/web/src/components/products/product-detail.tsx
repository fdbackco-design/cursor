'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ShoppingCart, Heart, Share2, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  priceB2B: number;
  priceB2C: number;
  comparePrice?: number;
  images: string[];
  category: string;
  stockQuantity: number;
  tags: string[];
  isActive: boolean;
}

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Mock user role - in real app, get from context/state
  const userRole = 'CONSUMER';
  
  // Show consumer price by default for MVP
  const displayPrice = product.priceB2C;
  const priceLabel = '일반 가격';
  const discount = product.comparePrice ? Math.round(((product.comparePrice - displayPrice) / product.comparePrice) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground text-lg">이미지 {selectedImage + 1}</span>
        </div>
        
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm ${
                  selectedImage === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-muted-foreground">{product.category}</p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">
              {displayPrice.toLocaleString()}원
            </span>
            {discount > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                {discount}% 할인
              </span>
            )}
          </div>
          
          {product.comparePrice && (
            <p className="text-muted-foreground line-through">
              {product.comparePrice.toLocaleString()}원
            </p>
          )}
          
          <p className="text-sm text-muted-foreground">
            {priceLabel} • 재고: {product.stockQuantity}개
          </p>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">수량</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="w-16 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1">
            <ShoppingCart className="h-5 w-5 mr-2" />
            장바구니에 추가
          </Button>
          <Button variant="outline" size="lg">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary px-3 py-1 rounded-full text-sm text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Product Description */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>상품 설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
