import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';


@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(AuthService.name); 
  constructor(private readonly jwtService: JwtService) {}

  async getCurrentUser(req: Request) {
    // 1) access_token 우선, 없으면 session 호환
    const token =
      req.cookies?.access_token ??
      req.cookies?.session ??
      null;

    if (!token) {
      return { isAuthenticated: false, role: null, user: null };
    }

    try {
      // 2) JWT 검증 (JWT_SECRET 동일성 필수)
      const payload = this.jwtService.verify(token);

      // 3) role은 쿠키(user_role) → payload.role → 기본값 순
      const roleCookie = req.cookies?.user_role;
      const role =
        (typeof roleCookie === 'string' && roleCookie.trim()) ||
        payload?.role ||
        'CONSUMER';

      return {
        isAuthenticated: true,
        role,
        id: payload.id,
        email: payload.email,
        name: payload.name,
        kakaoSub: payload.kakaoSub,
        approve: payload.approve,
        referrerCodeUsed: payload.referrerCodeUsed,
      };
    } catch (e) {
      // 만료/서명불일치 등
      return { isAuthenticated: false, role: null, user: null };
    }
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        kakaoSub: true,
        referrerCodeUsed: true,
        approve: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveUser(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { approve: true },
    });

    // 승인 후 새로운 JWT 토큰 생성
    const newToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kakaoSub: user.kakaoSub,
      approve: user.approve,
    });

    return {
      user,
      newToken,
    };
  }

  async rejectUser(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { approve: false },
    });
    return user;
  }

  async verifyReferralCode(referralCode: string): Promise<boolean> {
    try {
      // TODO: 실제 구현 시 DB에서 코드 유효성 체크
      const validCodes = ['WELCOME10', 'NEWUSER20', 'SPECIAL30', 'FEEDBACK2024'];
      return validCodes.includes(referralCode.toUpperCase());
    } catch (error) {
      console.error('추천인 코드 검증 에러:', error);
      return false;
    }
  }

  /**
   * 카카오 로그인 처리
   * - 신규 가입 시에만 referrerCodeUsed 기록 (정책: “신규 가입 1회만”)
   * - 기존 회원은 추천인 코드 미기록/미수정
   */
  async handleKakaoLogin(
    user: { email?: string | null; name?: string | null; kakaoSub: string },
    referralCode?: string,
  ) {
    this.logger.log(`handleKakaoLogin: kakaoSub=${user.kakaoSub}, referral="${referralCode ?? ''}"`);
  
    // 0) 기본 정리
    const cleanName = (user.name ?? '').trim() || '카카오사용자';
    const cleanEmail = user.email?.trim() || null;
    const cleanRef = referralCode?.trim();
  
    // 1) 우선 kakaoSub로 조회
    let dbUser = await this.prisma.user.findUnique({ where: { kakaoSub: user.kakaoSub } });
  
    // 2) kakaoSub로 없으면, email로 기존 계정 연결 시도(미연동 → 연동)
    if (!dbUser && cleanEmail) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
      if (byEmail && !byEmail.kakaoSub) {
        // ← 이 케이스가 ‘기존 미연동 계정’의 최초 소셜 연결
        const updateData: any = {
          kakaoSub: user.kakaoSub,
          name: byEmail.name === '미연동 계정' ? cleanName : (byEmail.name ?? cleanName),
          // 정책: 최초 연결 타이밍에 1회 백필 허용
          ...( !byEmail.referrerCodeUsed && cleanRef ? { referrerCodeUsed: cleanRef } : {} ),
          // 역할 승격
          role: UserRole.CONSUMER,
          updatedAt: new Date(),
        };
        dbUser = await this.prisma.user.update({ where: { id: byEmail.id }, data: updateData });
        this.logger.log(`Linked existing by email: id=${dbUser.id}, role=${dbUser.role}, ref=${dbUser.referrerCodeUsed ?? ''}`);
      }
    }
  
    if (!dbUser) {
      // 3) 완전 신규 가입
      const data: any = {
        email: cleanEmail,
        name: cleanName,
        kakaoSub: user.kakaoSub,
        role: UserRole.CONSUMER,
        approve: false, // 기본적으로 승인되지 않음
        isActive: true,
        ...( cleanRef ? { referrerCodeUsed: cleanRef } : {} ),
      };
      dbUser = await this.prisma.user.create({ data });
      this.logger.log(`User created: id=${dbUser.id}, role=${dbUser.role}, ref=${dbUser.referrerCodeUsed ?? ''}, approve=${dbUser.approve}`);
    } else {
      // 4) 기존 유저 (이미 kakaoSub 보유)
      const roleStr = String(dbUser.role).toUpperCase();
      const looksUnlinkedByName = dbUser.name === '미연동 계정';          // 현 DB 패턴
      const isUnlinkedRole = roleStr.includes('UNLINKED') || roleStr.includes('미연동');
  
      const updateData: any = {
        // 이름이 '미연동 계정'이면 카카오 측 이름으로 정정
        name: looksUnlinkedByName ? cleanName : (dbUser.name ?? cleanName),
        email: cleanEmail ?? dbUser.email,
        updatedAt: new Date(),
      };
  
      // 최초 연동 타이밍 한정 1회 백필 규칙
      if ((looksUnlinkedByName || isUnlinkedRole) && !dbUser.referrerCodeUsed && cleanRef) {
        updateData.referrerCodeUsed = cleanRef;
        this.logger.log(`Referral backfill on linking: id=${dbUser.id}, ref=${cleanRef}`);
      }
  
      // 역할 승격 (미연동/비정상 상태면)
      if (isUnlinkedRole && dbUser.role !== UserRole.CONSUMER) {
        updateData.role = UserRole.CONSUMER;
        this.logger.log(`Role promote: id=${dbUser.id} ${dbUser.role} -> CONSUMER`);
      }
  
      dbUser = await this.prisma.user.update({ where: { id: dbUser.id }, data: updateData });
      this.logger.log(`User updated: id=${dbUser.id}, role=${dbUser.role}, ref=${dbUser.referrerCodeUsed ?? ''}`);
    }
  
        // 5) JWT
    const token = this.jwtService.sign({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      kakaoSub: dbUser.kakaoSub,
      approve: dbUser.approve,
    });

    return {
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        kakaoSub: dbUser.kakaoSub,
        referrerCodeUsed: dbUser.referrerCodeUsed,
        approve: dbUser.approve,
      },
    };
  }
  async logout(res: Response) {
    res.clearCookie('session');
    res.clearCookie('user_role');
    res.clearCookie('access_token', { path: '/' });
    return { message: '로그아웃되었습니다.' };
  }
}