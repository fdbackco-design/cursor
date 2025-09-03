import { Controller, Post, Body, Get, Param, UseGuards, Req, Query, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(private readonly paymentsService: PaymentsService) {}

  // 결제 요청 생성
  @Post('prepare')
  @UseGuards(JwtAuthGuard)
  async preparePayment(
    @Body() body: {
      orderId: string;
      orderName: string;
      amount: number;
      customerEmail?: string;
      customerName?: string;
      customerMobilePhone?: string;
    },
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    return this.paymentsService.preparePayment({
      ...body,
      customerKey: user.id,
      customerId: user.id,
    });
  }

  // 결제 승인 (JWT 인증 없이)
  @Get('confirm')
  async confirmPaymentGet(
    @Query('paymentKey') paymentKey: string,
    @Query('orderId') orderId: string,
    @Query('amount') amount: string
  ) {
    this.logger.log(`결제 승인 요청 (GET): paymentKey=${paymentKey}, orderId=${orderId}, amount=${amount}`);
    
    return this.paymentsService.confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
    });
  }

  // 결제 승인 (POST - 프론트엔드용, JWT 인증 필요)
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @Body() body: {
      paymentKey: string;
      orderId: string;
      amount: number;
    }
  ) {
    this.logger.log(`결제 승인 요청 (POST): paymentKey=${body.paymentKey}, orderId=${body.orderId}, amount=${body.amount}`);
    
    return this.paymentsService.confirmPayment({
      ...body,
    });
  }

  // 결제 정보 조회 (쿠폰 정보 포함)
  @Get(':paymentKey/info')
  @UseGuards(JwtAuthGuard)
  async getPaymentInfo(@Param('paymentKey') paymentKey: string) {
    this.logger.log(`결제 정보 조회 요청: paymentKey=${paymentKey}`);
    
    return this.paymentsService.getPaymentInfo(paymentKey);
  }

  // 결제 조회
  @Get(':paymentKey')
  async getPayment(@Param('paymentKey') paymentKey: string) {
    return this.paymentsService.getPayment(paymentKey);
  }

  // 주문 ID로 결제 조회
  @Get('order/:orderId')
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }

  // 결제 취소
  @Post(':paymentKey/cancel')
  async cancelPayment(
    @Param('paymentKey') paymentKey: string,
    @Body() body: {
      cancelReason: string;
      cancelAmount?: number;
    }
  ) {
    return this.paymentsService.cancelPayment(paymentKey, body);
  }
}
