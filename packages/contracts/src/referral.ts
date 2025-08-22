import { z } from "zod";

// 추천인 코드 생성 요청
export const CreateReferralCodeRequestSchema = z.object({
  code: z.string().min(3).max(20),
  discountPercent: z.number().min(0).max(100),
  maxUses: z.number().positive().optional(),
  expiresAt: z.date().optional(),
});

export type CreateReferralCodeRequest = z.infer<typeof CreateReferralCodeRequestSchema>;

// 추천인 코드 응답
export const ReferralCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountPercent: z.number(),
  maxUses: z.number().nullable(),
  currentUses: z.number(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReferralCode = z.infer<typeof ReferralCodeSchema>;

// 추천인 코드 사용 요청
export const UseReferralCodeRequestSchema = z.object({
  code: z.string(),
});

export type UseReferralCodeRequest = z.infer<typeof UseReferralCodeRequestSchema>;

// 추천인 코드 검증 응답
export const ValidateReferralCodeResponseSchema = z.object({
  isValid: z.boolean(),
  code: ReferralCodeSchema.optional(),
  message: z.string().optional(),
});

export type ValidateReferralCodeResponse = z.infer<typeof ValidateReferralCodeResponseSchema>;
