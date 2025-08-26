// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          // 쿠키에서 토큰 추출
          return request?.cookies?.session;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서도 추출 (백업)
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT 전략 - 페이로드:', payload);
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}