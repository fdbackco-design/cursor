import { z } from "zod";

// 결제 상태
export const PaymentStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// 결제 방법
export const PaymentMethodSchema = z.enum([
  "KAKAO_PAY",
  "NAVER_PAY",
  "CREDIT_CARD",
  "BANK_TRANSFER",
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// 결제 스키마
export const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  paymentNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("KRW"),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  idempotencyKey: z.string(),
  pgTransactionId: z.string().optional(),
  pgResponse: z.record(z.unknown()).optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// 카카오페이 결제 요청
export const KakaoPayRequestSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  itemName: z.string(),
  itemCode: z.string(),
  quantity: z.number().positive(),
  taxFreeAmount: z.number().nonnegative().optional(),
  approvalUrl: z.string().url(),
  cancelUrl: z.string().url(),
  failUrl: z.string().url(),
  idempotencyKey: z.string(),
});

export type KakaoPayRequest = z.infer<typeof KakaoPayRequestSchema>;

// 카카오페이 결제 응답
export const KakaoPayResponseSchema = z.object({
  tid: z.string(),
  next_redirect_pc_url: z.string().url(),
  next_redirect_mobile_url: z.string().url(),
  next_redirect_app_url: z.string().url(),
  android_app_scheme: z.string().optional(),
  ios_app_scheme: z.string().optional(),
  created_at: z.string(),
});

export type KakaoPayResponse = z.infer<typeof KakaoPayResponseSchema>;

// 결제 승인 요청
export const ApprovePaymentRequestSchema = z.object({
  pgTransactionId: z.string(),
  amount: z.number().positive(),
  idempotencyKey: z.string(),
});

export type ApprovePaymentRequest = z.infer<typeof ApprovePaymentRequestSchema>;

// 결제 승인 응답
export const ApprovePaymentResponseSchema = z.object({
  success: z.boolean(),
  payment: PaymentSchema,
  message: z.string().optional(),
});

export type ApprovePaymentResponse = z.infer<typeof ApprovePaymentResponseSchema>;

// 결제 취소 요청
export const CancelPaymentRequestSchema = z.object({
  paymentId: z.string(),
  reason: z.string(),
  amount: z.number().positive().optional(), // 부분 취소 시
  idempotencyKey: z.string(),
});

export type CancelPaymentRequest = z.infer<typeof CancelPaymentRequestSchema>;

// 결제 취소 응답
export const CancelPaymentResponseSchema = z.object({
  success: z.boolean(),
  cancelledAmount: z.number(),
  message: z.string().optional(),
});

export type CancelPaymentResponse = z.infer<typeof CancelPaymentResponseSchema>;

// 웹훅 검증 요청
export const WebhookVerificationRequestSchema = z.object({
  signature: z.string(),
  timestamp: z.string(),
  nonce: z.string(),
  body: z.string(),
});

export type WebhookVerificationRequest = z.infer<typeof WebhookVerificationRequestSchema>;

// 웹훅 검증 응답
export const WebhookVerificationResponseSchema = z.object({
  isValid: z.boolean(),
  message: z.string().optional(),
});

export type WebhookVerificationResponse = z.infer<typeof WebhookVerificationResponseSchema>;
