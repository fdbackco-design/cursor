import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateReferralCodeDto } from '../referral-codes/dto';

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService
  ) {}

  // 모든 셀러 조회 (사용자 정보 포함)
  async getAllSellers() {
    const sellers = await this.prisma.seller.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approve: true,
            isActive: true,
            createdAt: true
          }
        },
        referralCodes: {
          select: {
            id: true,
            code: true,
            currentUses: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 각 셀러의 추가 정보 계산
    return sellers.map(seller => ({
      ...seller,
      referralCodeCount: seller.referralCodes.length,
      totalReferralUses: seller.referralCodes.reduce((sum, code) => sum + code.currentUses, 0)
    }));
  }

  // 셀러 상세 조회
  async getSellerById(id: string) {
    return await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approve: true,
            isActive: true,
            createdAt: true
          }
        },
        referralCodes: {
          select: {
            id: true,
            code: true,
            currentUses: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });
  }

  // 새 셀러 생성
  async createSeller(createSellerDto: CreateSellerDto) {
    const { 
      userId, 
      companyName, 
      representativeName, 
      phone, 
      address,
      referralCodes
    } = createSellerDto;

    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 전화번호 중복 확인
    const existingSeller = await this.prisma.seller.findUnique({
      where: { phone }
    });

    if (existingSeller) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    // 추천 코드 중복 확인 (제공된 경우)
    if (referralCodes && referralCodes.length > 0) {
      for (const code of referralCodes) {
        const existingCode = await this.prisma.referralCode.findUnique({
          where: { code }
        });
        if (existingCode) {
          throw new Error(`추천 코드 '${code}'는 이미 사용 중입니다.`);
        }
      }
    }

    // 트랜잭션으로 셀러와 추천 코드를 함께 생성
    return await this.prisma.$transaction(async (prisma) => {
      // 1. 셀러 생성
      const newSeller = await prisma.seller.create({
        data: {
          userId,
          companyName,
          representativeName,
          phone,
          address,
          isVerified: false,
          isActive: true
        } as any
      });

      // 2. 추천 코드 생성
      const createdReferralCodes = [];

      // 사용자 지정 추천 코드 생성
      if (referralCodes && referralCodes.length > 0) {
        for (const code of referralCodes) {
          const referralCode = await prisma.referralCode.create({
            data: {
              code,
              sellerId: newSeller.id,
              isActive: true
            }
          });
          createdReferralCodes.push(referralCode);
        }
      }

      // 3. 최종 셀러 정보 반환 (관계 포함)
      return await prisma.seller.findUnique({
        where: { id: newSeller.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          referralCodes: {
            select: {
              id: true,
              code: true,
              currentUses: true,
              isActive: true,
              createdAt: true
            }
          }
        }
      });
    });
  }

  // createSeller 메서드에 AuditLog 추가를 위한 오버로드
  async createSellerWithAudit(createSellerDto: CreateSellerDto, createdByUserId?: string) {
    const newSeller = await this.createSeller(createSellerDto);
    
    // 셀러 등록 AuditLog 추가
    if (createdByUserId) {
      try {
        await this.auditLogService.logSellerRegistration(createdByUserId, newSeller.id, {
          companyName: newSeller.companyName,
          representativeName: newSeller.representativeName,
          phone: newSeller.phone
        });
      } catch (error) {
        console.error('셀러 등록 AuditLog 추가 실패:', error);
      }
    }
    
    return newSeller;
  }

  // 셀러 수정
  async updateSeller(id: string, updateSellerDto: UpdateSellerDto) {
    const { 
      companyName, 
      representativeName, 
      phone, 
      address
    } = updateSellerDto;

    // 전화번호 중복 확인 (자신 제외)
    if (phone) {
      const existingSeller = await this.prisma.seller.findFirst({
        where: {
          phone,
          id: { not: id }
        }
      });

      if (existingSeller) {
        throw new Error('이미 등록된 전화번호입니다.');
      }
    }

    return await this.prisma.seller.update({
      where: { id },
      data: {
        companyName,
        representativeName,
        phone,
        address
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
  }

  // 셀러 삭제 (소프트 삭제)
  async deleteSeller(id: string) {
    return await this.prisma.seller.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // 셀러 상태 토글
  async toggleSellerStatus(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id }
    });

    if (!seller) {
      throw new Error('셀러를 찾을 수 없습니다.');
    }

    return await this.prisma.seller.update({
      where: { id },
      data: { isActive: !seller.isActive }
    });
  }

  // 셀러 인증 상태 토글
  async toggleSellerVerification(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id }
    });

    if (!seller) {
      throw new Error('셀러를 찾을 수 없습니다.');
    }

    return await this.prisma.seller.update({
      where: { id },
      data: { isVerified: !seller.isVerified }
    });
  }

  // 셀러별 추천 코드 생성
  async createReferralCode(sellerId: string, createReferralCodeDto: CreateReferralCodeDto) {
    const { code, isActive = true } = createReferralCodeDto;

    // 셀러 존재 여부 확인
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId }
    });

    if (!seller) {
      throw new Error('셀러를 찾을 수 없습니다.');
    }

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
        currentUses: 0,
        sellerId
      }
    });
  }
}
