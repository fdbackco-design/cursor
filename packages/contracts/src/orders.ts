import { z } from "zod";

// 주문 상태
export const OrderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// 주문 아이템 스키마
export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  productSku: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  discountAmount: z.number().nonnegative(),
  finalPrice: z.number().positive(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// 주문 스키마
export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative(),
  shippingAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  totalAmount: z.number().positive(),
  referralCodeUsed: z.string().optional(),
  couponCodeUsed: z.string().optional(),
  shippingAddress: z.object({
    recipientName: z.string(),
    phone: z.string(),
    address: z.string(),
    addressDetail: z.string().optional(),
    postalCode: z.string(),
    city: z.string(),
    country: z.string().default("KR"),
  }),
  billingAddress: z.object({
    recipientName: z.string(),
    phone: z.string(),
    address: z.string(),
    addressDetail: z.string().optional(),
    postalCode: z.string(),
    city: z.string(),
    country: z.string().default("KR"),
  }),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;

// 주문 생성 요청
export const CreateOrderRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })),
  referralCode: z.string().optional(),
  couponCode: z.string().optional(),
  shippingAddress: z.object({
    recipientName: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    addressDetail: z.string().optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default("KR"),
  }),
  billingAddress: z.object({
    recipientName: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    addressDetail: z.string().optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().default("KR"),
  }),
  notes: z.string().optional(),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// 주문 상태 업데이트 요청
export const UpdateOrderStatusRequestSchema = z.object({
  status: OrderStatusSchema,
  notes: z.string().optional(),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;

// 주문 목록 조회 요청
export const GetOrdersRequestSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  status: OrderStatusSchema.optional(),
  userId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(["createdAt", "totalAmount", "orderNumber"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetOrdersRequest = z.infer<typeof GetOrdersRequestSchema>;

// 주문 목록 응답
export const GetOrdersResponseSchema = z.object({
  orders: z.array(OrderSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type GetOrdersResponse = z.infer<typeof GetOrdersResponseSchema>;
