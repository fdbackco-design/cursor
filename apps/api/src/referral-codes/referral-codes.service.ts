import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralCodeDto, UpdateReferralCodeDto } from './dto';

@Injectable()
export class ReferralCodesService {
  constructor(private readonly prisma: PrismaService) {}

  // 추천 코드 상세 조회
  async getReferralCodeById(id: string) {
    return await this.prisma.referralCode.findUnique({
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
  }

  // 새 추천 코드 생성
  async createReferralCode(createReferralCodeDto: CreateReferralCodeDto) {
    const { code, isActive = true } = createReferralCodeDto;

    // 코드 중복 확인
    const existingCode = await this.prisma.referralCode.findUnique({
      where: { code }
    });

    if (existingCode) {
      throw new Error('이미 존재하는 추천 코드입니다.');
    }

    return await this.prisma.referralCode.create({
      data: {
        code,
        isActive,
        currentUses: 0
      }
    });
  }

  // 추천 코드 수정
  async updateReferralCode(id: string, updateReferralCodeDto: UpdateReferralCodeDto) {
    const { code, isActive } = updateReferralCodeDto;

    // 코드 중복 확인 (자신 제외)
    if (code) {
      const existingCode = await this.prisma.referralCode.findFirst({
        where: {
          code,
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
        code,
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
