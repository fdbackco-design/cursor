import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // 1) 토큰 추출 (쿠키 → 헤더 → 쿼리)
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined) ||
      req.query?.token;

    if (!token) throw new UnauthorizedException('토큰이 없습니다.');

    try {
      const payload = this.jwtService.verify(token);

      // 2) payload 표준화: 모든 필드 포함
      const normalized = {
        id: payload.id ?? payload.sub,
        email: payload.email ?? null,
        name: payload.name ?? null,
        role: payload.role ?? 'CONSUMER',
        kakaoSub: payload.kakaoSub ?? null,
        approve: payload.approve ?? false,
        // 기타 필드들도 복사
      };

      if (!normalized.id) throw new UnauthorizedException('유효한 사용자 ID가 없습니다.');

      req.user = normalized;
      return true;
    } catch (e: any) {
      throw new UnauthorizedException(`토큰 검증 실패: ${e?.message ?? 'unknown'}`);
    }
  }
}