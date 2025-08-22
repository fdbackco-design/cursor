import { z } from "zod";

// 카카오 OAuth 콜백 응답
export const KakaoOAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export type KakaoOAuthCallback = z.infer<typeof KakaoOAuthCallbackSchema>;

// 카카오 OAuth 토큰 응답
export const KakaoTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  refresh_token_expires_in: z.number().optional(),
  scope: z.string().optional(),
});

export type KakaoTokenResponse = z.infer<typeof KakaoTokenResponseSchema>;

// 카카오 사용자 정보
export const KakaoUserInfoSchema = z.object({
  id: z.number(),
  connected_at: z.string(),
  properties: z.object({
    nickname: z.string(),
    profile_image: z.string().optional(),
    thumbnail_image: z.string().optional(),
  }),
  kakao_account: z.object({
    profile_needs_agreement: z.boolean().optional(),
    profile: z.object({
      nickname: z.string(),
      thumbnail_image_url: z.string().optional(),
      profile_image_url: z.string().optional(),
    }).optional(),
    email_needs_agreement: z.boolean().optional(),
    email: z.string().optional(),
    age_range_needs_agreement: z.boolean().optional(),
    age_range: z.string().optional(),
    birthday_needs_agreement: z.boolean().optional(),
    birthday: z.string().optional(),
    gender_needs_agreement: z.boolean().optional(),
    gender: z.string().optional(),
    phone_number_needs_agreement: z.boolean().optional(),
    phone_number: z.string().optional(),
    ci_needs_agreement: z.boolean().optional(),
    ci: z.string().optional(),
    ci_authenticated_at: z.string().optional(),
  }),
});

export type KakaoUserInfo = z.infer<typeof KakaoUserInfoSchema>;

// 세션 사용자 정보
export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string(),
  role: z.enum(["BIZ", "CONSUMER"]),
  kakaoSub: z.string().optional(),
  referrerCodeUsed: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

// 로그인 요청
export const SignInRequestSchema = z.object({
  referralCode: z.string().optional(),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;

// 회원가입 요청
export const SignUpRequestSchema = z.object({
  referralCode: z.string(),
  role: z.enum(["BIZ", "CONSUMER"]),
  businessInfo: z.object({
    companyName: z.string(),
    businessNumber: z.string(),
    representativeName: z.string(),
  }).optional(),
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
