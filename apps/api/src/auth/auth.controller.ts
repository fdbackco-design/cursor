import { Controller, Get, Post, Req, Res, UseGuards, Query } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getCurrentUser(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.authService.getCurrentUser(req);
      
      if (!user) {
        return res.json({
          isAuthenticated: false,
          role: null,
        });
      }
      
      return res.json(user);
    } catch (error) {
      return res.status(500).json({
        error: '사용자 정보를 가져오는데 실패했습니다.',
      });
    }
  }

  @Get('users')
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.authService.getAllUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({
        error: '사용자 목록을 가져오는데 실패했습니다.',
      });
    }
  }

  @Post('verify-referral')
  async verifyReferralCode(@Req() req: Request, @Res() res: Response) {
    try {
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({
          error: '추천인 코드가 필요합니다.',
        });
      }

      const isValid = await this.authService.verifyReferralCode(referralCode);
      
      return res.json({
        isValid,
        message: isValid ? '유효한 추천인 코드입니다.' : '유효하지 않은 추천인 코드입니다.',
      });
    } catch (error) {
      console.error('추천인 코드 검증 에러:', error);
      return res.status(500).json({
        error: '추천인 코드 검증에 실패했습니다.',
      });
    }
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth() {
    // 카카오 OAuth 시작 - 이 메서드는 실행되지 않습니다
    // Passport가 카카오로 리디렉트합니다
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuthCallback(@Req() req: Request, @Res() res: Response, @Query('ref') referralCode?: string) {
    try {
      // 추천인 코드 유효성 재검증
      if (referralCode) {
        const isValid = await this.authService.verifyReferralCode(referralCode);
        if (!isValid) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          return res.redirect(`${frontendUrl}/signin?error=invalid_referral`);
        }
      }

      const user = req.user as any;
      const result = await this.authService.handleKakaoLogin(user, referralCode);
      
      // 쿠키에 JWT 토큰 저장
      res.cookie('session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });
      
      res.cookie('user_role', result.user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      // 프론트엔드로 리디렉트
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/home?login=success`);
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/signin?error=login_failed`);
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      const result = await this.authService.logout(res);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error: '로그아웃에 실패했습니다.',
      });
    }
  }
}
