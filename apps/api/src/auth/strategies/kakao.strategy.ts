import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import axios from 'axios';

const log = new Logger('KakaoStrategy');

function parseState(raw?: string): { referralCode?: string } | null {
  try {
    if (!raw) return null;
    const norm = String(raw).replace(/-/g, '+').replace(/_/g, '/'); // URL-safe → base64
    const json = Buffer.from(norm, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID'),
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET'),
      callbackURL: configService.get<string>('KAKAO_CALLBACK_URL'),
      passReqToCallback: true,
      scope: [
        'account_email',
        'profile_nickname',
        'phone_number',
        'shipping_address', // 동의만 받고, 실제 데이터는 별도 API 호출 필요
        'talk_message',
      ],
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any, info?: any) => void,
  ) {
    const { id, username, _json } = profile;

    // state 처리 (OAuth state에서 ref 파라미터 추출)
    const referralCode = (() => {
      try {
        // 1. OAuth state에서 ref 파라미터 확인
        const rawState = req.query?.state as string | undefined;
        if (rawState) {
          const norm = rawState.replace(/-/g, '+').replace(/_/g, '/');
          const json = Buffer.from(norm, 'base64').toString('utf8');
          const parsed = JSON.parse(json);
          const stateRef = parsed?.ref ?? parsed?.referralCode;
          if (stateRef) {
            log.log(`OAuth state에서 추천인 코드 발견: ${stateRef}`);
            return stateRef as string;
          }
        }
        
        // 2. middleware에서 설정한 referral_code 쿠키 확인
        const referralCodeCookie = req.cookies?.referral_code;
        if (referralCodeCookie) {
          log.log(`쿠키에서 추천인 코드 발견: ${referralCodeCookie}`);
          return referralCodeCookie as string;
        }
        
        // 3. 기존 ref 쿠키 확인 (base64 인코딩)
        const refCookie = req.cookies?.ref;
        if (refCookie) {
          const norm = refCookie.replace(/-/g, '+').replace(/_/g, '/');
          const json = Buffer.from(norm, 'base64').toString('utf8');
          const parsed = JSON.parse(json);
          const cookieRef = parsed?.referralCode ?? parsed?.ref;
          if (cookieRef) {
            log.log(`ref 쿠키에서 추천인 코드 발견: ${cookieRef}`);
            return cookieRef as string;
          }
        }
        
        log.log('추천인 코드를 찾을 수 없음');
        return null;
      } catch (error) {
        log.warn('추천인 코드 파싱 실패:', error);
        return null;
      }
    })();

    const kakaoAccount = _json?.kakao_account ?? {};
    const properties   = _json?.properties ?? {};

    // 동의/보유 로그
    log.log(
      `needs_agreement: email=${kakaoAccount?.email_needs_agreement},` +
      ` phone=${kakaoAccount?.phone_number_needs_agreement},` +
      ` shipAddr=SEPARATE_API`
    );
    log.log(
      `has: email=${!!kakaoAccount?.email},` +
      ` phone=${!!kakaoAccount?.phone_number},` +
      ` shipAddr=call_api_below`
    );

    // 기본 user
    const user: any = {
      email: kakaoAccount?.email ?? null,
      name: username || properties?.nickname || '카카오사용자',
      kakaoSub: String(id),
      phoneNumber: kakaoAccount?.phone_number ?? null,
      shippingAddress: null,
      talkMessageAgreed: kakaoAccount?.talk_message_agreed ?? false,
    };

    // ✅ 배송지 조회 API 호출 (동의 받았고 Biz/권한 요건 충족 시 값이 옴)
    try {
      const resp = await axios.get('https://kapi.kakao.com/v1/user/shipping_address', {
        headers: { Authorization: `Bearer ${accessToken}` },
        // 필요 시 params로 기본배송지/전체 조회 등 옵션 사용
        // params: { page: 1, size: 1 } 등
      });
      // 응답 구조 예시: { shipping_addresses: [{ ... }], ... }
      const list = resp?.data?.shipping_addresses;
      if (Array.isArray(list) && list.length > 0) {
        // 보통 기본배송지 1건 혹은 최신 1건 골라 담기
        const primary = list.find((a: any) => a.is_default) ?? list[0];
        user.shippingAddress = primary ?? null;
      }
    } catch (e: any) {
      // 403/400이면 권한 미승인/심사 미통과/동의 미완료 등의 가능성
      log.warn(`배송지 조회 API 실패: ${e?.response?.status} ${JSON.stringify(e?.response?.data ?? {})}`);
    }

    log.log(`카카오 추가 정보: phone=${user.phoneNumber}, address=${!!user.shippingAddress}, talkMsg=${user.talkMessageAgreed}`);

    return done(null, user, { referralCode });
  }
}