import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly tossPaymentsUrl = 'https://api.tosspayments.com/v1/payments';
  private readonly secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

  constructor(private prisma: PrismaService) {
    if (!process.env.TOSS_PAYMENTS_SECRET_KEY) {
      this.logger.warn('TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다. 기본 테스트 키를 사용합니다.');
    }
    this.logger.log(`토스페이먼츠 시크릿 키 로드됨: ${this.secretKey.substring(0, 20)}...`);
  }

  async preparePayment(data: {
    orderId: string;
    orderName: string;
    amount: number;
    customerKey: string;
    customerId: string;
    customerEmail?: string;
    customerName?: string;
    customerMobilePhone?: string;
  }) {
    try {
      // 주문 ID가 이미 존재하는지 확인
      const existingPayment = await this.prisma.payment.findFirst({
        where: { orderId: data.orderId }
      });

      if (existingPayment) {
        throw new BadRequestException('이미 존재하는 주문 ID입니다.');
      }

      // 결제 정보를 데이터베이스에 저장 (PENDING 상태)
      const payment = await this.prisma.payment.create({
        data: {
          orderId: data.orderId,
          orderName: data.orderName,
          amount: data.amount,
          customerKey: data.customerKey,
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          customerMobilePhone: data.customerMobilePhone,
          status: 'PENDING',
          method: null,
          paymentKey: null,
          pgTransactionId: null,
          metadata: {},
        }
      });

      this.logger.log(`결제 준비 완료: orderId=${data.orderId}, amount=${data.amount}`);

      return {
        success: true,
        message: '결제가 준비되었습니다.',
        data: {
          orderId: payment.orderId,
          orderName: payment.orderName,
          amount: payment.amount,
          customerKey: payment.customerKey,
        }
      };
    } catch (error) {
      this.logger.error('결제 준비 실패:', error);
      throw error;
    }
  }

  async confirmPayment(data: {
    paymentKey: string;
    orderId: string;
    amount: number;
    customerId?: string;
  }) {
    try {
      // 기존 결제 정보 조회
      const existingPayment = await this.prisma.payment.findFirst({
        where: { orderId: data.orderId }
      });

      if (!existingPayment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }

      // 이미 승인된 결제인지 확인
      if (existingPayment.status === 'COMPLETED') {
        this.logger.log(`이미 승인된 결제: orderId=${data.orderId}, paymentKey=${data.paymentKey}`);
        return {
          success: true,
          message: '이미 승인된 결제입니다.',
          payment: existingPayment
        };
      }

      // 이미 승인 요청 중인지 확인 (paymentKey가 동일한지)
      if (existingPayment.paymentKey === data.paymentKey && existingPayment.status === 'PENDING') {
        this.logger.warn(`중복 승인 요청 감지: orderId=${data.orderId}, paymentKey=${data.paymentKey}`);
        throw new BadRequestException('이미 처리중인 결제입니다. 잠시 후 다시 시도해주세요.');
      }

      // 토스페이먼츠 결제 승인 요청
      const tossResponse = await this.confirmWithTossPayments({
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.amount,
      });

      // 트랜잭션으로 결제 승인과 주문 생성을 함께 처리
      const result = await this.prisma.$transaction(async (tx) => {
        // 결제 정보 업데이트
        const payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentKey: data.paymentKey,
            status: 'COMPLETED',
            method: tossResponse.method,
            pgTransactionId: tossResponse.transactionKey,
            approvedAt: new Date(tossResponse.approvedAt),
            metadata: tossResponse,
          }
        });

        // 기존 주문이 있는지 확인
        const existingOrder = await tx.order.findFirst({
          where: { orderNumber: data.orderId }
        });

        let order;
        if (!existingOrder) {
          this.logger.log(`새 주문 생성 시작: orderNumber=${data.orderId}`);
          // 사용자의 장바구니 아이템 조회
          const cart = await tx.cart.findFirst({
            where: { userId: existingPayment.customerId },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          });

          if (!cart || cart.items.length === 0) {
            throw new Error('장바구니가 비어있습니다.');
          }

          // 주문 생성
          order = await tx.order.create({
            data: {
              orderNumber: data.orderId,
              userId: existingPayment.customerId,
              subtotal: payment.amount,
              totalAmount: payment.amount,
              status: 'CONFIRMED',
              shippingAddress: {}, // 기본값, 나중에 사용자 주소로 업데이트 가능
              billingAddress: {}, // 기본값
              items: {
                create: cart.items.map(item => ({
                  productId: item.productId,
                  productName: item.product.name,
                  productSku: item.product.sku,
                  quantity: item.quantity,
                  unitPrice: item.product.priceB2C.toNumber(),
                  totalPrice: item.product.priceB2C.toNumber() * item.quantity,
                  finalPrice: item.product.priceB2C.toNumber() * item.quantity,
                }))
              }
            },
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          });

          // 재고 차감 처리
          for (const item of cart.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQuantity: true, name: true }
            });

            if (!product) {
              throw new Error(`상품을 찾을 수 없습니다: ${item.productId}`);
            }

            if (product.stockQuantity < item.quantity) {
              throw new Error(`재고가 부족합니다. 상품: ${product.name}, 요청 수량: ${item.quantity}, 현재 재고: ${product.stockQuantity}`);
            }

            // 재고 차감
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            });

            this.logger.log(`재고 차감 완료: productId=${item.productId}, quantity=${item.quantity}`);
          }

          // 장바구니 비우기
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id }
          });

          this.logger.log(`주문 생성 완료: orderNumber=${data.orderId}, orderItems=${order.items.length}개`);
        } else {
          order = existingOrder;
          this.logger.log(`기존 주문 확인: orderId=${data.orderId}`);
        }

        return { payment, order };
      });

      this.logger.log(`결제 승인 완료: orderId=${data.orderId}, paymentKey=${data.paymentKey}`);

      return {
        success: true,
        message: '결제가 완료되었습니다.',
        data: {
          orderId: result.payment.orderId,
          paymentKey: result.payment.paymentKey,
          amount: result.payment.amount,
          status: result.payment.status,
          approvedAt: result.payment.approvedAt,
          order: result.order,
        }
      };
    } catch (error) {
      this.logger.error('결제 승인 실패:', error);
      
      // 결제 실패 시 상태 업데이트
      try {
        const failedPayment = await this.prisma.payment.findFirst({
          where: { orderId: data.orderId }
        });
        if (failedPayment) {
          await this.prisma.payment.update({
            where: { id: failedPayment.id },
            data: {
              status: 'FAILED',
              failureReason: error.message?.substring(0, 500) || '결제 승인 실패',
            }
          });
        }
      } catch (updateError) {
        this.logger.error('결제 실패 상태 업데이트 실패:', updateError);
      }

      throw new BadRequestException('결제 승인에 실패했습니다.');
    }
  }

  async getPayment(paymentKey: string) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { paymentKey }
      });

      if (!payment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }

      return {
        success: true,
        data: payment
      };
    } catch (error) {
      this.logger.error('결제 조회 실패:', error);
      throw error;
    }
  }

  async getPaymentByOrderId(orderId: string) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { orderId }
      });

      if (!payment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }

      return {
        success: true,
        data: payment
      };
    } catch (error) {
      this.logger.error('결제 조회 실패:', error);
      throw error;
    }
  }

  async cancelPayment(paymentKey: string, data: {
    cancelReason: string;
    cancelAmount?: number;
  }) {
    try {
      if (!this.secretKey) {
        throw new BadRequestException('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
      }

      const cancelData: any = {
        cancelReason: data.cancelReason,
      };

      if (data.cancelAmount) {
        cancelData.cancelAmount = data.cancelAmount;
      }

      const response = await axios.post(
        `${this.tossPaymentsUrl}/${paymentKey}/cancel`,
        cancelData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      // 기존 결제 정보 조회
      const existingPayment = await this.prisma.payment.findFirst({
        where: { paymentKey }
      });

      if (!existingPayment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }

      // 데이터베이스 업데이트
      const payment = await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: data.cancelAmount ? 'PARTIALLY_CANCELLED' : 'CANCELLED',
          metadata: response.data,
        }
      });

      this.logger.log(`결제 취소 완료: paymentKey=${paymentKey}`);

      return {
        success: true,
        message: '결제가 취소되었습니다.',
        data: payment
      };
    } catch (error) {
      this.logger.error('결제 취소 실패:', error);
      throw new BadRequestException('결제 취소에 실패했습니다.');
    }
  }

  private async confirmWithTossPayments(data: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }) {
    if (!this.secretKey) {
      throw new BadRequestException('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
    }

    try {
      const response = await axios.post(
        `${this.tossPaymentsUrl}/confirm`,
        {
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          amount: data.amount,
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      this.logger.log(`토스페이먼츠 결제 승인 성공: orderId=${data.orderId}, paymentKey=${data.paymentKey}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      this.logger.error('토스페이먼츠 승인 실패:', errorData || error.message);

      // [S008] 기존 요청을 처리중입니다 오류 처리
      if (errorData?.code === 'FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING' && 
          errorData?.message?.includes('기존 요청을 처리중입니다')) {
        this.logger.warn(`토스페이먼츠 중복 요청 감지, 결제 상태 조회 시도: paymentKey=${data.paymentKey}`);
        
        // 잠시 대기 후 결제 상태 조회
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const statusResponse = await this.getPaymentStatus(data.paymentKey);
          if (statusResponse.status === 'DONE') {
            this.logger.log(`결제 상태 조회 성공 - 이미 완료된 결제: orderId=${data.orderId}, paymentKey=${data.paymentKey}`);
            return statusResponse;
          }
        } catch (statusError) {
          this.logger.error('결제 상태 조회 실패:', statusError.response?.data || statusError.message);
        }
      }

      throw error;
    }
  }

  // 토스페이먼츠 결제 상태 조회
  private async getPaymentStatus(paymentKey: string) {
    const response = await axios.get(
      `${this.tossPaymentsUrl}/${paymentKey}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        },
      }
    );

    return response.data;
  }

  // 결제 정보 조회 (public 메서드)
  async getPaymentInfo(paymentKey: string) {
    try {
      // DB에서 결제 정보 조회
      const payment = await this.prisma.payment.findFirst({
        where: { paymentKey },
        select: {
          id: true,
          paymentKey: true,
          orderId: true,
          amount: true,
          status: true,
          customerId: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!payment) {
        // DB에 없으면 토스페이먼츠에서 직접 조회
        const tossData = await this.getPaymentStatus(paymentKey);
        return {
          success: true,
          data: {
            paymentKey: tossData.paymentKey,
            orderId: tossData.orderId,
            amount: tossData.totalAmount,
            status: tossData.status,
            method: tossData.method,
            approvedAt: tossData.approvedAt,
            metadata: tossData.metadata || {}
          }
        };
      }

      // DB에서 메타데이터 파싱하여 쿠폰 정보 추출
      const metadata = payment.metadata as any;
      //console.log('결제 메타데이터 구조:', JSON.stringify(metadata, null, 2));
      
      // 메타데이터에서 쿠폰 정보 추출 (여러 가능한 경로 시도)
      const couponId = metadata?.couponId || metadata?.metadata?.couponId || null;
      const couponDiscount = metadata?.couponDiscount || metadata?.metadata?.couponDiscount || 0;
      const addressId = metadata?.addressId || metadata?.metadata?.addressId || null;
      const pointsUsed = metadata?.pointsUsed || metadata?.metadata?.pointsUsed || 0;
      
      //console.log('추출된 쿠폰 정보:', { couponId, couponDiscount, addressId, pointsUsed });
      
      return {
        success: true,
        data: {
          paymentKey: payment.paymentKey,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
          customerId: payment.customerId,
          metadata: metadata || {},
          // 추출된 쿠폰 정보
          couponId,
          couponDiscount,
          addressId,
          pointsUsed,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        }
      };
    } catch (error) {
      this.logger.error('결제 정보 조회 실패:', error);
      return {
        success: false,
        error: error.message || '결제 정보 조회에 실패했습니다.'
      };
    }
  }
}
