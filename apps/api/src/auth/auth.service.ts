import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@repo/db';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AddressesService } from '../addresses/addresses.service';


@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(AuthService.name); 
  constructor(
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly addressesService: AddressesService
  ) {}

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
        phoneNumber: payload.phoneNumber,
        shippingAddress: payload.shippingAddress,
        talkMessageAgreed: payload.talkMessageAgreed,
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
        phoneNumber: true,
        shippingAddress: true,
        talkMessageAgreed: true,
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
      phoneNumber: user.phoneNumber,
      shippingAddress: user.shippingAddress,
      talkMessageAgreed: user.talkMessageAgreed,
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
      const validCodes = ['WELCOME10', 'NEWUSER20', 'SPECIAL30', 'FEEDBACK2024', 'LIVE', 'TEST'];
      return validCodes.includes(referralCode.toUpperCase());
    } catch (error) {
      console.error('추천인 코드 검증 에러:', error);
      return false;
    }
  }

  /**
   * 전화번호를 한국 형식으로 정규화 (+82 10-1234-5678 → 01012345678)
   */
  private normalizePhoneNumber(phoneNumber: string | null): string | null {
    if (!phoneNumber) return null;
    
    // 모든 공백, 하이픈, 특수문자 제거
    let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
    
    // +82 로 시작하는 경우 한국 번호로 변환
    if (cleaned.startsWith('82')) {
      cleaned = cleaned.substring(2); // 82 제거
      if (cleaned.startsWith('10')) {
        cleaned = '0' + cleaned; // 010으로 시작하도록
      }
    }
    
    // 01012345678 형식인지 검증 (010, 011, 016, 017, 018, 019로 시작하는 11자리)
    const phoneRegex = /^01[0-9]\d{8}$/;
    if (phoneRegex.test(cleaned)) {
      return cleaned;
    }
    
    this.logger.warn(`Invalid phone number format: ${phoneNumber} -> ${cleaned}`);
    return null;
  }

  /**
   * 카카오 로그인 처리
   * - 신규 가입 시에만 referrerCodeUsed 기록 (정책: "신규 가입 1회만")
   * - 기존 회원은 추천인 코드 미기록/미수정
   * - 카카오 추가 동의 항목들 저장
   */
  async handleKakaoLogin(
    user: { 
      email?: string | null; 
      name?: string | null; 
      kakaoSub: string;
      phoneNumber?: string | null;
      shippingAddress?: any | null;
      talkMessageAgreed?: boolean;
    },
    referralCode?: string,
  ) {
    this.logger.log(`handleKakaoLogin: kakaoSub=${user.kakaoSub}, referral="${referralCode ?? ''}"`);
  
    // 0) 기본 정리
    const cleanName = (user.name ?? '').trim() || '카카오사용자';
    const cleanEmail = user.email?.trim() || null;
    const cleanRef = referralCode?.trim();
    const cleanPhoneNumber = this.normalizePhoneNumber(user.phoneNumber);
    const cleanShippingAddress = user.shippingAddress || null;
    const cleanTalkMessageAgreed = user.talkMessageAgreed ?? false;
    
    this.logger.log(`전화번호 정규화: "${user.phoneNumber}" -> "${cleanPhoneNumber}"`);
  
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
          // 카카오 추가 정보 저장
          phoneNumber: cleanPhoneNumber,
          shippingAddress: cleanShippingAddress,
          talkMessageAgreed: cleanTalkMessageAgreed,
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
        // 카카오 추가 정보
        phoneNumber: cleanPhoneNumber,
        shippingAddress: cleanShippingAddress,
        talkMessageAgreed: cleanTalkMessageAgreed,
        ...( cleanRef ? { referrerCodeUsed: cleanRef } : {} ),
      };
      dbUser = await this.prisma.user.create({ data });
      this.logger.log(`User created: id=${dbUser.id}, role=${dbUser.role}, ref=${dbUser.referrerCodeUsed ?? ''}, approve=${dbUser.approve}`);
      
      // 새 사용자 등록 AuditLog 추가
      try {
        await this.auditLogService.logUserRegistration(dbUser.id, {
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role
        });
      } catch (error) {
        this.logger.error('사용자 등록 AuditLog 생성 실패:', error);
      }

      // shippingAddress가 있으면 UserAddress 테이블에 기본 배송지로 저장
      if (cleanShippingAddress && typeof cleanShippingAddress === 'object') {
        try {
          await this.createDefaultUserAddress(dbUser.id, dbUser.name, cleanShippingAddress);
          this.logger.log(`기본 배송지 생성 완료: userId=${dbUser.id}`);
        } catch (error) {
          this.logger.error('기본 배송지 생성 실패:', error);
        }
      }
    } else {
      // 4) 기존 유저 (이미 kakaoSub 보유)
      const roleStr = String(dbUser.role).toUpperCase();
      const looksUnlinkedByName = dbUser.name === '미연동 계정';          // 현 DB 패턴
      const isUnlinkedRole = roleStr.includes('UNLINKED') || roleStr.includes('미연동');
  
      const updateData: any = {
        // 이름이 '미연동 계정'이면 카카오 측 이름으로 정정
        name: looksUnlinkedByName ? cleanName : (dbUser.name ?? cleanName),
        email: cleanEmail ?? dbUser.email,
        // 카카오 추가 정보 업데이트 (기존 값이 없거나 새로운 값이 있을 때)
        phoneNumber: cleanPhoneNumber ?? dbUser.phoneNumber,
        shippingAddress: cleanShippingAddress ?? dbUser.shippingAddress,
        talkMessageAgreed: cleanTalkMessageAgreed,
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
      phoneNumber: dbUser.phoneNumber,
      shippingAddress: dbUser.shippingAddress,
      talkMessageAgreed: dbUser.talkMessageAgreed,
    });

    // 로그인 AuditLog 추가
    try {
      await this.auditLogService.logUserLogin(dbUser.id, {
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      });
    } catch (error) {
      this.logger.error('로그인 AuditLog 생성 실패:', error);
    }

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
        phoneNumber: dbUser.phoneNumber,
        shippingAddress: dbUser.shippingAddress,
        talkMessageAgreed: dbUser.talkMessageAgreed,
      },
    };
  }
  async logout(res: Response) {
    res.clearCookie('session');
    res.clearCookie('user_role');
    res.clearCookie('access_token', { path: '/' });
    return { message: '로그아웃되었습니다.' };
  }

  // shippingAddress 데이터를 UserAddress 테이블에 기본 배송지로 생성
  private async createDefaultUserAddress(userId: string, userName: string, shippingAddress: any) {
    // shippingAddress 구조 확인 및 매핑
    const addressData = {
      name: '기본 배송지',
      receiverName: shippingAddress.receiver_name || userName,
      receiverPhoneNumber1: shippingAddress.receiver_phone_number1 || '',
      receiverPhoneNumber2: shippingAddress.receiver_phone_number2 || undefined,
      zoneNumber: shippingAddress.zone_number || '',
      baseAddress: shippingAddress.base_address || '',
      detailAddress: shippingAddress.detail_address || '',
      isDefault: true,
    };

    // 필수 필드가 있는 경우에만 생성
    if (addressData.zoneNumber && addressData.baseAddress) {
      await this.addressesService.create(userId, addressData);
      this.logger.log(`기본 배송지 데이터: ${JSON.stringify(addressData)}`);
    } else {
      this.logger.warn(`기본 배송지 생성 스킵: 필수 필드 누락 (우편번호: ${addressData.zoneNumber}, 주소: ${addressData.baseAddress})`);
    }
  }
}