import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryTrackingQueryDto } from './dto/delivery-tracking.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  // 주문 생성
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    try {
      this.logger.log(`주문 생성 시작: orderNumber=${createOrderDto.orderNumber}, userId=${userId}`);
      
      // 사용자별로 먼저 기존 주문 확인 (더 구체적인 조건)
      const existingOrder = await this.prisma.order.findFirst({
        where: { 
          orderNumber: createOrderDto.orderNumber,
          userId: userId
        },
        include: { items: true }
      });

      if (existingOrder) {
        this.logger.log(`기존 주문 발견: orderNumber=${createOrderDto.orderNumber}, userId=${userId}`);
        return {
          success: true,
          data: existingOrder,
          message: '주문이 이미 생성되어 있습니다.'
        };
      }

      // 다른 사용자가 같은 orderNumber를 사용하는지 확인
      const duplicateOrder = await this.prisma.order.findUnique({
        where: { orderNumber: createOrderDto.orderNumber }
      });

      if (duplicateOrder && duplicateOrder.userId !== userId) {
        throw new BadRequestException('이미 존재하는 주문번호입니다.');
      }

      // 트랜잭션으로 주문과 주문 아이템을 함께 생성하고 쿠폰 사용 처리
      const order = await this.prisma.$transaction(async (prisma) => {
        // 1. 먼저 쿠폰 유효성 검증 (삭제하지 않고 검증만)
        let validCouponId = null;
        let userCouponToProcess = null;
        
        if (createOrderDto.couponId) {
          this.logger.log(`쿠폰 유효성 검증 시작: couponId=${createOrderDto.couponId}, userId=${userId}`);
          
          // 사용자 쿠폰 조회 및 유효성 검증
          const userCoupon = await prisma.userCoupon.findFirst({
            where: {
              id: createOrderDto.couponId,
              userId: userId,
              deletedAt: null // 아직 사용되지 않은 쿠폰만
            },
            include: {
              coupon: true
            }
          });

          if (userCoupon) {
            validCouponId = userCoupon.couponId; // UserCoupon의 couponId (실제 Coupon 테이블의 ID)
            userCouponToProcess = userCoupon;
            this.logger.log(`쿠폰 유효성 검증 성공: userCouponId=${createOrderDto.couponId}, couponId=${userCoupon.couponId}, couponCode=${userCoupon.coupon.code}`);
          } else {
            this.logger.warn(`사용할 수 있는 쿠폰을 찾을 수 없음: userCouponId=${createOrderDto.couponId}, userId=${userId} - 주문에 쿠폰 ID를 저장하지 않음`);
            // 유효하지 않은 쿠폰은 주문에 저장하지 않음
          }
        }

        // 2. 주문 생성 (유효한 쿠폰 ID만 저장)
        const newOrder = await prisma.order.create({
          data: {
            orderNumber: createOrderDto.orderNumber,
            userId,
            couponId: validCouponId, // 실제 Coupon 테이블의 ID 저장
            status: OrderStatus.CONFIRMED, // 결제 완료 상태로 시작
            subtotal: createOrderDto.subtotal,
            discountAmount: createOrderDto.discountAmount || 0,
            shippingAmount: createOrderDto.shippingAmount || 0,
            taxAmount: createOrderDto.taxAmount || 0,
            totalAmount: createOrderDto.totalAmount,
            referralCodeUsed: createOrderDto.referralCodeUsed,
            couponCodeUsed: createOrderDto.couponCodeUsed,
            shippingAddress: createOrderDto.shippingAddress,
            billingAddress: createOrderDto.billingAddress,
            notes: createOrderDto.notes,
            metadata: {
              paymentKey: createOrderDto.paymentKey,
              paymentMethod: createOrderDto.paymentMethod,
              paidAmount: createOrderDto.paidAmount,
              userCouponId: userCouponToProcess?.id, // UserCoupon의 ID도 metadata에 저장
              ...createOrderDto.metadata,
            },
          }
        });

        // 3. 주문 아이템 생성 
        const orderItems = await Promise.all(
          createOrderDto.items.map(item =>
            prisma.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                discountAmount: item.discountAmount || 0,
                finalPrice: item.finalPrice,
                metadata: item.metadata,
              }
            })
          )
        );

        // 4. 주문 생성이 성공한 후 쿠폰 사용 처리 (소프트 딜리트)
        if (userCouponToProcess) {
          this.logger.log(`쿠폰 사용 처리 시작: couponId=${userCouponToProcess.id}, userId=${userId}`);
          
          // 사용자 쿠폰 소프트 딜리트
          await prisma.userCoupon.update({
            where: { id: userCouponToProcess.id },
            data: {
              deletedAt: new Date(),
              usageCount: userCouponToProcess.usageCount + 1
            }
          });

          // 원본 쿠폰의 사용 횟수 증가
          await prisma.coupon.update({
            where: { id: userCouponToProcess.couponId },
            data: {
              currentUses: {
                increment: 1
              }
            }
          });

          this.logger.log(`쿠폰 사용 처리 완료: couponId=${userCouponToProcess.id}, couponCode=${userCouponToProcess.coupon.code}`);
        }

        return { ...newOrder, items: orderItems };
      });

      // 주문 생성 후 장바구니 비우기 (새로 생성된 경우에만)
      if (order.items.length > 0) {
        try {
          const deletedCount = await this.prisma.cartItem.deleteMany({
            where: {
              cart: {
                userId: userId
              }
            }
          });
          this.logger.log(`주문 생성 후 장바구니 정리 완료: userId=${userId}, 삭제된 아이템 수: ${deletedCount.count}`);
        } catch (error) {
          this.logger.warn(`장바구니 정리 실패: ${error.message}`);
          // 장바구니 정리 실패는 주문 생성에 영향주지 않음
        }
      }

      this.logger.log(`주문 생성 완료: orderNumber=${order.orderNumber}, userId=${userId}`);

      return {
        success: true,
        data: order,
        message: '주문이 성공적으로 생성되었습니다.'
      };

    } catch (error) {
      this.logger.error('주문 생성 실패:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('주문 생성 중 오류가 발생했습니다.');
    }
  }

  async getUserOrders(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    try {
      // 조건 설정
      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      // 주문 목록 조회
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    priceB2C: true,
                  }
                },
                returns: {
                  select: {
                    id: true,
                    type: true,
                    status: true,
                    reason: true,
                    createdAt: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      this.logger.log(`주문 목록 조회 완료: userId=${userId}, total=${total}, page=${page}`);

      return {
        success: true,
        data: {
          orders,
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
      this.logger.error('주문 목록 조회 실패:', error);
      throw error;
    }
  }

  async getOrderDetail(orderNumber: string, userId: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: {
          orderNumber,
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                                  select: {
                    id: true,
                    name: true,
                    description: true,
                    images: true,
                    priceB2C: true,
                    category: {
                      select: {
                        name: true,
                      }
                    }
                  }
              },
              returns: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  reason: true,
                  createdAt: true
                }
              }
            }
          },
          user: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
            }
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
              metadata: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      this.logger.log(`주문 상세 조회 완료: orderNumber=${orderNumber}, userId=${userId}`);

      return {
        success: true,
        data: order
      };
    } catch (error) {
      this.logger.error('주문 상세 조회 실패:', error);
      throw error;
    }
  }

  async getOrderStats(userId: string) {
    try {
      const stats = await this.prisma.order.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true,
        },
      });

      const totalOrders = await this.prisma.order.count({
        where: { userId }
      });

      const totalAmount = await this.prisma.order.aggregate({
        where: { 
          userId,
          status: 'CONFIRMED' // 확정된 주문만
        },
        _sum: {
          totalAmount: true,
        },
      });

      this.logger.log(`주문 통계 조회 완료: userId=${userId}, totalOrders=${totalOrders}`);

      return {
        success: true,
        data: {
          totalOrders,
          totalAmount: totalAmount._sum.totalAmount || 0,
          statusBreakdown: stats.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
        }
      };
    } catch (error) {
      this.logger.error('주문 통계 조회 실패:', error);
      throw error;
    }
  }

  // 관리자용: 모든 주문 조회
  async getAllOrdersForAdmin(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    vendorId?: string;
    paymentMethod?: string;
  } = {}) {
    const { page = 1, limit = 10, status, search, vendorId, paymentMethod } = options;
    const skip = (page - 1) * limit;

    try {
      // 조건 설정
      const where: any = {};
      
      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
          { user: { phoneNumber: { contains: search } } },

        ];
      }

      // vendor 필터링 추가
      if (vendorId && vendorId !== 'all') {
        where.items = {
          some: {
            product: {
              vendorId: vendorId
            }
          }
        };
      }

      // 결제 수단 필터링 추가 (MySQL 호환성 문제로 임시 비활성화)
      // if (paymentMethod && paymentMethod !== 'all') {
      //   where.metadata = {
      //     path: 'paymentMethod',
      //     equals: paymentMethod
      //   };
      // }

      // 주문 목록 조회 (관리자는 모든 주문 조회 가능)
      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    priceB2C: true,
                    vendor: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
      ]);

      this.logger.log(`관리자 주문 목록 조회 완료: total=${total}, page=${page}`);

      return {
        success: true,
        data: {
          orders,
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
      this.logger.error('관리자 주문 목록 조회 실패:', error);
      throw error;
    }
  }

  // 관리자용: 주문 상태 변경
  async updateOrderStatus(orderNumber: string, status: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      const updatedOrder = await this.prisma.order.update({
        where: { orderNumber },
        data: { status: status as any },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      });

      this.logger.log(`주문 상태 변경 완료: orderNumber=${orderNumber}, status=${status}`);

      return {
        success: true,
        data: updatedOrder,
        message: '주문 상태가 변경되었습니다.'
      };
    } catch (error) {
      this.logger.error('주문 상태 변경 실패:', error);
      throw error;
    }
  }

  // 배송 추적 정보 조회
  async getDeliveryTracking(query: DeliveryTrackingQueryDto) {
    try {
      const where: any = {};

      if (query.orderNumber) {
        where.orderNumber = query.orderNumber;
      }

      if (query.userId) {
        where.userId = query.userId;
      }

      if (query.status) {
        where.status = query.status;
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

      const orders = await this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                }
              }
            }
          },
          user: {
            select: {
              name: true,
              phoneNumber: true,
            }
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
              metadata: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      // 배송 단계별 정보 생성
      const trackingInfo = orders.map(order => {
        const deliverySteps = this.generateDeliverySteps(order.status, order.createdAt, order.updatedAt);
        
        return {
          orderNumber: order.orderNumber,
          status: order.status,
          statusText: this.getStatusText(order.status),
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          shippingAddress: order.shippingAddress,
          items: order.items,
          customerInfo: {
            name: order.user.name,
            phone: order.user.phoneNumber,
          },
          deliverySteps,
          estimatedDelivery: this.calculateEstimatedDelivery(order.status, order.createdAt),
          shipment: order.shipments && order.shipments.length > 0 ? order.shipments[0] : null,
        };
      });

      this.logger.log(`배송 추적 정보 조회 완료: ${orders.length}건`);

      return {
        success: true,
        data: trackingInfo
      };
    } catch (error) {
      this.logger.error('배송 추적 정보 조회 실패:', error);
      throw error;
    }
  }

  // 전체 배송 통계 조회
  async getDeliveryStats() {
    try {
      const stats = await this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      const totalOrders = await this.prisma.order.count();
      
      const recentOrders = await this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      });

      this.logger.log(`배송 통계 조회 완료: 전체 주문 ${totalOrders}건`);

      return {
        success: true,
        data: {
          totalOrders,
          statusBreakdown: stats.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
          recentOrders: recentOrders.map(order => ({
            orderNumber: order.orderNumber,
            status: order.status,
            statusText: this.getStatusText(order.status),
            customerName: order.user.name,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
          }))
        }
      };
    } catch (error) {
      this.logger.error('배송 통계 조회 실패:', error);
      throw error;
    }
  }

  // 배송 단계 생성
  private generateDeliverySteps(status: OrderStatus, createdAt: Date, updatedAt: Date) {
    const steps = [
      {
        title: '주문 접수',
        description: '주문이 정상적으로 접수되었습니다.',
        completed: true,
        date: createdAt,
      },
      {
        title: '주문 확인',
        description: '판매자가 주문을 확인했습니다.',
        completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status),
        date: status !== 'PENDING' ? updatedAt : null,
      },
      {
        title: '상품 준비',
        description: '상품을 포장하고 있습니다.',
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status),
        date: status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED' ? updatedAt : null,
      },
      {
        title: '배송 시작',
        description: '상품이 배송을 시작했습니다.',
        completed: ['SHIPPED', 'DELIVERED'].includes(status),
        date: status === 'SHIPPED' || status === 'DELIVERED' ? updatedAt : null,
      },
      {
        title: '배송 완료',
        description: '상품이 안전하게 배송되었습니다.',
        completed: status === 'DELIVERED',
        date: status === 'DELIVERED' ? updatedAt : null,
      },
    ];

    return steps;
  }

  // 상태 텍스트 변환
  private getStatusText(status: OrderStatus): string {
    const statusMap = {
      PENDING: '주문 대기',
      CONFIRMED: '주문 확인',
      PROCESSING: '상품 준비중',
      SHIPPED: '배송중',
      DELIVERED: '배송 완료',
      CANCELLED: '주문 취소',
      REFUNDED: '환불 완료',
    };

    return statusMap[status] || status;
  }

  // 예상 배송일 계산 (시간 제거)
  private calculateEstimatedDelivery(status: OrderStatus, createdAt: Date): Date | null {
    if (status === 'DELIVERED') return null;
    if (status === 'CANCELLED' || status === 'REFUNDED') return null;

    const estimatedDays = status === 'SHIPPED' ? 2 : 4;
    const estimatedDate = new Date(createdAt);
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

    // 시간 제거 → 00:00:00 으로 초기화
    estimatedDate.setHours(0, 0, 0, 0);

    return estimatedDate;
  }

  // 주문 메모 업데이트
  async updateOrderNotes(orderNumber: string, notes: string) {
    try {
      this.logger.log(`주문 메모 업데이트 시작: orderNumber=${orderNumber}, notes 길이=${notes.length}`);

      const updatedOrder = await this.prisma.order.update({
        where: { orderNumber },
        data: { notes },
        select: {
          id: true,
          orderNumber: true,
          notes: true,
          updatedAt: true
        }
      });

      this.logger.log(`주문 메모 업데이트 완료: orderNumber=${orderNumber}`);

      return {
        success: true,
        data: updatedOrder,
        message: '주문 메모가 성공적으로 업데이트되었습니다.'
      };
    } catch (error) {
      this.logger.error(`주문 메모 업데이트 실패: orderNumber=${orderNumber}`, error.stack);
      
      if (error.code === 'P2025') {
        return {
          success: false,
          error: '해당 주문을 찾을 수 없습니다.'
        };
      }

      return {
        success: false,
        error: '주문 메모 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  // 관리자용: vendor 목록 조회
  async getVendorsForAdmin() {
    try {
      this.logger.log('관리자 vendor 목록 조회 시작');
      
      const vendors = await this.prisma.vendor.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      this.logger.log(`관리자 vendor 목록 조회 완료: 총 ${vendors.length}개`);

      return {
        success: true,
        data: vendors,
        message: 'vendor 목록을 성공적으로 조회했습니다.'
      };
    } catch (error) {
      this.logger.error('관리자 vendor 목록 조회 실패', error.stack);
      return {
        success: false,
        error: 'vendor 목록 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 관리자용: 주문 배송 정보 업데이트 (기존 방식)
  async updateOrderDelivery(orderId: string, courier: string, trackingNumber: string) {
    try {
      this.logger.log(`주문 배송 정보 업데이트 시작: orderId=${orderId}, courier=${courier}, trackingNumber=${trackingNumber}`);

      // 주문 존재 여부 확인
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true, status: true }
      });

      if (!existingOrder) {
        this.logger.warn(`주문을 찾을 수 없음: orderId=${orderId}`);
        return {
          success: false,
          error: '해당 주문을 찾을 수 없습니다.'
        };
      }

      // 기존 배송 정보가 있는지 확인
      const existingShipment = await this.prisma.shipment.findFirst({
        where: { orderId }
      });

      if (existingShipment) {
        // 기존 배송 정보 업데이트
        await this.prisma.shipment.update({
          where: { id: existingShipment.id },
          data: {
            carrier: courier,
            trackingNumber,
            updatedAt: new Date()
          }
        });
      } else {
        // 새로운 배송 정보 생성
        await this.prisma.shipment.create({
          data: {
            orderId,
            trackingNumber,
            carrier: courier,
            status: 'PENDING',
            metadata: {
              createdBy: 'admin',
              createdAt: new Date().toISOString()
            }
          }
        });
      }

      // 주문 상태를 SHIPPED로 변경
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`주문 배송 정보 업데이트 완료: orderId=${orderId}, orderNumber=${existingOrder.orderNumber}`);

      return {
        success: true,
        data: {
          id: orderId,
          orderNumber: existingOrder.orderNumber,
          courier,
          trackingNumber,
          status: 'SHIPPED'
        },
        message: '주문 배송 정보가 성공적으로 업데이트되었습니다.'
      };
    } catch (error) {
      this.logger.error(`주문 배송 정보 업데이트 실패: orderId=${orderId}`, error.stack);
      
      return {
        success: false,
        error: '주문 배송 정보 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  // 관리자용: 주문 아이템별 배송 정보 업데이트 (새로운 방식)
  async updateOrderDeliveryWithItem(
    orderId: string, 
    itemId: string, 
    courier: string, 
    trackingNumber: string,
    quantity: number
  ) {
    try {
      this.logger.log(`주문 아이템별 배송 정보 업데이트 시작: orderId=${orderId}, itemId=${itemId}, courier=${courier}, trackingNumber=${trackingNumber}, quantity=${quantity}`);

      // 주문 아이템 존재 여부 확인
      const orderItem = await this.prisma.orderItem.findFirst({
        where: { 
          id: itemId,
          orderId: orderId
        },
        include: {
          order: {
            select: { orderNumber: true, status: true }
          }
        }
      });

      if (!orderItem) {
        this.logger.warn(`주문 아이템을 찾을 수 없음: orderId=${orderId}, itemId=${itemId}`);
        return {
          success: false,
          error: '해당 주문 아이템을 찾을 수 없습니다.'
        };
      }

      // 기존 배송 정보가 있는지 확인 (orderId와 trackingNumber 조합으로 검색)
      let shipment = await this.prisma.shipment.findFirst({
        where: { 
          orderId,
          trackingNumber
        }
      });

      if (!shipment) {
        // 새로운 배송 정보 생성
        shipment = await this.prisma.shipment.create({
          data: {
            orderId,
            trackingNumber,
            carrier: courier,
            status: 'SHIPPED',
            metadata: {
              createdBy: 'admin',
              createdAt: new Date().toISOString()
            }
          }
        });
      } else {
        // 기존 배송 정보가 있다면 상태를 SHIPPED로 업데이트
        shipment = await this.prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status: 'SHIPPED',
            updatedAt: new Date()
          }
        });
      }

      // 배송 할당 정보 생성 또는 업데이트
      await this.prisma.shipmentAllocation.upsert({
        where: {
          uq_shipment_allocations__shipment_order_item: {
            shipmentId: shipment.id,
            orderItemId: itemId
          }
        },
        update: {
          qty: quantity
        },
        create: {
          shipmentId: shipment.id,
          orderItemId: itemId,
          qty: quantity
        }
      });

      // 주문 상태를 SHIPPED로 변경
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`주문 아이템별 배송 정보 업데이트 완료: orderId=${orderId}, itemId=${itemId}, orderNumber=${orderItem.order.orderNumber}`);

      return {
        success: true,
        data: {
          id: orderId,
          orderNumber: orderItem.order.orderNumber,
          itemId: itemId,
          courier,
          trackingNumber,
          quantity,
          status: 'SHIPPED'
        },
        message: '주문 아이템별 배송 정보가 성공적으로 업데이트되었습니다.'
      };
    } catch (error) {
      this.logger.error(`주문 아이템별 배송 정보 업데이트 실패: orderId=${orderId}, itemId=${itemId}`, error.stack);
      
      return {
        success: false,
        error: '주문 아이템별 배송 정보 업데이트 중 오류가 발생했습니다.'
      };
    }
  }

  // 관리자 전용: 주문 상세 조회
  async getOrderDetailForAdmin(orderNumber: string) {
    try {
      this.logger.log(`관리자 주문 상세 조회: orderNumber=${orderNumber}`);

      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  images: true,
                  priceB2C: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true
            }
          }
        }
      });

      if (!order) {
        this.logger.warn(`주문을 찾을 수 없음: orderNumber=${orderNumber}`);
        return {
          success: false,
          error: '해당 주문을 찾을 수 없습니다.'
        };
      }

      this.logger.log(`관리자 주문 상세 조회 완료: orderNumber=${orderNumber}, userId=${order.userId}`);

      return {
        success: true,
        data: order
      };
    } catch (error) {
      this.logger.error(`관리자 주문 상세 조회 실패: orderNumber=${orderNumber}`, error.stack);
      
      return {
        success: false,
        error: '주문 상세 정보 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 주문 아이템별 배송된 수량 조회
  async getShippedQuantityForItem(itemId: string): Promise<number> {
    try {
      const allocations = await this.prisma.shipmentAllocation.findMany({
        where: { orderItemId: itemId },
        select: { qty: true }
      });

      const totalShippedQuantity = allocations.reduce((sum, allocation) => sum + allocation.qty, 0);
      
      this.logger.log(`주문 아이템 배송 수량 조회: itemId=${itemId}, totalShippedQuantity=${totalShippedQuantity}`);
      
      return totalShippedQuantity;
    } catch (error) {
      this.logger.error(`주문 아이템 배송 수량 조회 실패: itemId=${itemId}`, error.stack);
      return 0;
    }
  }

  /**
   * 주문 취소 (사용자)
   * 상품준비중 이전 상태에서만 취소 가능
   */
  async cancelOrder(orderNumber: string, userId: string, reason: string) {
    try {
      this.logger.log(`주문 취소 시작: orderNumber=${orderNumber}, userId=${userId}, reason=${reason}`);

      // 주문 조회 및 권한 확인
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      if (order.userId !== userId) {
        throw new BadRequestException('자신의 주문만 취소할 수 있습니다.');
      }

      // 취소 가능한 상태인지 확인 (상품준비중 이전: PENDING, CONFIRMED)
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new BadRequestException('상품준비중이 시작된 주문은 취소할 수 없습니다.');
      }

      // 결제 정보 조회 (주문 metadata에서 paymentKey 확인)
      let paymentKey = null;
      if (order.metadata && typeof order.metadata === 'object') {
        paymentKey = (order.metadata as any).paymentKey;
      }

      if (!paymentKey) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다. 주문 metadata에 paymentKey가 없습니다.');
      }

      // 트랜잭션으로 주문 취소 및 환불 처리
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. 주문 상태를 CANCELLED로 변경
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            metadata: {
              ...(order.metadata as any),
              cancelledAt: new Date().toISOString(),
              cancelledBy: userId,
              cancelReason: reason
            }
          }
        });

        // 2. 결제 상태를 CANCELLED로 변경 (Payment 테이블이 있으면 업데이트)
        try {
          const existingPayment = await prisma.payment.findUnique({
            where: { orderId: order.id }
          });
          
          if (existingPayment) {
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: 'CANCELLED',
                metadata: {
                  ...(existingPayment.metadata as any),
                  cancelledAt: new Date().toISOString(),
                  cancelledBy: userId,
                  cancelReason: reason
                }
              }
            });
          }
        } catch (error) {
          this.logger.warn(`Payment 테이블 업데이트 실패 (무시됨): orderId=${order.id}`, error);
        }

        // 3. 자동 환불 레코드 생성
        const refund = await prisma.refund.create({
          data: {
            returnId: null, // 직접 취소이므로 returnId 없음
            orderId: order.id,
            orderItemId: null, // 전체 주문 취소
            paymentKey: paymentKey,
            refundAmount: Number(order.totalAmount),
            refundReason: 'CUSTOMER_CHANGE', // 구매자 변심
            status: 'PENDING',
            processedBy: userId,
            notes: `주문 취소로 인한 자동 환불: ${reason}`,
            metadata: {
              orderNumber: order.orderNumber,
              orderItemIds: order.items.map(item => item.id),
              isFullRefund: true,
              cancelledAt: new Date().toISOString(),
              cancelReason: reason
            }
          }
        });

        // 4. 토스페이먼츠 환불 API 자동 호출
        this.logger.log(`토스페이먼츠 자동 환불 시작: refundId=${refund.id}, paymentKey=${paymentKey}, amount=${Number(order.totalAmount)}`);
        
        try {
          const tossRefundResult = await this.callTossRefundAPI(paymentKey, Number(order.totalAmount), reason);
          this.logger.log(`토스페이먼츠 환불 API 응답:`, tossRefundResult);
          
          if (tossRefundResult.success) {
            // 환불 성공 시 상태 업데이트
            this.logger.log(`환불 성공 - 상태 업데이트 시작: refundId=${refund.id}`);
            
            const updatedRefund = await prisma.refund.update({
              where: { id: refund.id },
              data: {
                status: 'COMPLETED',
                tossRefundId: tossRefundResult.data?.transactionKey,
                transactionKey: tossRefundResult.data?.transactionKey,
                receiptKey: tossRefundResult.data?.receiptKey,
                refundedAt: new Date(),
                metadata: {
                  ...(refund.metadata as any),
                  tossResponse: tossRefundResult.data,
                  processedAt: new Date().toISOString()
                }
              }
            });
            
            this.logger.log(`토스페이먼츠 자동 환불 성공: refundId=${refund.id}, paymentKey=${paymentKey}, updatedStatus=${updatedRefund.status}`);
          } else {
            this.logger.warn(`토스페이먼츠 자동 환불 실패: refundId=${refund.id}, error=${tossRefundResult.error}`);
            this.logger.warn(`환불 상태는 PENDING으로 유지됩니다.`);
          }
        } catch (error) {
          this.logger.error(`토스페이먼츠 자동 환불 처리 중 오류: refundId=${refund.id}`, error);
          this.logger.error(`환불 상태는 PENDING으로 유지됩니다.`);
        }

        // 4. 재고 복원
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity
              }
            }
          });
        }

        // 5. 쿠폰 복원 (사용된 경우)
        if (order.couponId) {
          await prisma.userCoupon.updateMany({
            where: {
              couponId: order.couponId,
              userId: userId,
              deletedAt: { not: null }
            },
            data: {
              deletedAt: null
            }
          });
        }

        this.logger.log(`주문 취소 완료: orderNumber=${orderNumber}, refundId=${refund.id}`);

        return {
          success: true,
          data: {
            order: updatedOrder,
            refund: refund
          },
          message: '주문이 성공적으로 취소되었습니다. 환불이 자동으로 처리됩니다.'
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`주문 취소 실패: orderNumber=${orderNumber}, userId=${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * 토스페이먼츠 환불 API 호출
   */
  private async callTossRefundAPI(paymentKey: string, amount: number, reason: string): Promise<any> {
    try {
      const secretKey = process.env.TOSS_SECRET_KEY || process.env.TOSS_PAYMENTS_SECRET_KEY;
      if (!secretKey) {
        this.logger.error('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
        throw new Error('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
      }

      this.logger.log(`토스페이먼츠 환불 API 호출 시작: paymentKey=${paymentKey}, amount=${amount}, reason=${reason}`);
      this.logger.log(`환경 변수 TOSS_SECRET_KEY 확인: ${secretKey ? '설정됨' : '설정되지 않음'}`);

      const requestBody = {
        cancelReason: reason,
        cancelAmount: amount
      };
      
      this.logger.log(`토스페이먼츠 API 요청 본문:`, requestBody);

      const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      this.logger.log(`토스페이먼츠 API 응답 상태: ${response.status} ${response.statusText}`);
      this.logger.log(`토스페이먼츠 API 응답 헤더:`, Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      this.logger.log(`토스페이먼츠 API 응답 데이터:`, data);

      if (!response.ok) {
        this.logger.error(`토스페이먼츠 환불 실패 - HTTP ${response.status}:`, data);
        throw new Error(`토스페이먼츠 환불 실패: ${data.message || 'Unknown error'}`);
      }

      this.logger.log(`토스페이먼츠 환불 API 호출 성공:`, data);

      return {
        success: true,
        data: data.cancels?.[0] || data
      };
    } catch (error) {
      this.logger.error('토스페이먼츠 API 호출 실패:', error);
      this.logger.error('에러 스택:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
