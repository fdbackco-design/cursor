const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addElectronicsCategory() {
  try {
    //console.log('전자제품 카테고리 추가 중...');
    
    // 전자제품 카테고리가 이미 있는지 확인
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: '전자제품' },
          { slug: 'electronics' }
        ]
      }
    });

    if (existingCategory) {
      //console.log('전자제품 카테고리가 이미 존재합니다:', existingCategory);
      return;
    }

    // 전자제품 카테고리 생성
    const electronicsCategory = await prisma.category.create({
      data: {
        name: '전자제품',
        slug: 'electronics',
        description: '스마트폰, 노트북, 태블릿 등 전자제품',
        isActive: true
      }
    });

    //console.log('전자제품 카테고리가 성공적으로 추가되었습니다:', electronicsCategory);

    // 샘플 전자제품 추가
    const sampleProducts = [
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

    //console.log('샘플 전자제품 추가 중...');
    
    for (const productData of sampleProducts) {
      const product = await prisma.product.create({
        data: productData
      });
      //console.log(`상품 추가됨: ${product.name}`);
    }

    //console.log('전자제품 카테고리와 샘플 상품이 성공적으로 추가되었습니다!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addElectronicsCategory();
