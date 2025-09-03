import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // 모든 쿠폰 조회
  async getAllCoupons() {
    return await this.prisma.coupon.findMany({
      include: {
        userCoupons: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // 쿠폰 상세 조회
  async getCouponById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        userCoupons: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!coupon) {
      throw new Error('쿠폰을 찾을 수 없습니다.');
    }

    return coupon;
  }

  // 쿠폰 생성
  async createCoupon(createCouponDto: CreateCouponDto) {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      minAmount,
      maxAmount,
      maxUses,
      userMaxUses,
      startsAt,
      endsAt,
      isActive = true
    } = createCouponDto;

    // 코드 중복 확인
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code }
    });

    if (existingCoupon) {
      throw new Error(`쿠폰 코드 '${code}'는 이미 사용 중입니다.`);
    }

    // 최소 주문 금액과 최대 할인 금액 유효성 검증
    if (minAmount && maxAmount && minAmount < maxAmount) {
      throw new Error('최소 주문 금액은 최대 할인 금액보다 크거나 같아야 합니다.');
    }

    return await this.prisma.coupon.create({
      data: {
        code,
        name,
        description,
        discountType,
        discountValue: new Prisma.Decimal(discountValue),
        minAmount: minAmount ? new Prisma.Decimal(minAmount) : null,
        maxAmount: maxAmount ? new Prisma.Decimal(maxAmount) : null,
        maxUses,
        userMaxUses,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive
      }
    });
  }

  // 쿠폰 수정
  async updateCoupon(id: string, updateCouponDto: UpdateCouponDto) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      throw new Error('쿠폰을 찾을 수 없습니다.');
    }

    // 코드 중복 확인 (자신 제외)
    if (updateCouponDto.code && updateCouponDto.code !== existingCoupon.code) {
      const duplicateCoupon = await this.prisma.coupon.findUnique({
        where: { code: updateCouponDto.code }
      });

      if (duplicateCoupon) {
        throw new Error(`쿠폰 코드 '${updateCouponDto.code}'는 이미 사용 중입니다.`);
      }
    }

    const updateData: any = {};

    // 각 필드별 타입 변환
    if (updateCouponDto.code !== undefined) updateData.code = updateCouponDto.code;
    if (updateCouponDto.name !== undefined) updateData.name = updateCouponDto.name;
    if (updateCouponDto.description !== undefined) updateData.description = updateCouponDto.description;
    if (updateCouponDto.discountType !== undefined) updateData.discountType = updateCouponDto.discountType;
    if (updateCouponDto.discountValue !== undefined) updateData.discountValue = new Prisma.Decimal(updateCouponDto.discountValue);
    if (updateCouponDto.minAmount !== undefined) updateData.minAmount = updateCouponDto.minAmount ? new Prisma.Decimal(updateCouponDto.minAmount) : null;
    if (updateCouponDto.maxAmount !== undefined) updateData.maxAmount = updateCouponDto.maxAmount ? new Prisma.Decimal(updateCouponDto.maxAmount) : null;
    if (updateCouponDto.maxUses !== undefined) updateData.maxUses = updateCouponDto.maxUses;
    if (updateCouponDto.userMaxUses !== undefined) updateData.userMaxUses = updateCouponDto.userMaxUses;
    if (updateCouponDto.startsAt !== undefined) updateData.startsAt = updateCouponDto.startsAt ? new Date(updateCouponDto.startsAt) : null;
    if (updateCouponDto.endsAt !== undefined) updateData.endsAt = updateCouponDto.endsAt ? new Date(updateCouponDto.endsAt) : null;
    if (updateCouponDto.isActive !== undefined) updateData.isActive = updateCouponDto.isActive;

    // 최소 주문 금액과 최대 할인 금액 유효성 검증
    const minAmount = updateData.minAmount !== undefined ? updateData.minAmount : existingCoupon.minAmount;
    const maxAmount = updateData.maxAmount !== undefined ? updateData.maxAmount : existingCoupon.maxAmount;
    
    if (minAmount && maxAmount && Number(minAmount) < Number(maxAmount)) {
      throw new Error('최소 주문 금액은 최대 할인 금액보다 크거나 같아야 합니다.');
    }

    return await this.prisma.coupon.update({
      where: { id },
      data: updateData
    });
  }

  // 쿠폰 삭제 (소프트 삭제)
  async deleteCoupon(id: string) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      throw new Error('쿠폰을 찾을 수 없습니다.');
    }

    // 사용된 쿠폰인지 확인
    if (existingCoupon.currentUses > 0) {
      // 이미 사용된 쿠폰은 비활성화만
      return await this.prisma.coupon.update({
        where: { id },
        data: { isActive: false }
      });
    } else {
      // 사용되지 않은 쿠폰은 완전 삭제
      return await this.prisma.coupon.delete({
        where: { id }
      });
    }
  }

  // 쿠폰 활성화/비활성화 토글
  async toggleCouponStatus(id: string) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      throw new Error('쿠폰을 찾을 수 없습니다.');
    }

    return await this.prisma.coupon.update({
      where: { id },
      data: { isActive: !existingCoupon.isActive }
    });
  }

  // 쿠폰 코드로 유효성 검증
  async validateCoupon(code: string, userId: string, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: {
        userCoupons: {
          where: { userId }
        }
      }
    });

    if (!coupon) {
      throw new Error('존재하지 않는 쿠폰입니다.');
    }

    if (!coupon.isActive) {
      throw new Error('비활성화된 쿠폰입니다.');
    }

    // 시작일 확인
    if (coupon.startsAt && new Date() < coupon.startsAt) {
      throw new Error('아직 사용할 수 없는 쿠폰입니다.');
    }

    // 종료일 확인
    if (coupon.endsAt && new Date() > coupon.endsAt) {
      throw new Error('만료된 쿠폰입니다.');
    }

    // 전체 사용 횟수 확인
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new Error('사용 가능 횟수를 초과한 쿠폰입니다.');
    }

    // 최소 주문 금액 확인
    if (coupon.minAmount && orderAmount < Number(coupon.minAmount)) {
      throw new Error(`최소 주문 금액 ${Number(coupon.minAmount).toLocaleString()}원 이상이어야 합니다.`);
    }

    // 사용자별 사용 횟수 확인 (현재 스키마에서는 단순화)
    // TODO: 추후 UserCoupon 모델에 usageCount 추가하여 구현

    return coupon;
  }



  // 사용자의 쿠폰 목록 조회
  async getUserCoupons(userId: string) {
    //console.log('getUserCoupons 호출됨 - userId:', userId);
    
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: { 
        userId,
        deletedAt: null // 소프트 딜리트되지 않은 쿠폰만 조회
      },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            discountType: true,
            discountValue: true,
            minAmount: true,
            maxAmount: true,
            startsAt: true,
            endsAt: true,
            isActive: true,
            maxUses: true,
            currentUses: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    //console.log('조회된 사용자 쿠폰 수:', userCoupons.length);
    //console.log('조회된 사용자 쿠폰 데이터:', userCoupons);

    // 사용 가능한 쿠폰과 만료된 쿠폰을 분류
    const now = new Date();
    const result = userCoupons.map(userCoupon => {
      const coupon = userCoupon.coupon;
      const isExpired = coupon.endsAt && coupon.endsAt < now;
      const isUsageLimitReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;
      const isUsable = coupon.isActive && !isExpired && !isUsageLimitReached;

      return {
        ...userCoupon,
        coupon: {
          ...coupon,
          isExpired,
          isUsageLimitReached,
          isUsable
        }
      };
    });

    //console.log('반환할 결과:', result);
    return result;
  }

  // 쿠폰 사용 처리 (소프트 딜리트)
  async useCoupon(userId: string, couponId: string) {
    try {
      //console.log(`쿠폰 사용 처리 시작: userId=${userId}, couponId=${couponId}`);
      
      // 사용자 쿠폰 조회
      const userCoupon = await this.prisma.userCoupon.findFirst({
        where: {
          id: couponId,
          userId: userId,
          deletedAt: null // 아직 삭제되지 않은 쿠폰만
        },
        include: {
          coupon: true
        }
      });

      if (!userCoupon) {
        throw new Error('사용할 수 있는 쿠폰을 찾을 수 없습니다.');
      }

      // 쿠폰 사용 처리 (소프트 딜리트)
      await this.prisma.$transaction(async (prisma) => {
        // 1. 사용자 쿠폰 소프트 딜리트
        await prisma.userCoupon.update({
          where: { id: couponId },
          data: {
            deletedAt: new Date(),
            usageCount: userCoupon.usageCount + 1
          }
        });

        // 2. 원본 쿠폰의 사용 횟수 증가
        await prisma.coupon.update({
          where: { id: userCoupon.couponId },
          data: {
            currentUses: {
              increment: 1
            }
          }
        });
      });

      //console.log(`쿠폰 사용 처리 완료: couponId=${couponId}`);
      return {
        success: true,
        message: '쿠폰이 성공적으로 사용 처리되었습니다.'
      };
    } catch (error) {
      console.error('쿠폰 사용 처리 실패:', error);
      throw error;
    }
  }

  // 쿠폰 코드로 사용자에게 쿠폰 등록
  async registerCouponForUser(userId: string, couponCode: string) {
    return await this.prisma.$transaction(async (prisma) => {
      // 쿠폰 코드로 쿠폰 찾기
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      });

      if (!coupon) {
        throw new Error('유효하지 않은 쿠폰 코드입니다.');
      }

      if (!coupon.isActive) {
        throw new Error('사용할 수 없는 쿠폰입니다.');
      }

      // 쿠폰 유효기간 확인
      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) {
        throw new Error('아직 사용할 수 없는 쿠폰입니다.');
      }

      if (coupon.endsAt && coupon.endsAt < now) {
        throw new Error('만료된 쿠폰입니다.');
      }

      // 사용 한도 확인
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new Error('사용 한도가 초과된 쿠폰입니다.');
      }

      // 이미 등록된 쿠폰인지 확인
      const existingUserCoupon = await prisma.userCoupon.findUnique({
        where: {
          userId_couponId: {
            userId,
            couponId: coupon.id
          }
        }
      });

      if (existingUserCoupon) {
        throw new Error('이미 등록된 쿠폰입니다.');
      }

      // 사용자에게 쿠폰 등록
      const userCoupon = await prisma.userCoupon.create({
        data: {
          userId,
          couponId: coupon.id
        },
        include: {
          coupon: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              discountType: true,
              discountValue: true,
              minAmount: true,
              maxAmount: true,
              startsAt: true,
              endsAt: true,
              isActive: true,
              maxUses: true,
              currentUses: true
            }
          }
        }
      });

      return userCoupon;
    });
  }
}
