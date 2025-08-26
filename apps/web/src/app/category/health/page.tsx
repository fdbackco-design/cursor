import { ProductCard } from '@/components/products/product-card';

// 건강기능식품 상품 데이터
const healthProducts = [
  {
    id: '1',
    name: '프로바이오틱스',
    brand: '헬스케어',
    description: '장 건강을 위한 프로바이오틱스',
    priceB2B: 30000,
    priceB2C: 40000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '건강기능식품',
    isActive: true,
  },
  {
    id: '2',
    name: '오메가3',
    brand: '헬스케어',
    description: '순수 EPA/DHA 오메가3',
    priceB2B: 25000,
    priceB2C: 35000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '건강기능식품',
    isActive: true,
  },
  {
    id: '3',
    name: '비타민C',
    brand: '헬스케어',
    description: '고농축 비타민C',
    priceB2B: 15000,
    priceB2C: 20000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '건강기능식품',
    isActive: true,
  },
];

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">건강기능식품</h1>
            <p className="text-lg text-gray-600">건강한 삶을 위한 프리미엄 건강기능식품</p>
          </div>
        </div>
      </section>

      {/* 상품 목록 */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">건강기능식품 상품</h2>
            <p className="text-gray-600">총 {healthProducts.length}개의 상품</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
