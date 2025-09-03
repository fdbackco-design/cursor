import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto, ProcessRefundDto, RefundQueryDto } from './dto/refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('refunds')
@UseGuards(JwtAuthGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  /**
   * 환불 금액 계산
   */
  @Post('calculate')
  async calculateRefundAmount(
    @Body() body: { orderId: string; orderItemIds?: string[]; refundReason?: string },
    @Req() req: any
  ) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    return this.refundsService.calculateRefundAmount(
      body.orderId,
      body.orderItemIds,
      body.refundReason as any
    );
  }

  /**
   * 환불 생성
   */
  @Post()
  async createRefund(@Body() createRefundDto: CreateRefundDto, @Req() req: any) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    createRefundDto.processedBy = user.id;
    return this.refundsService.createRefund(createRefundDto);
  }

  /**
   * 환불 처리 (토스페이먼츠 API 호출)
   */
  @Patch(':id/process')
  async processRefund(
    @Param('id') refundId: string,
    @Body() processRefundDto: ProcessRefundDto,
    @Req() req: any
  ) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    processRefundDto.processedBy = user.id;
    return this.refundsService.processRefund(refundId, processRefundDto);
  }

  /**
   * 환불 내역 조회
   */
  @Get()
  async getRefunds(@Query() query: RefundQueryDto, @Req() req: any) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    return this.refundsService.getRefunds(query);
  }

  /**
   * 환불 통계 조회
   */
  @Get('stats')
  async getRefundStats(@Req() req: any) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    return this.refundsService.getRefundStats();
  }

  /**
   * 특정 환불 상세 조회
   */
  @Get(':id')
  async getRefund(@Param('id') refundId: string, @Req() req: any) {
    const user = req.user;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    const result = await this.refundsService.getRefunds({ returnId: refundId });
    return result.refunds[0] || null;
  }
}
