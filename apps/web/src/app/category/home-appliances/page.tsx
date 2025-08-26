import { ProductCard } from '@/components/products/product-card';

// 생활가전 상품 데이터
const homeAppliancesProducts = [
  {
    id: '1',
    name: '무선청소기',
    brand: 'Hoid',
    description: '호이드 오브제 무선청소기',
    priceB2B: 1200000,
    priceB2C: 1490000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '생활가전',
    isActive: true,
  },
  {
    id: '2',
    name: '공기청정기',
    brand: 'Hoid',
    description: '프리미엄 공기청정기',
    priceB2B: 250000,
    priceB2C: 300000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '생활가전',
    isActive: true,
  },
  {
    id: '3',
    name: '가습기',
    brand: 'Hoid',
    description: '초음파 가습기',
    priceB2B: 80000,
    priceB2C: 100000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '생활가전',
    isActive: true,
  },
];

export default function HomeAppliancesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">생활가전</h1>
            <p className="text-lg text-gray-600">편리하고 스마트한 생활을 위한 가전제품</p>
          </div>
        </div>
      </section>

      {/* 상품 목록 */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">생활가전 상품</h2>
            <p className="text-gray-600">총 {homeAppliancesProducts.length}개의 상품</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeAppliancesProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
