import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
  //console.log('상품 데이터 시드 시작...');

  // 카테고리 생성
  const homeAppliances = await prisma.category.upsert({
    where: { slug: 'home-appliances' },
    update: {},
    create: {
      name: '생활가전',
      slug: 'home-appliances',
      description: '일상생활에 필요한 가전제품',
    },
  });

  const kitchen = await prisma.category.upsert({
    where: { slug: 'kitchen' },
    update: {},
    create: {
      name: '주방용품',
      slug: 'kitchen',
      description: '주방에서 사용하는 다양한 용품',
    },
  });

  const health = await prisma.category.upsert({
    where: { slug: 'health' },
    update: {},
    create: {
      name: '건강기능식품',
      slug: 'health',
      description: '건강 증진을 위한 기능성 식품',
    },
  });

  // 벤더 생성
  const hoidVendor = await prisma.vendor.upsert({
    where: { code: 'HOID' },
    update: {},
    create: {
      name: 'Hoid',
      code: 'HOID',
      notes: { description: '프리미엄 생활가전 브랜드' },
    },
  });

  const aslanVendor = await prisma.vendor.upsert({
    where: { code: 'ASLAN' },
    update: {},
    create: {
      name: '아슬란',
      code: 'ASLAN',
      notes: { description: '고품질 주방용품 브랜드' },
    },
  });

  const healthVendor = await prisma.vendor.upsert({
    where: { code: 'HEALTH' },
    update: {},
    create: {
      name: '헬스케어',
      code: 'HEALTH',
      notes: { description: '건강기능식품 전문 브랜드' },
    },
  });

  // 상품 생성
  const products = [
    {
      name: '무선청소기',
      description: '호이드 오브제 무선청소기 - 강력한 흡입력과 긴 사용시간',
      shortDescription: '강력한 흡입력의 무선청소기',
      priceB2B: 1200000,
      priceB2C: 1490000,
      comparePrice: 1800000,
      sku: 'HOID-VC001',
      weight: 2.5,
      length: 30,
      width: 15,
      height: 120,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: homeAppliances.id,
      vendorId: hoidVendor.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 50,
      lowStockThreshold: 10,
      tags: ['무선', '청소기', '강력한흡입력'],
      metadata: { color: '블랙', battery: '60분' },
    },
    {
      name: '공기청정기',
      description: '프리미엄 공기청정기 - HEPA 필터로 깨끗한 공기',
      shortDescription: 'HEPA 필터 공기청정기',
      priceB2B: 250000,
      priceB2C: 300000,
      comparePrice: 350000,
      sku: 'HOID-AC001',
      weight: 8.0,
      length: 40,
      width: 25,
      height: 60,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: homeAppliances.id,
      vendorId: hoidVendor.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 30,
      lowStockThreshold: 5,
      tags: ['공기청정기', 'HEPA', '프리미엄'],
      metadata: { coverage: '50평', noise: '25dB' },
    },
    {
      name: '냄비 3종 세트',
      description: '프리미엄 스테인리스 냄비 3종 세트 - 열전도율이 뛰어난 주방용품',
      shortDescription: '스테인리스 냄비 3종 세트',
      priceB2B: 120000,
      priceB2C: 150000,
      comparePrice: 180000,
      sku: 'ASLAN-POT001',
      weight: 3.2,
      length: 28,
      width: 28,
      height: 12,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: kitchen.id,
      vendorId: aslanVendor.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 100,
      lowStockThreshold: 20,
      tags: ['냄비', '스테인리스', '3종세트'],
      metadata: { material: '스테인리스', size: '3종' },
    },
    {
      name: '프라이팬',
      description: '녹스틱 코팅 프라이팬 - 음식이 눌지 않는 특수 코팅',
      shortDescription: '녹스틱 코팅 프라이팬',
      priceB2B: 60000,
      priceB2C: 75000,
      comparePrice: 90000,
      sku: 'ASLAN-PAN001',
      weight: 1.8,
      length: 26,
      width: 26,
      height: 5,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: kitchen.id,
      vendorId: aslanVendor.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 80,
      lowStockThreshold: 15,
      tags: ['프라이팬', '녹스틱', '코팅'],
      metadata: { coating: '녹스틱', diameter: '26cm' },
    },
    {
      name: '커피메이커',
      description: '드립 커피메이커 - 완벽한 추출을 위한 온도 제어',
      shortDescription: '드립 커피메이커',
      priceB2B: 40000,
      priceB2C: 50000,
      comparePrice: 60000,
      sku: 'HOID-CM001',
      weight: 2.0,
      length: 25,
      width: 20,
      height: 35,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: kitchen.id,
      vendorId: hoidVendor.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 60,
      lowStockThreshold: 10,
      tags: ['커피메이커', '드립', '온도제어'],
      metadata: { capacity: '1.8L', temperature: '90-95°C' },
    },
    {
      name: '가습기',
      description: '초음파 가습기 - 조용하고 효율적인 가습',
      shortDescription: '초음파 가습기',
      priceB2B: 80000,
      priceB2C: 100000,
      comparePrice: 120000,
      sku: 'HOID-HUM001',
      weight: 1.5,
      length: 20,
      width: 20,
      height: 30,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: homeAppliances.id,
      vendorId: hoidVendor.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 40,
      lowStockThreshold: 8,
      tags: ['가습기', '초음파', '조용함'],
      metadata: { capacity: '4L', noise: '20dB' },
    },
    {
      name: '프로바이오틱스',
      description: '장 건강을 위한 프로바이오틱스 - 유산균 함유',
      shortDescription: '장 건강 프로바이오틱스',
      priceB2B: 30000,
      priceB2C: 40000,
      comparePrice: 50000,
      sku: 'HEALTH-PRO001',
      weight: 0.1,
      length: 8,
      width: 5,
      height: 15,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: health.id,
      vendorId: healthVendor.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 200,
      lowStockThreshold: 30,
      tags: ['프로바이오틱스', '유산균', '장건강'],
      metadata: { count: '100억개', form: '캡슐' },
    },
    {
      name: '오메가3',
      description: '순수 EPA/DHA 오메가3 - 심혈관 건강에 도움',
      shortDescription: 'EPA/DHA 오메가3',
      priceB2B: 25000,
      priceB2C: 35000,
      comparePrice: 45000,
      sku: 'HEALTH-OMG001',
      weight: 0.1,
      length: 8,
      width: 5,
      height: 15,
      images: ['/products/back1.jpg', '/products/back2.jpg', '/products/back3.jpg'],
      descriptionImages: ['/products/01.jpg', '/products/02.gif', '/products/03.jpg'],
      categoryId: health.id,
      vendorId: healthVendor.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 150,
      lowStockThreshold: 25,
      tags: ['오메가3', 'EPA', 'DHA'],
      metadata: { epa: '180mg', dha: '120mg', form: '캡슐' },
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });
  }

  console.log('상품 데이터 시드 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
