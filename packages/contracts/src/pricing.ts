import { z } from "zod";

// 가격 정책 스키마
export const PricingPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["FIXED", "PERCENTAGE", "TIERED"]),
  value: z.number(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  applicableRoles: z.array(z.enum(["BIZ", "CONSUMER"])),
  isActive: z.boolean(),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PricingPolicy = z.infer<typeof PricingPolicySchema>;

// 가격 계산 요청
export const CalculatePriceRequestSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  userRole: z.enum(["BIZ", "CONSUMER"]),
  referralCode: z.string().optional(),
  couponCode: z.string().optional(),
});

export type CalculatePriceRequest = z.infer<typeof CalculatePriceRequestSchema>;

// 가격 계산 응답
export const CalculatePriceResponseSchema = z.object({
  originalPrice: z.number(),
  discountedPrice: z.number(),
  finalPrice: z.number(),
  discountAmount: z.number(),
  discountPercent: z.number(),
  appliedPolicies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    value: z.number(),
    description: z.string().optional(),
  })),
  breakdown: z.object({
    subtotal: z.number(),
    referralDiscount: z.number(),
    couponDiscount: z.number(),
    totalDiscount: z.number(),
    finalTotal: z.number(),
  }),
});

export type CalculatePriceResponse = z.infer<typeof CalculatePriceResponseSchema>;

// 가격 정책 생성 요청
export const CreatePricingPolicyRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["FIXED", "PERCENTAGE", "TIERED"]),
  value: z.number(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  applicableRoles: z.array(z.enum(["BIZ", "CONSUMER"])),
  isActive: z.boolean().default(true),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
});

export type CreatePricingPolicyRequest = z.infer<typeof CreatePricingPolicyRequestSchema>;
