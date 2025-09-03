import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

const log = new Logger('KakaoAuthGuard');

function toStateFromRef(ref?: string): string {
  if (!ref) return '';
  const payload = { referralCode: String(ref).trim() };
  return Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_'); // URL-safe base64
}

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // 기존 옵션 유지
    const base = super.getAuthenticateOptions(context) ?? {};

    const qState = typeof req.query.state === 'string' ? req.query.state : '';
    const qRef   = typeof req.query.ref   === 'string' ? req.query.ref   : '';

    // ref → state
    const state = qState || toStateFromRef(qRef);

    // 유실 대비로 cookie에도 백업
    if (state) {
      res.cookie('ref', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10분
      });
    }

    // ✅ 여기서 scope와 prompt를 명시적으로 강제
    const scope = [
      'account_email',
      'profile_nickname',
      'phone_number',
      'shipping_address',
      'talk_message',
    ];

    const opts = {
      ...base,
      state,
      scope,
      // 재동의 강제(동의창 표출)
      prompt: 'consent',
      // 필요 시 다음 줄도 시험해볼 수 있습니다(강한 재인증).
      // auth_type: 'reauthenticate',
    };

    log.log(
      `Start OAuth: q.ref="${qRef}", q.state="${qState}", send.state="${state}", scope=${JSON.stringify(scope)}`
    );

    return opts;
  }
}