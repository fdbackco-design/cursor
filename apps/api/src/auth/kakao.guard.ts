import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

const log = new Logger('KakaoAuthGuard');

function toStateFromRef(ref?: string): string {
  if (!ref) return '';
  const payload = { referralCode: String(ref).trim() };
  const b64 = Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_'); // URL-safe
  return b64;
}

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const base = super.getAuthenticateOptions(context) ?? {};

    const qState = typeof req.query.state === 'string' ? req.query.state : '';
    const qRef   = typeof req.query.ref === 'string' ? req.query.ref : '';

    // 1) ref가 오면 state로 변환
    const state = qState || toStateFromRef(qRef);

    // 2) 쿠키 백업 (유실 대비)
    if (state) {
      res.cookie('ref', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10분
      });
    }

    // 3) 로그
    log.log(`Start OAuth: q.ref="${qRef}", q.state="${qState}", send.state="${state}"`);

    return { ...base, state };
  }
}