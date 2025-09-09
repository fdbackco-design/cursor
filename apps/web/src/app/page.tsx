'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';
import { Search, Target, User, Truck, ShoppingCart } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// 디자인 JSON에 맞는 상품 데이터
const mdPicks = [
  {
    id: '1',
    name: '냄비 3종 세트',
    brand: '아슬란',
    description: '프리미엄 스테인리스 냄비 3종 세트',
    priceB2B: 120000,
    priceB2C: 150000,
    images: ['/images/cookware-set.jpg'],
    sku: 'COOKWARE-001',
    categoryId: 'kitchen',
    isActive: true,
    isFeatured: true,
    stockQuantity: 50,
    tags: ['주방용품', '냄비', '세트'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: '무선청소기',
    brand: 'Hoid',
    description: '호이드 오브제 무선청소기',
    priceB2B: 1200000,
    priceB2C: 1490000,
    images: ['/images/vacuum.jpg'],
    sku: 'VACUUM-001',
    categoryId: 'appliances',
    isActive: true,
    isFeatured: true,
    stockQuantity: 30,
    tags: ['생활가전', '청소기', '무선'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: '공기청정기',
    brand: 'Hoid',
    description: '프리미엄 공기청정기',
    priceB2B: 250000,
    priceB2C: 300000,
    images: ['/images/air-purifier.jpg'],
    sku: 'AIRPURIFIER-001',
    categoryId: 'appliances',
    isActive: true,
    isFeatured: true,
    stockQuantity: 25,
    tags: ['생활가전', '공기청정기', '환경'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const homeAppliances = [
  {
    id: '4',
    name: '냄비 3종 세트',
    brand: '아슬란',
    description: '프리미엄 스테인리스 냄비 3종 세트',
    priceB2B: 120000,
    priceB2C: 150000,
    images: ['/images/cookware-set.jpg'],
    sku: 'COOKWARE-002',
    categoryId: 'kitchen',
    isActive: true,
    isFeatured: false,
    stockQuantity: 40,
    tags: ['주방용품', '냄비', '세트'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: '무선청소기',
    brand: 'Hoid',
    description: '호이드 오브제 무선청소기',
    priceB2B: 1200000,
    priceB2C: 1490000,
    images: ['/images/vacuum.jpg'],
    sku: 'VACUUM-002',
    categoryId: 'appliances',
    isActive: true,
    isFeatured: false,
    stockQuantity: 20,
    tags: ['생활가전', '청소기', '무선'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: '공기청정기',
    brand: 'Hoid',
    description: '프리미엄 공기청정기',
    priceB2B: 250000,
    priceB2C: 300000,
    images: ['/images/air-purifier.jpg'],
    sku: 'AIRPURIFIER-002',
    categoryId: 'appliances',
    isActive: true,
    isFeatured: false,
    stockQuantity: 15,
    tags: ['생활가전', '공기청정기', '환경'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }
    
    // 로그인하고 승인된 사용자는 홈 페이지로 리다이렉트
    if (isAuthenticated && user && user.approve) {
      router.push('/home');
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[280px] sm:h-[320px] md:h-[380px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg mx-3 sm:mx-6 my-3 sm:my-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/60 z-10"></div>
        {/* 배경 이미지가 없을 때를 대비한 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:15px_15px] sm:bg-[length:20px_20px]"></div>
        </div>
        <div className="relative z-20 h-full flex items-center px-4 sm:px-6">
          <div className="max-w-2xl w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4 drop-shadow-lg">
              호이드 오브제<br />
              무선청소기 출시
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-6 sm:mb-8 drop-shadow-md">
              당신의 일상을 품격있게 청소하다
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-sm sm:text-base w-full sm:w-auto">
                자세히 보기
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base w-full sm:w-auto">
                구매하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* MD 추천 상품 Section */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-12">
            <Target className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">MD 추천 상품</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mdPicks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 생활가전 Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900">생활가전</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeAppliances.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
