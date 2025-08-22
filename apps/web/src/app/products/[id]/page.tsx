import { ProductDetail } from '@/components/products/product-detail';

// Mock data for demonstration
const mockProduct = {
  id: '1',
  name: '스마트폰',
  description: '최신 기술이 적용된 스마트폰입니다. 고성능 프로세서와 고해상도 카메라를 탑재하여 사용자에게 최고의 경험을 제공합니다.',
  priceB2B: 800000,
  priceB2C: 1000000,
  comparePrice: 1200000,
  images: ['/images/phone1.jpg', '/images/phone2.jpg'],
  category: '전자제품',
  stockQuantity: 50,
  tags: ['스마트폰', '전자제품', '모바일'],
  isActive: true,
};

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  // In real app, fetch product data based on params.id
  const product = mockProduct;

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} />
    </div>
  );
}
