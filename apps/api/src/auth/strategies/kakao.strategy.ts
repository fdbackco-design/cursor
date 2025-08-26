import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

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

    // 1) state 우선, 없으면 쿠키 ref 사용
    const rawState = (req.query?.state as string | undefined) || (req.cookies?.ref as string | undefined);
    const st = parseState(rawState);
    const referralCode = st?.referralCode?.trim() || null;

    log.log(
      `Callback validate: kakaoId=${id}, hasState=${!!req.query?.state}, hasCookie=${!!req.cookies?.ref}, referral="${referralCode ?? ''}"`
    );

    const user = {
      email: _json?.kakao_account?.email ?? null,
      name: username || _json?.properties?.nickname || '카카오사용자',
      kakaoSub: String(id),
    };

    return done(null, user, { referralCode });
  }
}