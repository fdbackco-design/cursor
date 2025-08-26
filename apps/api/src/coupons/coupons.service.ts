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
    console.log('=== 유효성 검증 ===');
    console.log('minAmount:', minAmount, typeof minAmount);
    console.log('maxAmount:', maxAmount, typeof maxAmount);
    console.log('minAmount < maxAmount:', minAmount && maxAmount && minAmount < maxAmount);
    
    if (minAmount && maxAmount && minAmount < maxAmount) {
      console.log('유효성 검증 실패: 최소 주문 금액이 최대 할인 금액보다 작습니다.');
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

  // 쿠폰 사용 처리
  async useCoupon(couponId: string, userId: string) {
    return await this.prisma.$transaction(async (prisma) => {
      // 쿠폰 사용 횟수 증가
      const updatedCoupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } }
      });

      // 사용자 쿠폰 사용 기록 생성 (단순화된 버전)
      await prisma.userCoupon.upsert({
        where: {
          userId_couponId: {
            userId,
            couponId
          }
        },
        update: {
          updatedAt: new Date()
        },
        create: {
          userId,
          couponId
        }
      });

      return updatedCoupon;
    });
  }
}
