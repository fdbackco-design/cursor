export { PrismaClient } from "@prisma/client";
export type {
  User,
  Seller,
  ReferralCode,
  Category,
  Product,
  Coupon,
  UserCoupon,
  PointsLedger,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Shipment,
  Return,
  Review,
  Qna,
  AuditLog,
  UserRole,
  DiscountType,
  PointsType,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ReturnStatus,
} from "@prisma/client";

// Re-export commonly used types
export type { Prisma } from "@prisma/client";

export * from '@prisma/client';
