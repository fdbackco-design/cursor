import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralCodeDto, UpdateReferralCodeDto } from './dto';
import { UserRole } from '@repo/db';

@Injectable()
export class ReferralCodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * code 필드에서 roleType을 추출 (BIZ_ 접두사가 있으면 BIZ, 없으면 CONSUMER)
   */
  private extractRoleTypeFromCode(code: string): UserRole {
    return code.startsWith('BIZ_') ? UserRole.BIZ : UserRole.CONSUMER;
  }

  /**
   * roleType에 따라 code 필드에 접두사 추가
   */
  private encodeCodeWithRoleType(code: string, roleType?: UserRole): string {
    if (roleType === UserRole.BIZ) {
      // 이미 BIZ_ 접두사가 있으면 그대로, 없으면 추가
      return code.startsWith('BIZ_') ? code : `BIZ_${code}`;
    }
    // CONSUMER인 경우 BIZ_ 접두사 제거
    return code.startsWith('BIZ_') ? code.replace(/^BIZ_/, '') : code;
  }

  // 모든 추천 코드 목록 조회 (roleType 정보 포함)
  async getAllReferralCodes() {
    const codes = await this.prisma.referralCode.findMany({
      include: {
        seller: {
          select: {
            id: true,
            companyName: true,
            representativeName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // code에서 roleType 추출하여 반환 (프론트엔드에서 사용할 수 있도록)
    return codes.map(code => ({
      ...code,
      roleType: this.extractRoleTypeFromCode(code.code),
      // 원본 code (접두사 제거된 버전)도 함께 제공
      displayCode: code.code.startsWith('BIZ_') ? code.code.replace(/^BIZ_/, '') : code.code
    }));
  }

  // 추천 코드 상세 조회 (roleType 정보 포함)
  async getReferralCodeById(id: string) {
    const code = await this.prisma.referralCode.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            companyName: true,
            representativeName: true
          }
        }
      }
    });

    if (!code) {
      return null;
    }

    return {
      ...code,
      roleType: this.extractRoleTypeFromCode(code.code),
      displayCode: code.code.startsWith('BIZ_') ? code.code.replace(/^BIZ_/, '') : code.code
    };
  }

  /**
   * 추천 코드로 roleType 조회 (Auth Service에서 사용)
   */
  async getRoleTypeByCode(code: string): Promise<UserRole> {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code }
    });

    if (!referralCode) {
      return UserRole.CONSUMER; // 기본값
    }

    return this.extractRoleTypeFromCode(referralCode.code);
  }

  // 새 추천 코드 생성
  async createReferralCode(createReferralCodeDto: CreateReferralCodeDto) {
    const { code, isActive = true, roleType = UserRole.CONSUMER } = createReferralCodeDto;

    // roleType에 따라 code에 접두사 추가
    const encodedCode = this.encodeCodeWithRoleType(code, roleType);

    // 코드 중복 확인 (인코딩된 코드로 확인)
    const existingCode = await this.prisma.referralCode.findUnique({
      where: { code: encodedCode }
    });

    if (existingCode) {
      throw new Error('이미 존재하는 추천 코드입니다.');
    }

    return await this.prisma.referralCode.create({
      data: {
        code: encodedCode,
        isActive,
        currentUses: 0
      }
    });
  }

  // 추천 코드 수정
  async updateReferralCode(id: string, updateReferralCodeDto: UpdateReferralCodeDto) {
    const { code, isActive, roleType } = updateReferralCodeDto;

    // 기존 코드 조회
    const existingReferralCode = await this.prisma.referralCode.findUnique({
      where: { id }
    });

    if (!existingReferralCode) {
      throw new Error('추천 코드를 찾을 수 없습니다.');
    }

    // roleType이 제공되면 code에 접두사 적용, code만 제공되면 기존 roleType 유지
    let encodedCode = code;
    if (roleType !== undefined) {
      // roleType이 명시적으로 제공된 경우
      encodedCode = code ? this.encodeCodeWithRoleType(code, roleType) : existingReferralCode.code;
    } else if (code) {
      // code만 제공된 경우, 기존 roleType 유지
      const currentRoleType = this.extractRoleTypeFromCode(existingReferralCode.code);
      encodedCode = this.encodeCodeWithRoleType(code, currentRoleType);
    } else {
      encodedCode = existingReferralCode.code;
    }

    // 코드 중복 확인 (자신 제외)
    if (encodedCode && encodedCode !== existingReferralCode.code) {
      const existingCode = await this.prisma.referralCode.findFirst({
        where: {
          code: encodedCode,
          id: { not: id }
        }
      });

      if (existingCode) {
        throw new Error('이미 존재하는 추천 코드입니다.');
      }
    }

    return await this.prisma.referralCode.update({
      where: { id },
      data: {
        code: encodedCode,
        isActive
      }
    });
  }

  // 추천 코드 삭제
  async deleteReferralCode(id: string) {
    return await this.prisma.referralCode.delete({
      where: { id }
    });
  }

  // 추천 코드 상태 토글
  async toggleReferralCodeStatus(id: string) {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { id }
    });

    if (!referralCode) {
      throw new Error('추천 코드를 찾을 수 없습니다.');
    }

    return await this.prisma.referralCode.update({
      where: { id },
      data: { isActive: !referralCode.isActive }
    });
  }
}
