const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreElectronicsProducts() {
  try {
    // 전자제품 카테고리 찾기
    const electronicsCategory = await prisma.category.findFirst({
      where: { name: '전자제품' }
    });
    
    if (!electronicsCategory) {
      //'전자제품 카테고리를 찾을 수 없습니다.');
      return;
    }
    
    // 추가 전자제품 상품들
    const additionalProducts = [
      {
        name: 'iPhone 15 Pro',
        description: 'Apple의 최신 스마트폰',
        shortDescription: '프로급 카메라와 A17 Pro 칩셋',
        priceB2B: 1200000,
        priceB2C: 1500000,
        comparePrice: 1600000,
        sku: 'IPHONE15PRO-001',
        categoryId: electronicsCategory.id,
        isActive: true,
        isFeatured: true,
        stockQuantity: 50,
        lowStockThreshold: 10,
        images: ['/images/iphone15pro.jpg'],
        tags: ['스마트폰', 'Apple', '프리미엄'],
        metadata: { brand: 'Apple', model: 'iPhone 15 Pro' }
      },
      {
        name: 'MacBook Air M3',
        description: 'Apple의 초경량 노트북',
        shortDescription: 'M3 칩셋으로 더욱 강력해진 성능',
        priceB2B: 1500000,
        priceB2C: 1800000,
        comparePrice: 2000000,
        sku: 'MACBOOKAIR-M3-001',
        categoryId: electronicsCategory.id,
        isActive: true,
        isFeatured: true,
        stockQuantity: 30,
        lowStockThreshold: 5,
        images: ['/images/macbookair-m3.jpg'],
        tags: ['노트북', 'Apple', 'M3'],
        metadata: { brand: 'Apple', model: 'MacBook Air M3' }
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: '삼성의 플래그십 스마트폰',
        shortDescription: 'AI 기능이 강화된 갤럭시 S24 Ultra',
        priceB2B: 1300000,
        priceB2C: 1600000,
        comparePrice: 1700000,
        sku: 'GALAXY-S24-ULTRA-001',
        categoryId: electronicsCategory.id,
        isActive: true,
        isFeatured: false,
        stockQuantity: 40,
        lowStockThreshold: 8,
        images: ['/images/galaxy-s24-ultra.jpg'],
        tags: ['스마트폰', 'Samsung', 'AI'],
        metadata: { brand: 'Samsung', model: 'Galaxy S24 Ultra' }
      },
      {
        name: 'iPad Pro 12.9',
        description: 'Apple의 프로급 태블릿',
        shortDescription: 'M2 칩셋과 Liquid Retina XDR 디스플레이',
        priceB2B: 1000000,
        priceB2C: 1200000,
        comparePrice: 1300000,
        sku: 'IPAD-PRO-12.9-001',
        categoryId: electronicsCategory.id,
        isActive: true,
        isFeatured: false,
        stockQuantity: 25,
        lowStockThreshold: 5,
        images: ['/images/ipad-pro-12.9.jpg'],
        tags: ['태블릿', 'Apple', 'M2'],
        metadata: { brand: 'Apple', model: 'iPad Pro 12.9' }
      },
      {
        name: 'AirPods Pro 2세대',
        description: 'Apple의 프리미엄 무선 이어폰',
        shortDescription: '적응형 투명 모드와 공간 음향',
        priceB2B: 250000,
        priceB2C: 300000,
        comparePrice: 320000,
        sku: 'AIRPODS-PRO-2-001',
        categoryId: electronicsCategory.id,
        isActive: true,
        isFeatured: false,
        stockQuantity: 100,
        lowStockThreshold: 20,
        images: ['/images/airpods-pro-2.jpg'],
        tags: ['이어폰', 'Apple', '무선'],
        metadata: { brand: 'Apple', model: 'AirPods Pro 2세대' }
      }
    ];
    
    //console.log('추가 전자제품 상품 생성 중...');
    
    for (const productData of additionalProducts) {
      // 이미 존재하는지 확인
      const existingProduct = await prisma.product.findFirst({
        where: { sku: productData.sku }
      });
      
      if (!existingProduct) {
        const product = await prisma.product.create({
          data: productData
        });
        //console.log('상품 추가됨:', product.name);
      } else {
        //console.log('이미 존재하는 상품:', productData.name);
      }
    }
    
    //console.log('전자제품 상품 추가 완료!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreElectronicsProducts();
