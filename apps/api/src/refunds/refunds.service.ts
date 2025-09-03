import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundDto, ProcessRefundDto, RefundCalculationResult } from './dto/refund.dto';
import { RefundReason, RefundStatus } from '@prisma/client';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 환불 금액 계산 (부분 환불 로직)
   */
  async calculateRefundAmount(
    orderId: string,
    orderItemIds?: string[],
    refundReason?: RefundReason
  ): Promise<RefundCalculationResult> {
    try {
      // 주문 정보 조회
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
              refunds: {
                where: {
                  status: {
                    in: ['COMPLETED', 'PROCESSING']
                  }
                }
              }
            }
          },
          coupon: true,
          refunds: {
            where: {
              status: {
                in: ['COMPLETED', 'PROCESSING']
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      // 이미 환불된 금액 계산
      const alreadyRefundedAmount = order.refunds.reduce(
        (sum, refund) => sum + Number(refund.refundAmount),
        0
      );

      let refundableItems = order.items;
      
      // 특정 상품만 환불하는 경우
      if (orderItemIds && orderItemIds.length > 0) {
        refundableItems = order.items.filter(item => 
          orderItemIds.includes(item.id)
        );
      }

      // 환불 가능한 상품들의 금액 계산
      let totalRefundAmount = 0;
      let itemRefunds: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        alreadyRefunded: number;
        refundableAmount: number;
      }> = [];

      for (const item of refundableItems) {
        // 이미 환불된 금액 계산
        const itemAlreadyRefunded = item.refunds.reduce(
          (sum, refund) => sum + Number(refund.refundAmount),
          0
        );

        const refundableAmount = Number(item.totalPrice) - itemAlreadyRefunded;
        
        if (refundableAmount > 0) {
          totalRefundAmount += refundableAmount;
          itemRefunds.push({
            orderItemId: item.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            alreadyRefunded: itemAlreadyRefunded,
            refundableAmount
          });
        }
      }

      // 쿠폰 할인 비율 계산
      let couponRefundAmount = 0;
      if (order.coupon && Number(order.discountAmount) > 0) {
        const discountRatio = Number(order.discountAmount) / Number(order.subtotal);
        couponRefundAmount = totalRefundAmount * discountRatio;
      }

      // 배송비 환불 계산 (전체 주문 환불 시에만)
      let shippingRefundAmount = 0;
      if (!orderItemIds || orderItemIds.length === order.items.length) {
        shippingRefundAmount = Number(order.shippingAmount);
      }

      // 최종 환불 금액
      const finalRefundAmount = totalRefundAmount + couponRefundAmount + shippingRefundAmount;

      return {
        orderId,
        totalRefundAmount: finalRefundAmount,
        itemRefunds,
        couponRefundAmount,
        shippingRefundAmount,
        alreadyRefundedAmount,
        refundableAmount: Number(order.totalAmount) - alreadyRefundedAmount,
        isFullRefund: !orderItemIds || orderItemIds.length === order.items.length
      };
    } catch (error) {
      this.logger.error('환불 금액 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 생성
   */
  async createRefund(createRefundDto: CreateRefundDto): Promise<any> {
    try {
      const { returnId, orderId, orderItemIds, refundReason, notes, processedBy } = createRefundDto;

      // 환불 금액 계산
      const calculation = await this.calculateRefundAmount(orderId, orderItemIds, refundReason);

      if (calculation.totalRefundAmount <= 0) {
        throw new Error('환불 가능한 금액이 없습니다.');
      }

      // 주문 정보 조회 (결제 키 확인용)
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      // 환불 레코드 생성
      const refund = await this.prisma.refund.create({
        data: {
          returnId,
          orderId,
          orderItemId: orderItemIds && orderItemIds.length === 1 ? orderItemIds[0] : null,
          paymentKey: (order.metadata as any)?.paymentKey || '', // 주문 메타데이터에서 결제 키 추출
          refundAmount: calculation.totalRefundAmount,
          refundReason,
          status: 'PENDING',
          processedBy,
          notes,
          metadata: {
            calculation: calculation as any,
            orderItemIds,
            createdAt: new Date().toISOString()
          }
        }
      });

      this.logger.log(`환불 생성 완료: refundId=${refund.id}, amount=${calculation.totalRefundAmount}`);

      return refund;
    } catch (error) {
      this.logger.error('환불 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 토스페이먼츠를 통한 환불 처리
   */
  async processRefund(refundId: string, processRefundDto: ProcessRefundDto): Promise<any> {
    try {
      const { processedBy, notes } = processRefundDto;

      // 환불 정보 조회
      const refund = await this.prisma.refund.findUnique({
        where: { id: refundId },
        include: {
          order: true,
          return: true
        }
      });

      if (!refund) {
        throw new Error('환불 정보를 찾을 수 없습니다.');
      }

      if (refund.status !== 'PENDING') {
        throw new Error('이미 처리된 환불입니다.');
      }

      // 토스페이먼츠 환불 API 호출
      const tossResponse = await this.callTossRefundAPI(refund);

      // 환불 상태 업데이트
      const updatedRefund = await this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: tossResponse.success ? 'COMPLETED' : 'FAILED',
          tossRefundId: tossResponse.data?.transactionKey,
          transactionKey: tossResponse.data?.transactionKey,
          receiptKey: tossResponse.data?.receiptKey,
          refundedAt: tossResponse.success ? new Date() : null,
          processedBy,
          notes,
          metadata: {
            ...(refund.metadata as any),
            tossResponse,
            processedAt: new Date().toISOString()
          }
        }
      });

      // 환불 성공 시 추가 처리
      if (tossResponse.success) {
        await this.handleSuccessfulRefund(refund);
      }

      this.logger.log(`환불 처리 완료: refundId=${refundId}, status=${updatedRefund.status}`);

      return updatedRefund;
    } catch (error) {
      this.logger.error('환불 처리 실패:', error);
      
      // 환불 실패 상태 업데이트
      await this.prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'FAILED',
          processedBy: processRefundDto.processedBy,
          notes: `${processRefundDto.notes || ''} - 처리 실패: ${error.message}`,
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString()
          }
        }
      });

      throw error;
    }
  }

  /**
   * 토스페이먼츠 환불 API 호출
   */
  private async callTossRefundAPI(refund: any): Promise<any> {
    try {
      const secretKey = process.env.TOSS_SECRET_KEY;
      if (!secretKey) {
        throw new Error('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
      }

      const response = await fetch(`https://api.tosspayments.com/v1/payments/${refund.paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelReason: this.getRefundReasonText(refund.refundReason),
          cancelAmount: Number(refund.refundAmount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`토스페이먼츠 환불 실패: ${data.message || 'Unknown error'}`);
      }

      return {
        success: true,
        data: data.cancels?.[0] || data
      };
    } catch (error) {
      this.logger.error('토스페이먼츠 API 호출 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 환불 사유를 한국어로 변환
   */
  private getRefundReasonText(reason: RefundReason): string {
    const reasonMap = {
      PRODUCT_DEFECT: '상품 불량',
      CUSTOMER_CHANGE: '구매자 변심',
      DELIVERY_ERROR: '배송 오류',
      WRONG_ITEM: '잘못된 상품 배송',
      DAMAGED_PACKAGE: '포장 손상',
      SIZE_MISMATCH: '사이즈 불일치',
      COLOR_MISMATCH: '색상 불일치',
      OTHER: '기타'
    };

    return reasonMap[reason] || '기타';
  }

  /**
   * 환불 성공 시 추가 처리 (재고 복원, 쿠폰 복원 등)
   */
  private async handleSuccessfulRefund(refund: any): Promise<void> {
    try {
      // 1. 재고 복원
      await this.restoreInventory(refund);

      // 2. 쿠폰 복원 (전체 환불인 경우)
      if (refund.metadata?.calculation?.isFullRefund) {
        await this.restoreCoupon(refund.orderId);
      }

      // 3. 주문 상태 업데이트
      await this.updateOrderStatus(refund.orderId);

      this.logger.log(`환불 성공 후 처리 완료: refundId=${refund.id}`);
    } catch (error) {
      this.logger.error('환불 성공 후 처리 실패:', error);
      // 환불은 성공했지만 후처리 실패는 별도 로깅만 하고 예외를 던지지 않음
    }
  }

  /**
   * 재고 복원
   */
  private async restoreInventory(refund: any): Promise<void> {
    try {
      const orderItemIds = refund.metadata?.orderItemIds;
      
      if (!orderItemIds || orderItemIds.length === 0) {
        return;
      }

      // 환불된 상품들의 재고 복원
      for (const orderItemId of orderItemIds) {
        const orderItem = await this.prisma.orderItem.findUnique({
          where: { id: orderItemId },
          include: { product: true }
        });

        if (orderItem) {
          await this.prisma.product.update({
            where: { id: orderItem.productId },
            data: {
              stockQuantity: {
                increment: orderItem.quantity
              }
            }
          });

          this.logger.log(`재고 복원 완료: productId=${orderItem.productId}, quantity=${orderItem.quantity}`);
        }
      }
    } catch (error) {
      this.logger.error('재고 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 쿠폰 복원
   */
  private async restoreCoupon(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { coupon: true }
      });

      if (!order || !order.couponId) {
        return;
      }

      // 사용자 쿠폰 복원 (소프트 딜리트 해제)
      const userCoupon = await this.prisma.userCoupon.findFirst({
        where: {
          userId: order.userId,
          couponId: order.couponId,
          deletedAt: { not: null }
        }
      });

      if (userCoupon) {
        await this.prisma.userCoupon.update({
          where: { id: userCoupon.id },
          data: {
            deletedAt: null,
            usageCount: Math.max(0, userCoupon.usageCount - 1)
          }
        });

        // 원본 쿠폰 사용 횟수 감소
        await this.prisma.coupon.update({
          where: { id: order.couponId },
          data: {
            currentUses: {
              decrement: 1
            }
          }
        });

        this.logger.log(`쿠폰 복원 완료: couponId=${order.couponId}, userId=${order.userId}`);
      }
    } catch (error) {
      this.logger.error('쿠폰 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 주문 상태 업데이트
   */
  private async updateOrderStatus(orderId: string): Promise<void> {
    try {
      // 환불된 금액과 주문 총액 비교하여 주문 상태 결정
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          refunds: {
            where: { status: 'COMPLETED' }
          }
        }
      });

      if (!order) {
        return;
      }

      const totalRefunded = order.refunds.reduce(
        (sum, refund) => sum + Number(refund.refundAmount),
        0
      );

      const orderTotal = Number(order.totalAmount);

      // 전액 환불인 경우
      if (totalRefunded >= orderTotal) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' }
        });
      }
      // 부분 환불인 경우
      else if (totalRefunded > 0) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'PARTIALLY_REFUNDED' }
        });
      }

      this.logger.log(`주문 상태 업데이트 완료: orderId=${orderId}, totalRefunded=${totalRefunded}`);
    } catch (error) {
      this.logger.error('주문 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 내역 조회
   */
  async getRefunds(query: any): Promise<any> {
    try {
      this.logger.log(`환불 내역 조회 시작: query=${JSON.stringify(query)}`);
      
      const where: any = {};
      
      if (query.orderId) {
        where.orderId = query.orderId;
      }
      
      if (query.returnId) {
        where.returnId = query.returnId;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.refundReason) {
        where.refundReason = query.refundReason;
      }

      if (query.startDate && query.endDate) {
        where.createdAt = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate)
        };
      }

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const skip = (page - 1) * limit;

      this.logger.log(`환불 조회 조건: where=${JSON.stringify(where)}, page=${page}, limit=${limit}, skip=${skip}`);
      
      const [refunds, total] = await Promise.all([
        this.prisma.refund.findMany({
          where,
          include: {
            order: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            orderItem: {
              include: {
                product: {
                  select: { name: true, images: true }
                }
              }
            },
            return: {
              select: { reason: true, type: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.refund.count({ where })
      ]);

      this.logger.log(`환불 조회 결과: refunds=${refunds.length}개, total=${total}개`);

      return {
        refunds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('환불 내역 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 환불 통계 조회
   */
  async getRefundStats(): Promise<any> {
    try {
      const [
        totalRefunds,
        completedRefunds,
        pendingRefunds,
        failedRefunds,
        totalRefundAmount
      ] = await Promise.all([
        this.prisma.refund.count(),
        this.prisma.refund.count({ where: { status: 'COMPLETED' } }),
        this.prisma.refund.count({ where: { status: 'PENDING' } }),
        this.prisma.refund.count({ where: { status: 'FAILED' } }),
        this.prisma.refund.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { refundAmount: true }
        })
      ]);

      return {
        totalRefunds,
        completedRefunds,
        pendingRefunds,
        failedRefunds,
        totalRefundAmount: Number(totalRefundAmount._sum.refundAmount || 0)
      };
    } catch (error) {
      this.logger.error('환불 통계 조회 실패:', error);
      throw error;
    }
  }
}
