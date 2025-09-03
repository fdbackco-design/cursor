import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReturnType, ReturnStatus, RefundReason } from '@prisma/client';

export interface CreateReturnDto {
  orderId: string;
  orderItemId?: string;
  type: ReturnType;
  reason: string;
  notes?: string;
  refundAmount?: number;
}

export interface UpdateReturnStatusDto {
  status: ReturnStatus;
  adminNotes?: string;
  processedBy?: string;
  refundId?: string;
  trackingNumber?: string;
  carrier?: string;
  exchangeTrackingNumber?: string;
  exchangeCarrier?: string;
}

export interface ReturnQueryDto {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
  type?: ReturnType;
  orderNumber?: string;
  customerName?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 반품/교환/취소 요청 생성
  async createReturn(createReturnDto: CreateReturnDto) {
    try {
      this.logger.log(`반품 요청 생성: orderId=${createReturnDto.orderId}, type=${createReturnDto.type}`);

      // 주문 존재 여부 확인
      const order = await this.prisma.order.findUnique({
        where: { id: createReturnDto.orderId },
        include: {
          user: { select: { name: true, email: true } },
          items: true
        }
      });

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      // 특정 상품 반품/교환인 경우 해당 상품 확인
      if (createReturnDto.orderItemId) {
        const orderItem = await this.prisma.orderItem.findFirst({
          where: {
            id: createReturnDto.orderItemId,
            orderId: createReturnDto.orderId
          }
        });

        if (!orderItem) {
          throw new NotFoundException('주문 상품을 찾을 수 없습니다.');
        }
      }

      // 이미 처리 중인 반품 요청이 있는지 확인
      const existingReturn = await this.prisma.return.findFirst({
        where: {
          orderId: createReturnDto.orderId,
          orderItemId: createReturnDto.orderItemId || null,
          status: {
            in: ['PENDING', 'APPROVED', 'PROCESSING']
          }
        }
      });

      if (existingReturn) {
        throw new BadRequestException('이미 처리 중인 반품 요청이 있습니다.');
      }

      // 반품 요청 생성
      const returnRequest = await this.prisma.return.create({
        data: {
          orderId: createReturnDto.orderId,
          orderItemId: createReturnDto.orderItemId,
          type: createReturnDto.type,
          reason: createReturnDto.reason,
          notes: createReturnDto.notes,
          refundAmount: createReturnDto.refundAmount,
          status: 'PENDING'
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          },
          orderItem: true
        }
      });

      this.logger.log(`반품 요청 생성 완료: returnId=${returnRequest.id}`);

      return {
        success: true,
        data: returnRequest,
        message: '반품 요청이 성공적으로 생성되었습니다.'
      };
    } catch (error) {
      this.logger.error('반품 요청 생성 실패:', error);
      throw error;
    }
  }

  // 반품/교환/취소 목록 조회 (관리자용)
  async getReturns(query: ReturnQueryDto) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.type) {
        where.type = query.type;
      }

      if (query.reason) {
        where.reason = { contains: query.reason };
      }

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }

      // 주문번호나 고객명으로 필터링
      if (query.orderNumber || query.customerName) {
        where.order = {};
        if (query.orderNumber) {
          where.order.orderNumber = { contains: query.orderNumber };
        }
        if (query.customerName) {
          where.order.user = {
            name: { contains: query.customerName }
          };
        }
      }

      const [returns, total] = await Promise.all([
        this.prisma.return.findMany({
          where,
          include: {
            order: {
              include: {
                user: { select: { name: true, email: true, phoneNumber: true } },
                items: true
              }
            },
            orderItem: {
              include: {
                product: { select: { name: true, images: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        this.prisma.return.count({ where })
      ]);

      this.logger.log(`반품 목록 조회 완료: total=${total}, page=${page}`);

      return {
        success: true,
        data: {
          returns,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          }
        }
      };
    } catch (error) {
      this.logger.error('반품 목록 조회 실패:', error);
      throw error;
    }
  }

  // 반품/교환/취소 상세 조회
  async getReturnById(id: string) {
    try {
      const returnRequest = await this.prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true, phoneNumber: true } },
              items: {
                include: {
                  product: { select: { name: true, images: true } }
                }
              }
            }
          },
          orderItem: {
            include: {
              product: { select: { name: true, images: true } }
            }
          }
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      this.logger.log(`반품 상세 조회 완료: returnId=${id}`);

      return {
        success: true,
        data: returnRequest
      };
    } catch (error) {
      this.logger.error('반품 상세 조회 실패:', error);
      throw error;
    }
  }

  // 반품/교환/취소 상태 업데이트
  async updateReturnStatus(id: string, updateDto: UpdateReturnStatusDto) {
    try {
      this.logger.log(`반품 상태 업데이트: returnId=${id}, status=${updateDto.status}`);

      const returnRequest = await this.prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          }
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      // 상태 업데이트
      const updatedReturn = await this.prisma.return.update({
        where: { id },
        data: {
          status: updateDto.status,
          adminNotes: updateDto.adminNotes,
          processedBy: updateDto.processedBy,
          processedAt: new Date(),
          refundId: updateDto.refundId,
          trackingNumber: updateDto.trackingNumber,
          carrier: updateDto.carrier,
          exchangeTrackingNumber: updateDto.exchangeTrackingNumber,
          exchangeCarrier: updateDto.exchangeCarrier,
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          },
          orderItem: true
        }
      });

      // 반품 승인 시 자동으로 환불 레코드 생성
      if (updateDto.status === 'APPROVED' && returnRequest.type === 'RETURN') {
        await this.createRefundRecord(updatedReturn);
      }

      this.logger.log(`반품 상태 업데이트 완료: returnId=${id}`);

      return {
        success: true,
        data: updatedReturn,
        message: '반품 상태가 성공적으로 업데이트되었습니다.'
      };
    } catch (error) {
      this.logger.error('반품 상태 업데이트 실패:', error);
      throw error;
    }
  }

  // 반품 통계 조회
  async getReturnStats() {
    try {
      const [
        totalReturns,
        statusBreakdown,
        typeBreakdown,
        reasonBreakdown,
        recentReturns
      ] = await Promise.all([
        this.prisma.return.count(),
        this.prisma.return.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        this.prisma.return.groupBy({
          by: ['type'],
          _count: { type: true }
        }),
        this.prisma.return.groupBy({
          by: ['reason'],
          _count: { reason: true },
          orderBy: { _count: { reason: 'desc' } },
          take: 10
        }),
        this.prisma.return.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        })
      ]);

      this.logger.log('반품 통계 조회 완료');

      return {
        success: true,
        data: {
          totalReturns,
          statusBreakdown: statusBreakdown.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
          typeBreakdown: typeBreakdown.reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as Record<string, number>),
          reasonBreakdown: reasonBreakdown.reduce((acc, item) => {
            acc[item.reason] = item._count.reason;
            return acc;
          }, {} as Record<string, number>),
          recentReturns
        }
      };
    } catch (error) {
      this.logger.error('반품 통계 조회 실패:', error);
      throw error;
    }
  }

  // 환불 처리
  async processRefund(id: string, refundData: {
    amount: number;
    method: 'FULL' | 'PARTIAL';
    reason: string;
    processedBy: string;
  }) {
    try {
      this.logger.log(`환불 처리: returnId=${id}, amount=${refundData.amount}, method=${refundData.method}`);
      
      const returnRequest = await this.prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          }
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      if (returnRequest.status !== 'APPROVED') {
        throw new BadRequestException('승인된 반품 요청만 환불 처리할 수 있습니다.');
      }

      // 환불 금액 검증
      const orderTotal = Number(returnRequest.order.totalAmount);
      if (refundData.amount > orderTotal) {
        throw new BadRequestException('환불 금액이 주문 금액을 초과할 수 없습니다.');
      }

      // 환불 ID 생성 (실제로는 PG사 API 호출 결과)
      const refundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 환불 처리 및 상태 업데이트
      const updatedReturn = await this.prisma.return.update({
        where: { id },
        data: {
          status: 'PROCESSING',
          refundId: refundId,
          refundAmount: refundData.amount,
          adminNotes: `환불 처리: ${refundData.method === 'FULL' ? '전액' : '부분'} 환불 (${refundData.amount.toLocaleString()}원) - ${refundData.reason}`,
          processedBy: refundData.processedBy,
          processedAt: new Date()
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          },
          orderItem: true
        }
      });

      this.logger.log(`환불 처리 완료: returnId=${id}, refundId=${refundId}`);
      return {
        success: true,
        data: updatedReturn,
        message: '환불이 성공적으로 처리되었습니다.',
        refundId: refundId
      };
    } catch (error) {
      this.logger.error('환불 처리 실패:', error);
      throw error;
    }
  }

  // 교환 처리
  async processExchange(id: string, exchangeData: {
    trackingNumber: string;
    carrier: string;
    notes: string;
    processedBy: string;
  }) {
    try {
      this.logger.log(`교환 처리: returnId=${id}, trackingNumber=${exchangeData.trackingNumber}`);
      
      const returnRequest = await this.prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          }
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      if (returnRequest.status !== 'APPROVED') {
        throw new BadRequestException('승인된 반품 요청만 교환 처리할 수 있습니다.');
      }

      if (returnRequest.type !== 'EXCHANGE') {
        throw new BadRequestException('교환 요청만 교환 처리할 수 있습니다.');
      }

      // 교환 처리 및 상태 업데이트
      const updatedReturn = await this.prisma.return.update({
        where: { id },
        data: {
          status: 'PROCESSING',
          exchangeTrackingNumber: exchangeData.trackingNumber,
          exchangeCarrier: exchangeData.carrier,
          adminNotes: `교환 처리: ${exchangeData.carrier} ${exchangeData.trackingNumber} - ${exchangeData.notes}`,
          processedBy: exchangeData.processedBy,
          processedAt: new Date()
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          },
          orderItem: true
        }
      });

      this.logger.log(`교환 처리 완료: returnId=${id}, trackingNumber=${exchangeData.trackingNumber}`);
      return {
        success: true,
        data: updatedReturn,
        message: '교환이 성공적으로 처리되었습니다.'
      };
    } catch (error) {
      this.logger.error('교환 처리 실패:', error);
      throw error;
    }
  }

  // 반품 회수 요청
  async requestReturnPickup(id: string, pickupData: {
    scheduledDate: string;
    notes: string;
    processedBy: string;
  }) {
    try {
      this.logger.log(`반품 회수 요청: returnId=${id}, scheduledDate=${pickupData.scheduledDate}`);
      
      const returnRequest = await this.prisma.return.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          }
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      if (returnRequest.status !== 'APPROVED') {
        throw new BadRequestException('승인된 반품 요청만 회수 요청할 수 있습니다.');
      }

      // 회수 요청 처리 및 상태 업데이트
      const updatedReturn = await this.prisma.return.update({
        where: { id },
        data: {
          status: 'PROCESSING',
          adminNotes: `반품 회수 요청: ${pickupData.scheduledDate} 예약 - ${pickupData.notes}`,
          processedBy: pickupData.processedBy,
          processedAt: new Date()
        },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: true
            }
          },
          orderItem: true
        }
      });

      this.logger.log(`반품 회수 요청 완료: returnId=${id}, scheduledDate=${pickupData.scheduledDate}`);
      return {
        success: true,
        data: updatedReturn,
        message: '반품 회수 요청이 성공적으로 처리되었습니다.'
      };
    } catch (error) {
      this.logger.error('반품 회수 요청 실패:', error);
      throw error;
    }
  }

  // 자동 승인 규칙 적용 (결제 당일 취소 요청 등)
  async processAutoApprovalRules(returnId: string) {
    try {
      const returnRequest = await this.prisma.return.findUnique({
        where: { id: returnId },
        include: {
          order: true
        }
      });

      if (!returnRequest) {
        throw new NotFoundException('반품 요청을 찾을 수 없습니다.');
      }

      // 결제 당일 취소 요청은 자동 승인
      const orderDate = new Date(returnRequest.order.createdAt);
      const today = new Date();
      const isSameDay = orderDate.toDateString() === today.toDateString();

      if (returnRequest.type === 'CANCEL' && isSameDay) {
        await this.updateReturnStatus(returnId, {
          status: 'APPROVED',
          adminNotes: '결제 당일 취소 요청으로 자동 승인',
          processedBy: 'system'
        });

        this.logger.log(`자동 승인 완료: returnId=${returnId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('자동 승인 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 반품 승인 시 자동으로 환불 레코드 생성
   */
  private async createRefundRecord(returnRequest: any) {
    try {
      this.logger.log(`환불 레코드 생성 시작: returnId=${returnRequest.id}`);

      // 주문 정보 조회
      const order = await this.prisma.order.findUnique({
        where: { id: returnRequest.orderId },
        include: {
          items: returnRequest.orderItemId ? {
            where: { id: returnRequest.orderItemId }
          } : true
        }
      });

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      // 결제 정보 조회 (주문 metadata에서 paymentKey 확인)
      let paymentKey = null;
      if (order.metadata && typeof order.metadata === 'object') {
        paymentKey = (order.metadata as any).paymentKey;
      }

      if (!paymentKey) {
        throw new Error('결제 정보를 찾을 수 없습니다. 주문 metadata에 paymentKey가 없습니다.');
      }

      // 환불 금액 계산
      let refundAmount = 0;
      let orderItemIds: string[] = [];

      if (returnRequest.orderItemId) {
        // 특정 상품 반품
        const orderItem = order.items.find(item => item.id === returnRequest.orderItemId);
        if (orderItem) {
          refundAmount = Number(orderItem.totalPrice);
          orderItemIds = [orderItem.id];
        }
      } else {
        // 전체 주문 반품
        refundAmount = Number(order.totalAmount);
        orderItemIds = order.items.map(item => item.id);
      }

      // 환불 사유 매핑
      const refundReason = this.mapReturnReasonToRefundReason(returnRequest.reason);

      // 환불 레코드 생성
      const refund = await this.prisma.refund.create({
        data: {
          returnId: returnRequest.id,
          orderId: returnRequest.orderId,
          orderItemId: returnRequest.orderItemId || null,
          paymentKey: paymentKey,
          refundAmount: refundAmount,
          refundReason: refundReason,
          status: 'PENDING',
          processedBy: returnRequest.processedBy,
          notes: `반품 승인으로 인한 자동 환불 생성: ${returnRequest.reason}`,
          metadata: {
            returnId: returnRequest.id,
            orderItemIds,
            isFullRefund: !returnRequest.orderItemId,
            createdAt: new Date().toISOString()
          }
        }
      });

      this.logger.log(`환불 레코드 생성 완료: refundId=${refund.id}, amount=${refundAmount}`);
      return refund;
    } catch (error) {
      this.logger.error('환불 레코드 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 반품 사유를 환불 사유로 매핑
   */
  private mapReturnReasonToRefundReason(returnReason: string): RefundReason {
    const reasonMap: Record<string, RefundReason> = {
      '상품 불량': 'PRODUCT_DEFECT',
      '구매자 변심': 'CUSTOMER_CHANGE',
      '배송 오류': 'DELIVERY_ERROR',
      '잘못된 상품 배송': 'WRONG_ITEM',
      '포장 손상': 'DAMAGED_PACKAGE',
      '사이즈 불일치': 'SIZE_MISMATCH',
      '색상 불일치': 'COLOR_MISMATCH',
      '기타': 'OTHER'
    };

    return reasonMap[returnReason] || 'OTHER';
  }
}