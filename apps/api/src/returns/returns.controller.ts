import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  Query, 
  Req, 
  Logger,
  UseGuards
} from '@nestjs/common';
import { ReturnsService, CreateReturnDto, UpdateReturnStatusDto, ReturnQueryDto } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  private readonly logger = new Logger(ReturnsController.name);

  constructor(private readonly returnsService: ReturnsService) {}

  // 반품/교환/취소 요청 생성
  @Post()
  async createReturn(
    @Body() createReturnDto: CreateReturnDto,
    @Req() req: any
  ) {
    const user = req.user;
    this.logger.log(`반품 요청 생성: userId=${user.id}, orderId=${createReturnDto.orderId}`);
    
    return this.returnsService.createReturn(createReturnDto);
  }

  // 반품/교환/취소 목록 조회 (관리자용)
  @Get('admin')
  async getReturns(
    @Query() query: ReturnQueryDto,
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`반품 목록 조회: adminId=${user.id}`);
    
    return this.returnsService.getReturns(query);
  }

  // 반품/교환/취소 상세 조회
  @Get(':id')
  async getReturnById(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const user = req.user;
    this.logger.log(`반품 상세 조회: userId=${user.id}, returnId=${id}`);
    
    return this.returnsService.getReturnById(id);
  }

  // 반품/교환/취소 상태 업데이트 (관리자용)
  @Patch('admin/:id/status')
  async updateReturnStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReturnStatusDto,
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`반품 상태 업데이트: adminId=${user.id}, returnId=${id}, status=${updateDto.status}`);
    
    // 처리자 정보 추가
    updateDto.processedBy = user.id;
    
    return this.returnsService.updateReturnStatus(id, updateDto);
  }

  // 반품 통계 조회 (관리자용)
  @Get('admin/stats')
  async getReturnStats(@Req() req: any) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`반품 통계 조회: adminId=${user.id}`);
    
    return this.returnsService.getReturnStats();
  }

  // 자동 승인 규칙 적용
  @Post('admin/:id/auto-approve')
  async processAutoApproval(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`자동 승인 처리: adminId=${user.id}, returnId=${id}`);
    
    const result = await this.returnsService.processAutoApprovalRules(id);
    
    return {
      success: true,
      data: { autoApproved: result },
      message: result ? '자동 승인이 적용되었습니다.' : '자동 승인 조건에 해당하지 않습니다.'
    };
  }

  // 환불 처리 (PG사 연동)
  @Post('admin/:id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body() body: { refundAmount: number; reason?: string },
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`환불 처리: adminId=${user.id}, returnId=${id}, amount=${body.refundAmount}`);
    
    // TODO: PG사 환불 API 연동
    // 현재는 시뮬레이션으로 처리
    const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.returnsService.updateReturnStatus(id, {
      status: 'PROCESSING',
      refundId,
      adminNotes: `환불 처리: ${body.refundAmount}원, 사유: ${body.reason || '반품 환불'}`,
      processedBy: user.id
    });

    return {
      success: true,
      data: {
        ...result.data,
        refundId,
        refundAmount: body.refundAmount
      },
      message: '환불 처리가 시작되었습니다.'
    };
  }

  // 교환 상품 출고 처리
  @Post('admin/:id/exchange-ship')
  async processExchangeShipment(
    @Param('id') id: string,
    @Body() body: { trackingNumber: string; carrier: string },
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`교환 상품 출고: adminId=${user.id}, returnId=${id}, trackingNumber=${body.trackingNumber}`);
    
    const result = await this.returnsService.updateReturnStatus(id, {
      status: 'PROCESSING',
      exchangeTrackingNumber: body.trackingNumber,
      exchangeCarrier: body.carrier,
      adminNotes: `교환 상품 출고: ${body.carrier} ${body.trackingNumber}`,
      processedBy: user.id
    });

    return {
      success: true,
      data: result.data,
      message: '교환 상품이 출고되었습니다.'
    };
  }

  // 반품 회수 요청
  @Post('admin/:id/pickup-request')
  async requestPickup(
    @Param('id') id: string,
    @Body() body: { carrier: string; pickupDate?: string },
    @Req() req: any
  ) {
    const user = req.user;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`반품 회수 요청: adminId=${user.id}, returnId=${id}, carrier=${body.carrier}`);
    
    // TODO: 택배사 회수 API 연동
    // 현재는 시뮬레이션으로 처리
    const trackingNumber = `PICKUP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.returnsService.updateReturnStatus(id, {
      status: 'PROCESSING',
      trackingNumber,
      carrier: body.carrier,
      adminNotes: `반품 회수 요청: ${body.carrier}, 예정일: ${body.pickupDate || '즉시'}`,
      processedBy: user.id
    });

    return {
      success: true,
      data: {
        ...result.data,
        pickupTrackingNumber: trackingNumber,
        carrier: body.carrier
      },
      message: '반품 회수가 요청되었습니다.'
    };
  }
}