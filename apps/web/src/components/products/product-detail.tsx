'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ShoppingCart, Heart, Share2, Star, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image';

import { Product } from '@/types/product';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // 이미지가 없거나 selectedImage가 범위를 벗어날 때 안전 처리
  const safeSelectedImage = product.images && product.images.length > 0 
    ? Math.min(selectedImage, product.images.length - 1) 
    : 0;
  
  // Mock user role - in real app, get from context/state
  const userRole = 'CONSUMER';
  
  // Show consumer price by default for MVP
  const displayPrice = product.priceB2C;
  const priceLabel = '일반 가격';
  const discount = product.comparePrice ? Math.round(((product.comparePrice - displayPrice) / product.comparePrice) * 100) : 0;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageSelect = (index: number) => {
    setSelectedImage(index);
    setImageLoading(true);
    setImageError(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
          {product.images && product.images.length > 0 ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">이미지를 불러올 수 없습니다</span>
                  </div>
                </div>
              ) : (
                <img
                  src={getImageUrl(product.images[safeSelectedImage])}
                  alt={`${product.name} 이미지 ${safeSelectedImage + 1}`}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <span className="text-muted-foreground text-sm">이미지 없음</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Images */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(index)}
                className={`w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                  safeSelectedImage === index ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`${product.name} 썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                          <p className="text-muted-foreground">{product.category?.name || '카테고리 없음'}</p>
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

      {/* Product Description Images */}
      {product.descriptionImages && product.descriptionImages.length > 0 && (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>상품 상세 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.descriptionImages.map((image, index) => (
                  <div key={index} className="w-full">
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} 상세 이미지 ${index + 1}`}
                      className="w-full h-auto rounded-lg shadow-sm"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
