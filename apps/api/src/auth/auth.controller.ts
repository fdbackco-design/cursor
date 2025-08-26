// auth.controller.ts
import { Controller, Get, Post, Req, Res, UseGuards, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './kakao.guard';
// import { Injectable } from '@nestjs/common';  // ← 사용 안 하므로 제거
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';                 // ⬅️ 추가

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
      if (!referralCode) {
        return res.status(400).json({ error: '추천인 코드가 필요합니다.' });
      }
      const isValid = await this.authService.verifyReferralCode(referralCode);
      return res.json({
        isValid,
        message: isValid ? '유효한 추천인 코드입니다.' : '유효하지 않은 추천인 코드입니다.',
      });
    } catch (error) {
      console.error('추천인 코드 검증 에러:', error);
      return res.status(500).json({ error: '추천인 코드 검증에 실패했습니다.' });
    }
  }

  // 카카오 OAuth 시작
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuth() {}

  // 카카오 OAuth 콜백
  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as any;

      const fromInfo: string | undefined = (req.authInfo as any)?.referralCode;

      const fromCookie: string | undefined = (() => {
        try {
          const raw = req.cookies?.ref as string | undefined;
          if (!raw) return undefined;
          const norm = raw.replace(/-/g, '+').replace(/_/g, '/');
          const json = Buffer.from(norm, 'base64').toString('utf8');
          const parsed = JSON.parse(json);
          return typeof parsed?.referralCode === 'string' ? parsed.referralCode : undefined;
        } catch { return undefined; }
      })();

      const candidate = (fromInfo && fromInfo.trim()) ? fromInfo.trim()
                       : (fromCookie && fromCookie.trim()) ? fromCookie.trim()
                       : undefined;

      this.logger.log(`Callback controller: kakaoSub=${user?.kakaoSub}, info="${fromInfo ?? ''}", cookie="${fromCookie ?? ''}", chosen="${candidate ?? ''}"`);

      let referralCode: string | undefined = undefined;
      if (candidate) {
        const ok = await this.authService.verifyReferralCode(candidate);
        this.logger.log(`Referral verify: "${candidate}" -> ${ok ? 'VALID' : 'INVALID'}`);
        referralCode = ok ? candidate : undefined;
      }

      const result = await this.authService.handleKakaoLogin(user, referralCode);

      // 쿠키 정리 및 설정
      res.clearCookie('ref');
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie('user_role', result.user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/home?login=success`);
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
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('user_role', 'ADMIN', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
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
    const payload = {
      id: 'dev-consumer-id',
      email: 'consumer@test.local',
      name: 'Dev Consumer',
      role: 'CONSUMER',
    };
    const token = this.jwt.sign(payload, { expiresIn: '1d' });

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('user_role', 'CONSUMER', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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