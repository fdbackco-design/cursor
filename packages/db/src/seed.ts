#!/usr/bin/env tsx

import { PrismaClient, UserRole, DiscountType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "example@naver.com" },
    update: {},
    create: {
      email: "example@naver.com",
      name: "관리자",
      approve: true,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // Create seller
  const seller = await prisma.seller.upsert({
    where: { phone: "02-1234-5678" },
    update: {},
    create: {
      userId: adminUser.id,
      companyName: "송도",
      representativeName: "홍길동",
      phone: "02-1234-5678",
      address: "서울시 강남구 테헤란로 123",
      isVerified: true,
      isActive: true,
    },
  });

  console.log("✅ Seller created:", seller.companyName);

  // Create referral code
  const referralCode = await prisma.referralCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      currentUses: 0,
      isActive: true,
      sellerId: seller.id,
    },
  });

  console.log("✅ Referral code created:", referralCode.code);

  // Create categories
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "전자제품",
      slug: "electronics",
      description: "다양한 전자제품을 만나보세요",
      isActive: true,
    },
  });

  const clothingCategory = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: {
      name: "의류",
      slug: "clothing",
      description: "스타일리시한 의류를 만나보세요",
      isActive: true,
    },
  });

  console.log("✅ Categories created");

  // 발주처 생성
  const vendor = await prisma.vendor.upsert({
    where: { code: "KLJ" },
    update: { name: "KLJ", isActive: true },
    create: { code: "KLJ", name: "KLJ" },
  });

  // Create products
  const product1 = await prisma.product.upsert({
    where: { sku: "ELEC-001" },
    update: {
      name: "호이드 무선청소기",
      description: "최신 기술이 적용된 가전제품입니다.",
      shortDescription: "최신 가전제품",
      priceB2B: 800000,
      priceB2C: 1000000,
      comparePrice: 1200000,
      weight: 180,
      length: 15,
      width: 7.5,
      height: 0.8,
      images: [
        "http://localhost:3000/products/back1.jpg",
        "http://localhost:3000/products/back2.jpg",
        "http://localhost:3000/products/back3.jpg",
      ],
      descriptionImages: [
        "http://localhost:3000/products/01.jpg",
        "http://localhost:3000/products/02.gif",
        "http://localhost:3000/products/03.jpg",
      ],
      categoryId: electronicsCategory.id,
      vendorId: vendor.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 50,
      lowStockThreshold: 10,
      tags: ["스마트폰", "전자제품", "모바일"],
      updatedAt: new Date(),
    },
    create: {
      name: "호이드 무선청소기",
      description: "최신 기술이 적용된 가전제품입니다.",
      shortDescription: "최신 가전제품",
      priceB2B: 800000,
      priceB2C: 1000000,
      comparePrice: 1200000,
      sku: "ELEC-001",
      weight: 180,
      length: 15,
      width: 7.5,
      height: 0.8,
      images: [
        "http://localhost:3000/products/back1.jpg",
        "http://localhost:3000/products/back2.jpg",
        "http://localhost:3000/products/back3.jpg"
      ],
      descriptionImages: [
        "http://localhost:3000/products/01.jpg", 
        "http://localhost:3000/products/02.gif", 
        "http://localhost:3000/products/03.jpg"
      ],
      categoryId: electronicsCategory.id,
      vendorId: vendor.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 50,
      lowStockThreshold: 10,
      tags: ["스마트폰", "전자제품", "모바일"],
    },
  });

    // 상품에 발주처를 연결(옵션)
    await prisma.product.update({
      where: { sku: "ELEC-001" },
      data: { vendorId: vendor.id }, // 또는 생략/NULL 가능
    });

  console.log("✅ Products created");

  // Create coupons
  const coupon1 = await prisma.coupon.upsert({
    where: { code: "NEWUSER20" },
    update: {},
    create: {
      code: "NEWUSER20",
      name: "신규 사용자 할인",
      description: "신규 가입 사용자 전용 20% 할인 쿠폰",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minAmount: 10000,
      maxUses: 500,
      currentUses: 0,
      isActive: true,
    },
  });

  const coupon2 = await prisma.coupon.upsert({
    where: { code: "FREESHIP" },
    update: {},
    create: {
      code: "FREESHIP",
      name: "무료 배송",
      description: "5만원 이상 구매 시 무료 배송",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 3000,
      minAmount: 50000,
      maxUses: 1000,
      currentUses: 0,
      isActive: true,
    },
  });

  console.log("✅ Coupons created");

  // Create sample consumer user
  const consumerUser = await prisma.user.upsert({
    where: { email: "consumer@example.com" },
    update: {},
    create: {
      email: "consumer@example.com",
      name: "이하하",
      approve: true,
      role: UserRole.CONSUMER,
      referrerCodeUsed: referralCode.code,
      isActive: true,
    },
  });

  console.log("✅ Consumer user created:", consumerUser.email);

  // Create cart for consumer user
  await prisma.cart.upsert({
    where: { userId: consumerUser.id },
    update: {},
    create: {
      userId: consumerUser.id,
    },
  });

  console.log("✅ Cart created for consumer user");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
