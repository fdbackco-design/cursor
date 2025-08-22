import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(private jwtService: JwtService) {}

  async getCurrentUser(req: Request) {
    const session = req.cookies?.session;
    const userRole = req.cookies?.user_role;
    
    if (!session) {
      return null;
    }
    
    try {
      // JWT 토큰 검증
      const payload = this.jwtService.verify(session);
      return {
        isAuthenticated: true,
        role: userRole || payload.role || 'CONSUMER',
        user: payload,
      };
    } catch (error) {
      return null;
    }
  }

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          kakaoSub: true,
          referrerCodeUsed: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return users;
    } catch (error) {
      console.error('사용자 목록 조회 에러:', error);
      throw new Error('사용자 목록을 가져오는데 실패했습니다.');
    }
  }

  async verifyReferralCode(referralCode: string): Promise<boolean> {
    try {
      // 실제 구현에서는 데이터베이스에서 추천인 코드를 조회해야 합니다
      // 여기서는 예시로 몇 개의 유효한 코드를 하드코딩합니다
      const validCodes = ['WELCOME10', 'NEWUSER20', 'SPECIAL30', 'FEEDBACK2024'];
      
      // 데이터베이스 조회 로직 (예시)
      // const referralCodeRecord = await this.prisma.referralCode.findUnique({
      //   where: { code: referralCode },
      //   select: { isActive: true, maxUses: true, currentUses: true }
      // });
      
      // if (!referralCodeRecord || !referralCodeRecord.isActive) {
      //   return false;
      // }
      
      // if (referralCodeRecord.currentUses >= referralCodeRecord.maxUses) {
      //   return false;
      // }
      
      // return true;
      
      // 임시 구현: 하드코딩된 코드와 비교
      return validCodes.includes(referralCode.toUpperCase());
    } catch (error) {
      console.error('추천인 코드 검증 에러:', error);
      return false;
    }
  }

  async handleKakaoLogin(user: any, referralCode?: string) {
    try {
      // 사용자 객체에서 추천인 코드도 확인
      const finalReferralCode = referralCode || user?.referralCode;
      
      console.log('카카오 로그인 처리 시작:', { 
        user, 
        passedReferralCode: referralCode,
        userReferralCode: user?.referralCode,
        finalReferralCode 
      });
      
      // 카카오 사용자 정보로 기존 사용자 조회
      let dbUser = await this.prisma.user.findUnique({
        where: { kakaoSub: user.kakaoSub }
      });

      if (!dbUser) {
        // 새 사용자 생성 - 항상 CONSUMER 역할로 설정
        const userData: any = {
          email: user.email,
          name: user.name,
          kakaoSub: user.kakaoSub,
          role: UserRole.CONSUMER, // 모든 카카오 로그인 사용자는 '일반 사용자'로 설정
          isActive: true,
        };

        // 추천인 코드가 있으면 추가
        if (finalReferralCode && finalReferralCode.trim()) {
          userData.referrerCodeUsed = finalReferralCode.trim();
          console.log('추천인 코드와 함께 사용자 생성:', finalReferralCode);
        }

        dbUser = await this.prisma.user.create({
          data: userData
        });

        console.log('새 사용자 생성됨:', {
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
          referrerCodeUsed: dbUser.referrerCodeUsed
        });
      } else {
        // 기존 사용자 정보 업데이트
        const updateData: any = {
          email: user.email,
          name: user.name,
          updatedAt: new Date(),
        };

        // 추천인 코드가 있고, 기존에 없었다면 추가
        if (finalReferralCode && finalReferralCode.trim() && !dbUser.referrerCodeUsed) {
          updateData.referrerCodeUsed = finalReferralCode.trim();
          console.log('기존 사용자에 추천인 코드 추가:', finalReferralCode);
        }

        dbUser = await this.prisma.user.update({
          where: { id: dbUser.id },
          data: updateData
        });

        console.log('기존 사용자 정보 업데이트됨:', {
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
          referrerCodeUsed: dbUser.referrerCodeUsed
        });
      }

      // 추천인 코드 사용 처리 (사용 횟수 증가)
      if (finalReferralCode && finalReferralCode.trim() && dbUser.referrerCodeUsed === finalReferralCode.trim()) {
        try {
          // 추천인 코드 테이블이 있다면 사용 횟수 증가
          // await this.prisma.referralCode.update({
          //   where: { code: finalReferralCode.trim() },
          //   data: {
          //     currentUses: {
          //       increment: 1
          //     }
          //   }
          // });
          console.log('추천인 코드 사용 처리됨:', finalReferralCode);
        } catch (error) {
          console.error('추천인 코드 사용 처리 실패:', error);
        }
      }

      // JWT 토큰 생성
      const token = this.jwtService.sign({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        kakaoSub: dbUser.kakaoSub,
      });
      
      const result = {
        token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          kakaoSub: dbUser.kakaoSub,
          referrerCodeUsed: dbUser.referrerCodeUsed,
        },
      };

      console.log('카카오 로그인 처리 완료:', result);
      return result;
    } catch (error) {
      console.error('카카오 로그인 처리 중 오류:', error);
      throw new Error('사용자 정보 저장에 실패했습니다.');
    }
  }

  async logout(res: any) {
    res.clearCookie('session');
    res.clearCookie('user_role');
    return { message: '로그아웃되었습니다.' };
  }
}
