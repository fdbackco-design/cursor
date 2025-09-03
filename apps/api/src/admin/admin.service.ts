import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    // 날짜 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    // 모든 데이터를 병렬로 가져오기
    const [
      totalProducts,
      activeSellers,
      todayActivities,
      lowStockProducts,
      yesterdayActivities,
      yesterdayProducts,
      dayBeforeYesterdayProducts,
      yesterdaySellers,
      dayBeforeYesterdaySellers
    ] = await Promise.all([
      // 현재 총 상품 수
      this.prisma.product.count({
        where: { isActive: true }
      }),
      // 현재 활성 셀러 수
      this.prisma.seller.count({
        where: { isActive: true, isVerified: true }
      }),
      // 오늘 로그인 활동 수
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      // 재고 부족 상품 수
      this.prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lt: 10 }
        }
      }),
      // 어제 로그인 활동 수
      this.prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: yesterday, lt: today }
        }
      }),
      // 어제까지 생성된 상품 수
      this.prisma.product.count({
        where: {
          isActive: true,
          createdAt: { lt: today }
        }
      }),
      // 전전일까지 생성된 상품 수
      this.prisma.product.count({
        where: {
          isActive: true,
          createdAt: { lt: yesterday }
        }
      }),
      // 어제까지 생성된 셀러 수
      this.prisma.seller.count({
        where: {
          isActive: true,
          isVerified: true,
          createdAt: { lt: today }
        }
      }),
      // 전전일까지 생성된 셀러 수
      this.prisma.seller.count({
        where: {
          isActive: true,
          isVerified: true,
          createdAt: { lt: yesterday }
        }
      })
    ]);

    // 증감률 계산
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    };

    // 실제 전일 대비 계산
    const productChange = calculateChange(yesterdayProducts, dayBeforeYesterdayProducts);
    const sellerChange = calculateChange(yesterdaySellers, dayBeforeYesterdaySellers);
    const activityChange = calculateChange(todayActivities, yesterdayActivities);

    return {
      totalProducts: {
        value: totalProducts.toString(),
        change: productChange,
        changeType: yesterdayProducts >= dayBeforeYesterdayProducts ? 'positive' : 'negative'
      },
      activeSellers: {
        value: activeSellers.toString(),
        change: sellerChange,
        changeType: yesterdaySellers >= dayBeforeYesterdaySellers ? 'positive' : 'negative'
      },
      todayOrders: {
        value: todayActivities.toString(),
        change: activityChange,
        changeType: todayActivities >= yesterdayActivities ? 'positive' : 'negative'
      },
      lowStockProducts: {
        value: lowStockProducts.toString(),
        change: lowStockProducts > 5 ? `-${(lowStockProducts / 10 * 100).toFixed(1)}%` : '+0%',
        changeType: lowStockProducts > 5 ? 'negative' : 'positive'
      }
    };
  }
}
