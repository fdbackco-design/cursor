import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';

/** Toss Payments 결제 승인 API 응답 (참조용) */
interface TossConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method?: string;
  totalAmount: number;
  approvedAt: string;
  transactionKey?: string;
  metadata?: Record<string, unknown>;
  easyPay?: { provider?: string };
}

/** 결제 승인 시 전달 가능한 주문 메타데이터 (직접결제/장바구니) */
export interface ConfirmOrderMetadata {
  items?: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    finalPrice: number;
  }>;
  shippingAddress?: Record<string, unknown>;
  billingAddress?: Record<string, unknown>;
  addressId?: string;
  couponId?: string;
  discountAmount?: number;
  shippingAmount?: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly tossPaymentsUrl = 'https://api.tosspayments.com/v1/payments';
  private readonly secretKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // TOSS_SECRET_KEY 또는 TOSS_PAYMENTS_SECRET_KEY (Payment Widget Secret Key 사용)
    this.secretKey =
      this.configService.get<string>('TOSS_SECRET_KEY') ||
      this.configService.get<string>('TOSS_PAYMENTS_SECRET_KEY') ||
      '';

    if (!this.secretKey) {
      this.logger.warn(
        'TOSS_SECRET_KEY 또는 TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다. 결제 승인이 불가합니다.',
      );
    } else {
      const prefix = this.secretKey.substring(0, 12);
      this.logger.log(`토스페이먼츠 시크릿 키 로드됨: ${prefix}...`);
    }
  }

  private getAuthHeader(): string {
    // Basic base64(secretKey + ':') - 콜론 필수 (Toss 문서)
    return `Basic ${Buffer.from(this.secretKey + ':', 'utf-8').toString('base64')}`;
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
      const existingPayment = await this.prisma.payment.findFirst({
        where: { orderId: data.orderId },
      });

      if (existingPayment) {
        throw new BadRequestException('이미 존재하는 주문 ID입니다.');
      }

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
        },
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
        },
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
    orderMetadata?: ConfirmOrderMetadata;
  }) {
    try {
      const existingPayment = await this.prisma.payment.findFirst({
        where: { orderId: data.orderId },
      });

      if (!existingPayment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }

      if (existingPayment.status === 'COMPLETED') {
        this.logger.log(`이미 승인된 결제: orderId=${data.orderId}`);
        const order = await this.prisma.order.findFirst({
          where: { orderNumber: data.orderId },
          include: { items: { include: { product: true } } },
        });
        return {
          success: true,
          message: '이미 승인된 결제입니다.',
          data: {
            orderId: data.orderId,
            paymentKey: data.paymentKey,
            amount: existingPayment.amount,
            status: 'COMPLETED',
            order,
          },
        };
      }

      // 1. 토스페이먼츠 결제 승인 API 호출 (반드시 먼저 수행)
      const tossResponse = await this.confirmWithTossPayments({
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        amount: data.amount,
      });

      // 2. 결제 승인 성공 시에만 주문 생성
      const result = await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            paymentKey: data.paymentKey,
            status: 'COMPLETED',
            method: tossResponse.method,
            pgTransactionId: tossResponse.transactionKey,
            approvedAt: new Date(tossResponse.approvedAt),
            metadata: tossResponse as object,
          },
        });

        let existingOrder = await tx.order.findFirst({
          where: { orderNumber: data.orderId },
        });

        if (!existingOrder) {
          this.logger.log(`새 주문 생성 시작: orderNumber=${data.orderId}`);

          const metadata = (tossResponse.metadata || {}) as Record<string, unknown>;
          const addressId =
            (data.orderMetadata?.addressId as string) ||
            (metadata.addressId as string | undefined);

          let shippingAddress: Record<string, unknown> =
            (data.orderMetadata?.shippingAddress as Record<string, unknown>) || {};
          let billingAddress: Record<string, unknown> =
            (data.orderMetadata?.billingAddress as Record<string, unknown>) || shippingAddress;

          if (addressId && Object.keys(shippingAddress).length === 0) {
            const addr = await this.prisma.userAddress.findUnique({
              where: { id: addressId },
            });
            if (addr) {
              shippingAddress = {
                receiver_name: addr.receiverName,
                base_address: addr.baseAddress,
                detail_address: addr.detailAddress || '',
                zone_number: addr.zoneNumber || '',
                phone: addr.receiverPhoneNumber1 || '',
              };
              billingAddress = { ...shippingAddress };
            }
          }

          let orderItems: Array<{
            productId: string;
            productName: string;
            productSku: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            finalPrice: number;
          }> = [];
          let subtotal = payment.amount;
          let discountAmount = data.orderMetadata?.discountAmount ?? 0;
          let shippingAmount = data.orderMetadata?.shippingAmount ?? 0;

          if (data.orderMetadata?.items && data.orderMetadata.items.length > 0) {
            orderItems = data.orderMetadata.items;
            subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
          } else {
            const cart = await tx.cart.findFirst({
              where: { userId: existingPayment.customerId },
              include: { items: { include: { product: true } } },
            });

            if (!cart || cart.items.length === 0) {
              throw new BadRequestException('장바구니가 비어있습니다. 주문할 상품이 없습니다.');
            }

            orderItems = cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.product.priceB2C.toNumber(),
              totalPrice: item.product.priceB2C.toNumber() * item.quantity,
              finalPrice: item.product.priceB2C.toNumber() * item.quantity,
            }));
          }

          const totalAmount = payment.amount;
          const couponId = data.orderMetadata?.couponId || (metadata.couponId as string | undefined);

          const newOrder = await tx.order.create({
            data: {
              orderNumber: data.orderId,
              userId: existingPayment.customerId,
              couponId: couponId || null,
              subtotal,
              discountAmount,
              shippingAmount,
              taxAmount: 0,
              totalAmount,
              status: 'CONFIRMED',
              shippingAddress: shippingAddress as object,
              billingAddress: billingAddress as object,
              metadata: {
                paymentKey: data.paymentKey,
                paidAmount: totalAmount,
                method: tossResponse.method,
                paymentMethod: tossResponse.method,
                easyPayProvider: tossResponse.easyPay?.provider ?? null,
                easyPay: tossResponse.easyPay ?? null,
              },
              items: {
                create: orderItems.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  productSku: item.productSku,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  discountAmount: 0,
                  finalPrice: item.finalPrice,
                })),
              },
            },
            include: {
              items: { include: { product: true } },
            },
          });

          for (const item of orderItems) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQuantity: true, name: true },
            });
            if (!product) {
              throw new BadRequestException(`상품을 찾을 수 없습니다: ${item.productId}`);
            }
            if (product.stockQuantity < item.quantity) {
              throw new BadRequestException(
                `재고 부족: ${product.name}, 요청=${item.quantity}, 재고=${product.stockQuantity}`,
              );
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { decrement: item.quantity } },
            });
          }

          const cart = await tx.cart.findFirst({
            where: { userId: existingPayment.customerId },
            include: { items: true },
          });
          if (cart?.items?.length) {
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          }

          this.logger.log(`주문 생성 완료: orderNumber=${data.orderId}, items=${orderItems.length}개`);
          return { payment, order: newOrder };
        }

        return { payment, order: existingOrder };
      });

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
        },
      };
    } catch (error) {
      this.logger.error('결제 승인 실패:', error);

      try {
        const failed = await this.prisma.payment.findFirst({
          where: { orderId: data.orderId },
        });
        if (failed) {
          await this.prisma.payment.update({
            where: { id: failed.id },
            data: {
              status: 'FAILED',
              failureReason: (error as Error).message?.substring(0, 500) || '결제 승인 실패',
            },
          });
        }
      } catch (ue) {
        this.logger.error('결제 실패 상태 업데이트 실패:', ue);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        (error as Error).message || '결제 승인에 실패했습니다.',
      );
    }
  }

  private async confirmWithTossPayments(data: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<TossConfirmResponse> {
    if (!this.secretKey) {
      throw new BadRequestException('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
    }

    try {
      const response = await axios.post<TossConfirmResponse>(
        `${this.tossPaymentsUrl}/confirm`,
        {
          paymentKey: data.paymentKey,
          orderId: data.orderId,
          amount: data.amount,
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      this.logger.log(`토스페이먼츠 결제 승인 성공: orderId=${data.orderId}`);
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ code?: string; message?: string }>;
      const status = axiosError.response?.status;
      const body = axiosError.response?.data;

      this.logger.error('토스페이먼츠 API 오류', {
        status,
        code: body?.code,
        message: body?.message,
        fullBody: JSON.stringify(body || {}),
      });

      if (status === 401) {
        throw new BadRequestException(
          '결제 인증 실패: 시크릿 키가 올바르지 않습니다. TOSS_SECRET_KEY를 확인하세요.',
        );
      }
      if (status === 403) {
        throw new BadRequestException(
          '결제 권한 오류: Payment Widget용 Secret Key(test_sk_/live_sk_)를 사용해야 합니다. API 개별키가 아닌 시크릿 키를 확인하세요.',
        );
      }
      if (status && status >= 400) {
        const msg = body?.message || axiosError.message || '결제 승인에 실패했습니다.';
        throw new BadRequestException(msg);
      }

      throw err;
    }
  }

  async getPayment(paymentKey: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { paymentKey },
    });
    if (!payment) {
      throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
    }
    return { success: true, data: payment };
  }

  async getPaymentByOrderId(orderId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
    });
    if (!payment) {
      throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
    }
    return { success: true, data: payment };
  }

  async cancelPayment(
    paymentKey: string,
    data: { cancelReason: string; cancelAmount?: number },
  ) {
    if (!this.secretKey) {
      throw new BadRequestException('토스페이먼츠 시크릿 키가 설정되지 않았습니다.');
    }

    const cancelPayload: Record<string, unknown> = { cancelReason: data.cancelReason };
    if (data.cancelAmount) cancelPayload.cancelAmount = data.cancelAmount;

    const response = await axios.post(
      `${this.tossPaymentsUrl}/${paymentKey}/cancel`,
      cancelPayload,
      {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    const existingPayment = await this.prisma.payment.findFirst({
      where: { paymentKey },
    });
    if (!existingPayment) {
      throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
    }

    await this.prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: data.cancelAmount ? 'PARTIALLY_CANCELLED' : 'CANCELLED',
        metadata: response.data,
      },
    });

    return {
      success: true,
      message: '결제가 취소되었습니다.',
      data: existingPayment,
    };
  }

  async getPaymentInfo(paymentKey: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { paymentKey },
      select: {
        id: true,
        paymentKey: true,
        orderId: true,
        amount: true,
        status: true,
        method: true,
        customerId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (payment) {
      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const inner = (metadata.metadata as Record<string, unknown>) || metadata;
      return {
        success: true,
        data: {
          paymentKey: payment.paymentKey,
          orderId: payment.orderId,
          amount: payment.amount,
          status: payment.status,
          method: payment.method ?? (metadata.method as string),
          easyPay: metadata.easyPay || inner.easyPay || null,
          customerId: payment.customerId,
          metadata,
          couponId: metadata.couponId ?? inner.couponId ?? null,
          couponDiscount: metadata.couponDiscount ?? inner.couponDiscount ?? 0,
          addressId: metadata.addressId ?? inner.addressId ?? null,
          pointsUsed: metadata.pointsUsed ?? inner.pointsUsed ?? 0,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      };
    }

    throw new BadRequestException(
      '결제 정보를 찾을 수 없습니다. 결제 승인(confirm) 후에만 조회할 수 있습니다.',
    );
  }
}
