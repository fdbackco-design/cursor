'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/products/product-card';

// Mock data for demonstration
const mockProducts = [
  {
    id: '1',
    name: '스마트폰',
    brand: 'TechBrand',
    description: '최신 기술이 적용된 스마트폰입니다',
    priceB2B: 800000,
    priceB2C: 1000000,
    images: ['/images/phone.jpg'],
    sku: 'PHONE-001',
    categoryId: 'electronics',
    isActive: true,
    isFeatured: true,
    stockQuantity: 100,
    tags: ['전자제품', '스마트폰', '모바일'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: '기본 티셔츠',
    brand: 'FashionBrand',
    description: '편안하고 스타일리시한 기본 티셔츠입니다',
    priceB2B: 15000,
    priceB2C: 25000,
    images: ['/images/tshirt.jpg'],
    sku: 'TSHIRT-001',
    categoryId: 'clothing',
    isActive: true,
    isFeatured: false,
    stockQuantity: 200,
    tags: ['의류', '티셔츠', '기본'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: '노트북',
    brand: 'TechBrand',
    description: '업무와 학습에 최적화된 노트북입니다',
    priceB2B: 1200000,
    priceB2C: 1500000,
    images: ['/images/laptop.jpg'],
    sku: 'LAPTOP-001',
    categoryId: 'electronics',
    isActive: true,
    isFeatured: true,
    stockQuantity: 50,
    tags: ['전자제품', '노트북', '컴퓨터'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ProductsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트 (현재 URL을 쿼리 파라미터로 전달)
    if (!isAuthenticated || !user) {
      const currentUrl = window.location.pathname;
      router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">상품 목록</h1>
        <p className="text-muted-foreground">
          다양한 상품을 둘러보고 최적의 가격으로 구매하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
