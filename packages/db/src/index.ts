// 1) Prisma Client 클래스와 타입을 src/generated/client에서 가져오기
export { PrismaClient } from "./generated/client";

// 2) 모델/enum 타입들 재수출
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
} from "./generated/client";

// 3) Prisma namespace를 값으로도 export
export { Prisma } from "./generated/client";

// 3) enum들을 값으로도 export
export {
  UserRole,
  DiscountType,
  PointsType,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  ReturnStatus,
  RefundReason,
  RefundStatus,
  ReturnType,
} from "./generated/client";

// 3) 필요하면 Prisma namespace 전체도 재수출
export * from "./generated/client";