#!/usr/bin/env tsx

import { PrismaClient, UserRole, DiscountType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "관리자",
      role: UserRole.BIZ,
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", adminUser.email);

  // Create seller
  const seller = await prisma.seller.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      companyName: "샘플 셀러",
      businessNumber: "123-45-67890",
      representativeName: "홍길동",
      phone: "02-1234-5678",
      address: "서울시 강남구 테헤란로 123",
      addressDetail: "456동 789호",
      postalCode: "06123",
      city: "서울시",
      country: "KR",
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
      discountPercent: 10,
      maxUses: 1000,
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

  // Create products
  const product1 = await prisma.product.upsert({
    where: { sku: "ELEC-001" },
    update: {},
    create: {
      name: "스마트폰",
      description: "최신 기술이 적용된 스마트폰입니다",
      shortDescription: "최신 스마트폰",
      priceB2B: 800000,
      priceB2C: 1000000,
      comparePrice: 1200000,
      sku: "ELEC-001",
      barcode: "8801234567890",
      weight: 180,
      length: 15,
      width: 7.5,
      height: 0.8,
      images: [
        "https://example.com/images/phone1.jpg",
        "https://example.com/images/phone2.jpg",
      ],
      categoryId: electronicsCategory.id,
      sellerId: seller.id,
      isActive: true,
      isFeatured: true,
      stockQuantity: 50,
      lowStockThreshold: 10,
      tags: ["스마트폰", "전자제품", "모바일"],
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: "CLOTH-001" },
    update: {},
    create: {
      name: "기본 티셔츠",
      description: "편안하고 스타일리시한 기본 티셔츠입니다",
      shortDescription: "기본 티셔츠",
      priceB2B: 15000,
      priceB2C: 25000,
      comparePrice: 35000,
      sku: "CLOTH-001",
      barcode: "8801234567891",
      weight: 150,
      length: 70,
      width: 50,
      height: 0.2,
      images: [
        "https://example.com/images/tshirt1.jpg",
        "https://example.com/images/tshirt2.jpg",
      ],
      categoryId: clothingCategory.id,
      sellerId: seller.id,
      isActive: true,
      isFeatured: false,
      stockQuantity: 200,
      lowStockThreshold: 20,
      tags: ["의류", "티셔츠", "기본"],
    },
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
      name: "일반 사용자",
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
