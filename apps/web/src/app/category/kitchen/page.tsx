import { ProductCard } from '@/components/products/product-card';

// 주방용품 상품 데이터
const kitchenProducts = [
  {
    id: '1',
    name: '냄비 3종 세트',
    brand: '아슬란',
    description: '프리미엄 스테인리스 냄비 3종 세트',
    priceB2B: 120000,
    priceB2C: 150000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '주방용품',
    isActive: true,
  },
  {
    id: '2',
    name: '프라이팬',
    brand: '아슬란',
    description: '녹스틱 코팅 프라이팬',
    priceB2B: 60000,
    priceB2C: 75000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '주방용품',
    isActive: true,
  },
  {
    id: '3',
    name: '커피메이커',
    brand: 'Hoid',
    description: '드립 커피메이커',
    priceB2B: 40000,
    priceB2C: 50000,
    images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
    descriptionImages: [
      '/products/01.jpg',
      '/products/02.gif',
      '/products/03.jpg'
    ],
    category: '주방용품',
    isActive: true,
  },
];

export default function KitchenPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">주방용품</h1>
            <p className="text-lg text-gray-600">요리의 즐거움을 더해주는 주방용품</p>
          </div>
        </div>
      </section>

      {/* 상품 목록 */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">주방용품 상품</h2>
            <p className="text-gray-600">총 {kitchenProducts.length}개의 상품</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kitchenProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
