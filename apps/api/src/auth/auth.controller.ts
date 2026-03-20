// auth.controller.ts
import { Controller, Get, Post, Req, Res, UseGuards, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './kakao.guard';
// import { Injectable } from '@nestjs/common';  // ← 사용 안 하므로 제거
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';                 // ⬅️ 추가

function sanitizePostLoginPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const s = raw.trim();
  if (!s.startsWith('/') || s.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return null;
  if (s.length > 2048) return null;
  return s;
}

function appendLoginSuccessQuery(path: string): string {
  const login = 'login=success';
  return path.includes('?') ? `${path}&${login}` : `${path}?${login}`;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: JwtService,                    // ⬅️ 추가
  ) {}

  @Get('me')
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.authService.getCurrentUser(req);
      if (!user) {
        return res.json({ isAuthenticated: false, role: null });
      }
      return res.json(user);
    } catch {
      return res.status(500).json({ error: '사용자 정보를 가져오는데 실패했습니다.' });
    }
  }

  @Get('users')
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.authService.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error('사용자 목록 조회 에러:', error);
      return res.status(500).json({ error: '사용자 목록을 가져오는데 실패했습니다.' });
    }
  }

  // 개발용 관리자 로그인
  @Post('dev/admin-login')
  async devAdminLogin(@Res() res: Response) {
    try {
      // 개발용 관리자 토큰 생성
      const adminPayload = {
        id: 'admin-dev',
        sub: 'admin-dev',
        email: 'admin@example.com',
        name: '관리자',
        role: 'ADMIN',
      };

      const token = this.jwt.sign(adminPayload);

      // 쿠키 설정
      res.cookie('access_token', token, {
        httpOnly: true,                 // 토큰은 httpOnly 유지
        secure: true,
        sameSite: 'none' as const,
        domain: '.feedbackmall.com',    // ★ 추가: 최상위 도메인에 귀속
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie('user_role', 'ADMIN', {
        httpOnly: false,                // 미들웨어에서 볼 필요 있으면 false
        secure: true,
        sameSite: 'none' as const,
        domain: '.feedbackmall.com',    // ★ 추가
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: '관리자로 로그인되었습니다.',
        user: adminPayload,
      });
    } catch (error) {
      console.error('관리자 로그인 실패:', error);
      return res.status(500).json({ error: '관리자 로그인에 실패했습니다.' });
    }
  }

  @Post('users/:id/approve')
  async approveUser(@Param('id') id: string) {
    const user = await this.authService.approveUser(id);
    return { message: '사용자가 승인되었습니다.', user };
  }

  @Post('users/:id/reject')
  async rejectUser(@Param('id') id: string) {
    const user = await this.authService.rejectUser(id);
    return { message: '사용자 승인이 거부되었습니다.', user };
  }

  @Post('verify-referral')
  async verifyReferralCode(@Req() req: Request, @Res() res: Response) {
    try {
      const { referralCode } = req.body ?? {};
      this.logger.log(`[verify-referral POST 요청] 코드: "${referralCode}"`);
      
      if (!referralCode) {
        this.logger.warn(`[verify-referral POST] 코드가 비어있음`);
        return res.status(400).json({ error: '추천인 코드가 필요합니다.' });
      }
      
      const isValid = await this.authService.verifyReferralCode(referralCode);
      
      this.logger.log(`[verify-referral POST 결과] 코드: "${referralCode}" -> ${isValid ? '유효' : '무효'}`);
      
      return res.json({
        isValid,
        message: isValid ? '유효한 추천인 코드입니다.' : '유효하지 않은 추천인 코드입니다.',
      });
    } catch (error) {
      this.logger.error(`[verify-referral POST 에러] 코드: "${req.body?.referralCode}", 에러:`, error);
      return res.status(500).json({ error: '추천인 코드 검증에 실패했습니다.' });
    }
  }

  @Get('validate-referral/:code')
  async validateReferralCode(@Param('code') code: string, @Res() res: Response) {
    const decodedCode = decodeURIComponent(code);
    this.logger.log(`[validate-referral 요청] 원본: "${code}", 디코딩: "${decodedCode}"`);
    
    try {
      if (!code) {
        this.logger.warn(`[validate-referral] 코드가 비어있음`);
        return res.status(400).json({ 
          valid: false, 
          error: '추천인 코드가 필요합니다.' 
        });
      }
      
      const isValid = await this.authService.verifyReferralCode(decodedCode);
      
      this.logger.log(`[validate-referral 결과] 코드: "${decodedCode}" -> ${isValid ? '유효' : '무효'}`);
      
      return res.json({
        valid: isValid,
        code: decodedCode,
        message: isValid ? '유효한 추천인 코드입니다.' : '유효하지 않은 추천인 코드입니다.',
      });
    } catch (error) {
      this.logger.error(`[validate-referral 에러] 코드: "${decodedCode}", 에러:`, error);
      return res.status(500).json({ 
        valid: false, 
        error: '추천인 코드 검증에 실패했습니다.' 
      });
    }
  }

  // 카카오 OAuth 시작
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuth(@Req() req: Request, @Res() res: Response) {
    // ref 파라미터가 있으면 state에 포함하여 전달
    const ref = req.query.ref as string;
    if (ref) {
      // state에 ref 정보를 인코딩하여 전달
      const state = Buffer.from(JSON.stringify({ ref })).toString('base64');
      req.query.state = state;
    }
  }

  // 카카오 OAuth 콜백
  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;

      const fromInfo: string | undefined = (req.authInfo as any)?.referralCode;
      const returnPathRaw = (req.authInfo as any)?.returnPath as string | undefined;

      const fromCookie: string | undefined = (() => {
        try {
          // 1. 기존 ref 쿠키 확인 (base64 인코딩된 경우)
          const raw = req.cookies?.ref as string | undefined;
          if (raw) {
            const norm = raw.replace(/-/g, '+').replace(/_/g, '/');
            const json = Buffer.from(norm, 'base64').toString('utf8');
            const parsed = JSON.parse(json);
            const code = typeof parsed?.referralCode === 'string' ? parsed.referralCode : undefined;
            if (code) return code;
          }
          
          // 2. middleware에서 설정한 referral_code 쿠키 확인
          const referralCodeCookie = req.cookies?.referral_code as string | undefined;
          if (referralCodeCookie) {
            return referralCodeCookie;
          }
          
          return undefined;
        } catch { return undefined; }
      })();

      const candidate = (fromInfo && fromInfo.trim()) ? fromInfo.trim()
                       : (fromCookie && fromCookie.trim()) ? fromCookie.trim()
                       : undefined;

      this.logger.log(`Callback controller: kakaoSub=${user?.kakaoSub}, info="${fromInfo ?? ''}", cookie="${fromCookie ?? ''}", chosen="${candidate ?? ''}"`);

      let referralCode: string | undefined = undefined;
      if (candidate) {
        this.logger.log(`[카카오 콜백] 추천인 코드 검증 시작: "${candidate}"`);
        const ok = await this.authService.verifyReferralCode(candidate);
        this.logger.log(`[카카오 콜백] 추천인 코드 검증 결과: "${candidate}" -> ${ok ? '✅ VALID' : '❌ INVALID'}`);
        referralCode = ok ? candidate : undefined;
        if (!ok) {
          this.logger.warn(`[카카오 콜백] 무효한 추천인 코드로 인해 사용되지 않음: "${candidate}"`);
        }
      } else {
        this.logger.log(`[카카오 콜백] 추천인 코드 후보가 없음 (fromInfo: "${fromInfo ?? ''}", fromCookie: "${fromCookie ?? ''}")`);
      }

      const result = await this.authService.handleKakaoLogin(user, referralCode);

      this.logger.log(`handleKakaoLogin 결과: userId=${result.user.id}, token exists=${!!result.token}, approve=${result.user.approve}`);

      // 쿠키 정리 및 설정
      res.clearCookie('ref');
      res.cookie('access_token', result.token, {
        httpOnly: true,                 // 토큰은 httpOnly 유지
        secure: true,
        sameSite: 'none' as const,
        domain: '.feedbackmall.com',    // ★ 추가: 최상위 도메인에 귀속
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie('user_role', result.user.role, {
        httpOnly: false,                // 미들웨어에서 볼 필요 있으면 false
        secure: true,
        sameSite: 'none' as const,
        domain: '.feedbackmall.com',    // ★ 추가
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })

      this.logger.log(`쿠키 설정 완료: access_token, user_role=${result.user.role}`);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const safePath = sanitizePostLoginPath(returnPathRaw) ?? '/home';
      const target = appendLoginSuccessQuery(safePath);
      const dest = `${frontendUrl}${target}`;
      this.logger.log(`리다이렉트(로그인 후): ${dest}`);
      return res.redirect(dest);
    } catch (error) {
      this.logger.error('카카오 로그인 에러:', error as any);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/signin?error=login_failed`);
    }
  }

  // =========================
  // ⬇️ 개발용 가짜 로그인 엔드포인트 추가
  // =========================
  @Get('dev-login-admin')
  devLoginAdmin(@Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const payload = {
      id: 'dev-admin-id',
      email: process.env.DEV_ADMIN_EMAIL || 'admin@test.local',
      name: 'Dev Admin',
      role: 'ADMIN',
    };
    const token = this.jwt.sign(payload, { expiresIn: '1d' });

    res.cookie('access_token', token, {
      httpOnly: true,                 // 토큰은 httpOnly 유지
      secure: true,
      sameSite: 'none' as const,
      domain: '.feedbackmall.com',    // ★ 추가: 최상위 도메인에 귀속
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('user_role', 'ADMIN', {
      httpOnly: false,                // 미들웨어에서 볼 필요 있으면 false
      secure: true,
      sameSite: 'none' as const,
      domain: '.feedbackmall.com',    // ★ 추가
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/admin`);
  }

  @Get('dev-login-consumer')
  devLoginConsumer(@Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    this.logger.log('Dev login consumer 요청 시작');
    
    const payload = {
      id: 'dev-consumer-id',
      email: 'consumer@test.local',
      name: 'Dev Consumer',
      role: 'CONSUMER',
      approve: true, // 개발용 사용자는 승인된 상태
    };
    const token = this.jwt.sign(payload, { expiresIn: '1d' });

    this.logger.log(`Dev login token 생성: ${token.substring(0, 20)}...`);

    res.cookie('access_token', token, {
      httpOnly: true,                 // 토큰은 httpOnly 유지
      secure: true,
      sameSite: 'none' as const,
      domain: '.feedbackmall.com',    // ★ 추가: 최상위 도메인에 귀속
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('user_role', 'CONSUMER', {
      httpOnly: false,                // 미들웨어에서 볼 필요 있으면 false
      secure: true,
      sameSite: 'none' as const,
      domain: '.feedbackmall.com',    // ★ 추가
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }); 
    this.logger.log('Dev login 쿠키 설정 완료');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.logger.log(`Dev login 리다이렉트: ${frontendUrl}/home`);
    return res.redirect(`${frontendUrl}/home`);
  }
  // =========================

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      const result = await this.authService.logout(res);
      return res.json(result);
    } catch {
      return res.status(500).json({ error: '로그아웃에 실패했습니다.' });
    }
  }
}