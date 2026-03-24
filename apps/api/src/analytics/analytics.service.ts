import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  /** 결제·배송 진행 중인 주문만 매출에 포함 */
  private readonly ORDER_STATUSES_FOR_REVENUE = [
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
  ] as const;

  constructor(private prisma: PrismaService) {}

  private getDateRange(period: string) {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  }

  /** 동일 길이의 직전 기간 (성장률 비교용) */
  private getPreviousPeriodRange(period: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime());
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    return { startDate: prevStart, endDate: prevEnd };
  }

  /** 최근 12개월(달력) 각 월의 시작·끝 — 차트용 */
  private getLast12MonthBounds(endDate: Date) {
    const y = endDate.getFullYear();
    const m = endDate.getMonth();
    const months: { start: Date; end: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(y, m - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      months.push({ start, end });
    }
    return { months, rangeStart: months[0].start, rangeEnd: months[11].end };
  }

  private pctGrowth(current: number, previous: number): number {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  /**
   * 셀러별 매출: 해당 셀러의 추천인 코드로 **가입한** 사용자(User.referrerCodeUsed)의
   * 완료 주문 매출을 귀속 (결제 시 주문의 referralCodeUsed와 무관)
   */
  async getSellerSales(period: string, sellerId?: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const { startDate: prevStart, endDate: prevEnd } =
      this.getPreviousPeriodRange(period);
    const { months: monthBounds, rangeStart, rangeEnd } =
      this.getLast12MonthBounds(endDate);

    const sellers = await this.prisma.seller.findMany({
      where: {
        ...(sellerId ? { id: sellerId } : {}),
        isActive: true,
        isVerified: true,
      },
      include: {
        referralCodes: { select: { code: true } },
        user: { select: { name: true, email: true } },
      },
    });

    const codeToSellerId = new Map<string, string>();
    for (const s of sellers) {
      for (const rc of s.referralCodes) {
        codeToSellerId.set(rc.code.trim().toUpperCase(), s.id);
      }
    }

    const exactCodes = [
      ...new Set(sellers.flatMap((s) => s.referralCodes.map((c) => c.code))),
    ];

    const referredUsers =
      exactCodes.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: { referrerCodeUsed: { in: exactCodes } },
            select: { id: true, referrerCodeUsed: true },
          });

    const userIdToSellerId = new Map<string, string>();
    for (const u of referredUsers) {
      const ref = u.referrerCodeUsed?.trim();
      if (!ref) continue;
      const sid = codeToSellerId.get(ref.toUpperCase());
      if (sid) userIdToSellerId.set(u.id, sid);
    }

    const attributedUserIds = [...userIdToSellerId.keys()];

    const emptyOrders = () =>
      Promise.resolve(
        [] as Array<{
          userId: string;
          totalAmount: unknown;
          createdAt: Date;
        }>,
      );

    const [ordersCurrent, ordersPrev, ordersChart, orderItemsForProducts] =
      await Promise.all([
        attributedUserIds.length === 0
          ? emptyOrders()
          : this.prisma.order.findMany({
              where: {
                status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
                createdAt: { gte: startDate, lte: endDate },
                userId: { in: attributedUserIds },
              },
              select: {
                userId: true,
                totalAmount: true,
              },
            }),
        attributedUserIds.length === 0
          ? emptyOrders()
          : this.prisma.order.findMany({
              where: {
                status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
                createdAt: { gte: prevStart, lte: prevEnd },
                userId: { in: attributedUserIds },
              },
              select: {
                userId: true,
                totalAmount: true,
              },
            }),
        attributedUserIds.length === 0
          ? emptyOrders()
          : this.prisma.order.findMany({
              where: {
                status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
                createdAt: { gte: rangeStart, lte: rangeEnd },
                userId: { in: attributedUserIds },
              },
              select: {
                userId: true,
                totalAmount: true,
                createdAt: true,
              },
            }),
        attributedUserIds.length === 0
          ? Promise.resolve(
              [] as Array<{
                productId: string;
                order: { userId: string };
              }>,
            )
          : this.prisma.orderItem.findMany({
              where: {
                order: {
                  status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
                  createdAt: { gte: startDate, lte: endDate },
                  userId: { in: attributedUserIds },
                },
              },
              select: {
                productId: true,
                order: { select: { userId: true } },
              },
            }),
      ]);

    const sellerSalesData = sellers.map((seller) => {
      const matchesSeller = (userId: string) =>
        userIdToSellerId.get(userId) === seller.id;

      let currentSum = 0;
      let currentCount = 0;
      for (const o of ordersCurrent) {
        if (matchesSeller(o.userId)) {
          currentSum += Number(o.totalAmount);
          currentCount += 1;
        }
      }

      let previousSum = 0;
      for (const o of ordersPrev) {
        if (matchesSeller(o.userId)) {
          previousSum += Number(o.totalAmount);
        }
      }

      const productIds = new Set<string>();
      for (const row of orderItemsForProducts) {
        if (matchesSeller(row.order.userId)) {
          productIds.add(row.productId);
        }
      }

      const salesByMonth = monthBounds.map(({ start, end }) => {
        let m = 0;
        for (const o of ordersChart) {
          if (!matchesSeller(o.userId)) continue;
          if (o.createdAt >= start && o.createdAt <= end) {
            m += Number(o.totalAmount);
          }
        }
        return Math.round(m);
      });

      const totalSales = Math.round(currentSum);
      const totalOrders = currentCount;
      const averageOrderValue =
        totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

      return {
        id: seller.id,
        name: seller.companyName,
        category: '추천인 매출',
        totalSales,
        totalOrders,
        totalProducts: productIds.size,
        monthlyGrowth: this.pctGrowth(currentSum, previousSum),
        averageOrderValue,
        salesByMonth,
      };
    });

    return sellerSalesData;
  }

  /**
   * 셀러별 매출 상세: 추천인으로 유입된 고객의 기간 내 완료 주문 목록
   * (주문일시, 고객명, 연락처, 상품 요약)
   */
  async getSellerSalesOrderDetail(sellerId: string, period: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { id: sellerId, isActive: true, isVerified: true },
      include: { referralCodes: { select: { code: true } } },
    });
    if (!seller) {
      throw new NotFoundException('셀러를 찾을 수 없습니다.');
    }

    const exactCodes = [
      ...new Set(seller.referralCodes.map((c) => c.code)),
    ];
    const codeToSeller = new Map(
      seller.referralCodes.map(
        (rc) => [rc.code.trim().toUpperCase(), seller.id] as const,
      ),
    );

    let userIds: string[] = [];
    if (exactCodes.length > 0) {
      const referredUsers = await this.prisma.user.findMany({
        where: { referrerCodeUsed: { in: exactCodes } },
        select: { id: true, referrerCodeUsed: true },
      });
      userIds = referredUsers
        .filter(
          (u) =>
            u.referrerCodeUsed &&
            codeToSeller.get(u.referrerCodeUsed.trim().toUpperCase()) ===
              seller.id,
        )
        .map((u) => u.id);
    }

    const { startDate, endDate } = this.getDateRange(period);

    if (userIds.length === 0) {
      return {
        sellerName: seller.companyName,
        sellerId: seller.id,
        period,
        orders: [] as Array<{
          orderId: string;
          orderNumber: string;
          orderDate: string;
          customerName: string;
          phone: string;
          products: string;
        }>,
      };
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
        createdAt: { gte: startDate, lte: endDate },
        userId: { in: userIds },
      },
      include: {
        user: { select: { name: true, phoneNumber: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      sellerName: seller.companyName,
      sellerId: seller.id,
      period,
      orders: orders.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.createdAt.toISOString(),
        customerName: o.user.name,
        phone: o.user.phoneNumber ?? '',
        products: o.items
          .map((i) => `${i.productName} ×${i.quantity}`)
          .join(', '),
      })),
    };
  }

  /**
   * 벤더별 매출: OrderItem.finalPrice 합계 (해당 상품의 vendorId 기준)
   */
  async getVendorSales(period: string, vendorId?: string) {
    const { startDate, endDate } = this.getDateRange(period);
    const { startDate: prevStart, endDate: prevEnd } =
      this.getPreviousPeriodRange(period);
    const { months: monthBounds, rangeStart, rangeEnd } =
      this.getLast12MonthBounds(endDate);

    const vendors = await this.prisma.vendor.findMany({
      where: {
        ...(vendorId ? { id: vendorId } : {}),
        isActive: true,
      },
      include: {
        products: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
      },
    });

    const vendorIds = vendors.map((v) => v.id);
    if (vendorIds.length === 0) return [];

    const orderWhere = (from: Date, to: Date) => ({
      status: { in: [...this.ORDER_STATUSES_FOR_REVENUE] },
      createdAt: { gte: from, lte: to },
    });

    const itemsCurrent = await this.prisma.orderItem.findMany({
      where: {
        product: { vendorId: { in: vendorIds } },
        order: orderWhere(startDate, endDate),
      },
      include: {
        product: { select: { name: true, vendorId: true } },
        order: { select: { createdAt: true } },
      },
    });

    const itemsPrev = await this.prisma.orderItem.findMany({
      where: {
        product: { vendorId: { in: vendorIds } },
        order: orderWhere(prevStart, prevEnd),
      },
      include: {
        product: { select: { name: true, vendorId: true } },
        order: { select: { createdAt: true } },
      },
    });

    const itemsChart = await this.prisma.orderItem.findMany({
      where: {
        product: { vendorId: { in: vendorIds } },
        order: orderWhere(rangeStart, rangeEnd),
      },
      include: {
        product: { select: { name: true, vendorId: true } },
        order: { select: { createdAt: true } },
      },
    });

    const vendorSalesData = vendors.map((vendor) => {
      const vid = vendor.id;
      const cur = itemsCurrent.filter((i) => i.product.vendorId === vid);
      const prev = itemsPrev.filter((i) => i.product.vendorId === vid);
      const chart = itemsChart.filter((i) => i.product.vendorId === vid);

      const totalSales = Math.round(
        cur.reduce((s, i) => s + Number(i.finalPrice), 0),
      );
      const prevSum = prev.reduce((s, i) => s + Number(i.finalPrice), 0);

      const orderIds = new Set(cur.map((i) => i.orderId));
      const totalOrders = orderIds.size;

      const productAgg: Record<string, number> = {};
      for (const i of cur) {
        const n = i.product.name;
        productAgg[n] = (productAgg[n] || 0) + i.quantity;
      }
      const topProducts = Object.entries(productAgg)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      const activeNames = vendor.products.map((p) => p.name);
      const topProductsFinal =
        topProducts.length > 0
          ? topProducts
          : activeNames.slice(0, 3);

      const salesByMonth = monthBounds.map(({ start, end }) => {
        let m = 0;
        for (const i of chart) {
          if (i.product.vendorId !== vid) continue;
          const t = i.order.createdAt;
          if (t >= start && t <= end) {
            m += Number(i.finalPrice);
          }
        }
        return Math.round(m);
      });

      const averageOrderValue =
        totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

      return {
        id: vendor.id,
        name: vendor.name,
        code: vendor.code,
        totalSales,
        totalOrders,
        totalProducts: vendor.products.length,
        monthlyGrowth: this.pctGrowth(
          cur.reduce((s, i) => s + Number(i.finalPrice), 0),
          prevSum,
        ),
        averageOrderValue,
        topProducts: topProductsFinal,
        salesByMonth,
      };
    });

    return vendorSalesData;
  }

  async getProductSales(period: string, productId?: string) {
    const { startDate, endDate } = this.getDateRange(period);

    //console.log(`[Analytics] 상품별 매출 조회 시작: period=${period}, productId=${productId || 'all'}`);

    // 실제 OrderItem 데이터를 사용하여 상품별 매출 계산
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        ...(productId ? { productId } : {}),
        order: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] // 완료된 주문만
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                name: true,
                code: true
              }
            },
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    // 상품별로 집계
    const productSalesMap = new Map<string, {
      product: any;
      unitsSold: number;
      totalRevenue: number;
      orderCount: number;
    }>();

    orderItems.forEach(item => {
      const productId = item.productId;
      const existing = productSalesMap.get(productId);
      
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.totalRevenue += Number(item.finalPrice);
        existing.orderCount += 1;
      } else {
        productSalesMap.set(productId, {
          product: item.product,
          unitsSold: item.quantity,
          totalRevenue: Number(item.finalPrice),
          orderCount: 1
        });
      }
    });

    // 반품율 계산을 위한 Return 데이터 조회
    const returns = await this.prisma.return.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        ...(productId ? { orderItem: { productId } } : {})
      },
      include: {
        orderItem: {
          select: {
            productId: true,
            quantity: true
          }
        }
      }
    });

    // 상품별 반품 수량 계산
    const returnMap = new Map<string, number>();
    returns.forEach(returnItem => {
      if (returnItem.orderItem) {
        const productId = returnItem.orderItem.productId;
        const quantity = returnItem.orderItem.quantity;
        returnMap.set(productId, (returnMap.get(productId) || 0) + quantity);
      }
    });

    // 결과 데이터 생성
    const productSalesData = Array.from(productSalesMap.values()).map(({ product, unitsSold, totalRevenue, orderCount }) => {
      const totalReturns = returnMap.get(product.id) || 0;
      const returnRate = unitsSold > 0 ? (totalReturns / unitsSold) * 100 : 0;

      return {
        id: product.id,
        name: product.name,
        vendor: product.vendor?.name || '알 수 없음',
        category: product.category?.name || '기타',
        price: Number(product.priceB2C),
        unitsSold,
        totalRevenue,
        returnRate: Math.round(returnRate * 100) / 100,
        salesTrend: Array.from({ length: 30 }, () => 
          Math.floor(Math.random() * 10) + 1
        )
      };
    });

    // 매출순으로 정렬
    const sortedData = productSalesData.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    //console.log(`[Analytics] 상품별 매출 조회 완료: ${sortedData.length}개 상품`);
    
    return sortedData;
  }

  async getPopularProducts(period: string, limit: number) {
    //console.log(`[Analytics] 인기상품 조회 시작: period=${period}, limit=${limit}`);
    
    const productSales = await this.getProductSales(period);
    
    const popularProducts = productSales
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit)
      .map((product, index) => ({
        rank: index + 1,
        ...product
      }));
    
    //console.log(`[Analytics] 인기상품 조회 완료: ${popularProducts.length}개 상품`);
    
    return popularProducts;
  }

  async getReturnRate(period: string, productId?: string) {
    const { startDate, endDate } = this.getDateRange(period);

    // 실제 OrderItem과 Return 데이터를 사용하여 반품율 계산
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        ...(productId ? { productId } : {}),
        order: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                name: true
              }
            },
            category: {
              select: {
                name: true
              }
            }
          }
        },
        returns: {
          where: {
            status: {
              in: ['APPROVED', 'PROCESSING', 'COMPLETED']
            }
          }
        }
      }
    });

    // 상품별로 집계
    const productReturnMap = new Map<string, {
      product: any;
      totalSold: number;
      totalReturns: number;
      returnReasons: Map<string, number>;
    }>();

    orderItems.forEach(item => {
      const productId = item.productId;
      const existing = productReturnMap.get(productId);
      
      if (existing) {
        existing.totalSold += item.quantity;
        existing.totalReturns += item.returns.length;
        
        // 반품 사유별 집계
        item.returns.forEach(returnItem => {
          const reason = returnItem.reason;
          existing.returnReasons.set(reason, (existing.returnReasons.get(reason) || 0) + 1);
        });
      } else {
        const returnReasons = new Map<string, number>();
        item.returns.forEach(returnItem => {
          const reason = returnItem.reason;
          returnReasons.set(reason, (returnReasons.get(reason) || 0) + 1);
        });

        productReturnMap.set(productId, {
          product: item.product,
          totalSold: item.quantity,
          totalReturns: item.returns.length,
          returnReasons
        });
      }
    });

    // 결과 데이터 생성
    const returnRateData = Array.from(productReturnMap.values()).map(({ product, totalSold, totalReturns, returnReasons }) => {
      const returnRate = totalSold > 0 ? (totalReturns / totalSold) * 100 : 0;

      // 반품 사유별 통계 (실제 데이터 기반)
      const returnReasonsArray = Array.from(returnReasons.entries()).map(([reason, count]) => ({
        reason: this.categorizeReturnReason(reason),
        count
      }));

      // 반품 사유가 없는 경우 기본값 설정
      if (returnReasonsArray.length === 0 && totalReturns > 0) {
        returnReasonsArray.push(
          { reason: '기타', count: totalReturns }
        );
      }

      return {
        id: product.id,
        name: product.name,
        vendor: product.vendor?.name || '알 수 없음',
        category: product.category?.name || '기타',
        totalSold,
        totalReturns,
        returnRate: Math.round(returnRate * 100) / 100,
        returnReasons: returnReasonsArray
      };
    });

    return returnRateData.sort((a, b) => b.returnRate - a.returnRate);
  }

  // 반품 사유를 카테고리별로 분류하는 헬퍼 메서드
  private categorizeReturnReason(reason: string): string {
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('불량') || reasonLower.includes('하자') || reasonLower.includes('defect')) {
      return '불량/하자';
    } else if (reasonLower.includes('사이즈') || reasonLower.includes('크기') || reasonLower.includes('size')) {
      return '사이즈 불일치';
    } else if (reasonLower.includes('색상') || reasonLower.includes('색깔') || reasonLower.includes('color')) {
      return '색상 불일치';
    } else if (reasonLower.includes('변심') || reasonLower.includes('change')) {
      return '단순 변심';
    } else if (reasonLower.includes('배송') || reasonLower.includes('delivery')) {
      return '배송 오류';
    } else if (reasonLower.includes('포장') || reasonLower.includes('package')) {
      return '포장 손상';
    } else {
      return '기타';
    }
  }

  async getOverview(period: string) {
    const { startDate, endDate } = this.getDateRange(period);

    // 병렬로 모든 실제 데이터 조회
    const [
      totalProducts,
      totalSellers,
      totalVendors,
      orders,
      orderItems,
      activeProducts,
      previousPeriodProducts
    ] = await Promise.all([
      // 총 활성 상품 수
      this.prisma.product.count({
        where: { isActive: true }
      }),
      
      // 총 활성 셀러 수
      this.prisma.seller.count({
        where: { 
          isActive: true,
          isVerified: true 
        }
      }),
      
      // 총 활성 벤더 수
      this.prisma.vendor.count({
        where: { isActive: true }
      }),

      // 실제 주문 데이터 (완료된 주문만)
      this.prisma.order.findMany({
        where: {
          status: {
            in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          totalAmount: true,
          createdAt: true
        }
      }),

      // 실제 주문 아이템 데이터
      this.prisma.orderItem.findMany({
        where: {
          order: {
            status: {
              in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
            },
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        select: {
          finalPrice: true,
          quantity: true
        }
      }),

      // 기간 내 생성된 상품 (성장률 계산용)
      this.prisma.product.count({
        where: {
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // 이전 기간 상품 수 (성장률 계산용)
      this.prisma.product.count({
        where: {
          isActive: true,
          createdAt: {
            lt: startDate
          }
        }
      })
    ]);

    // 실제 매출 계산 (Order 테이블 기반)
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    // 실제 주문 수
    const totalOrders = orders.length;

    // 평균 주문액 계산
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 월별 성장률 계산 (상품 증가율로 추정)
    const monthlyGrowth = previousPeriodProducts > 0 
      ? ((activeProducts - previousPeriodProducts) / previousPeriodProducts) * 100
      : activeProducts > 0 ? 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalSellers,
      totalVendors,
      averageOrderValue,
      monthlyGrowth,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };
  }
}
