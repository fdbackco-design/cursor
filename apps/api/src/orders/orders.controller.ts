import { Controller, Get, Post, Param, UseGuards, Req, Query, Body, Patch, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { DeliveryTrackingQueryDto } from './dto/delivery-tracking.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  
  constructor(private readonly ordersService: OrdersService) {}

  // 주문 생성 (결제 승인 후)
  @Post()
  async createOrder(
    @Req() req: Request,
    @Body() createOrderDto: CreateOrderDto
  ) {
    try {
      const user = req.user as any;
      this.logger.log(`주문 생성 요청: userId=${user.id}, orderNumber=${createOrderDto.orderNumber}`);
      this.logger.log(`주문 생성 요청 데이터:`, {
        ...createOrderDto,
        items: createOrderDto.items?.length || 0,
        shippingAddress: !!createOrderDto.shippingAddress,
        billingAddress: !!createOrderDto.billingAddress
      });
      
      return this.ordersService.createOrder(user.id, createOrderDto);
    } catch (error) {
      this.logger.error('주문 생성 컨트롤러 오류:', error);
      throw error;
    }
  }

  // 사용자의 주문 내역 조회
  @Get()
  async getUserOrders(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const user = req.user as any;
    this.logger.log(`사용자 주문 내역 조회: userId=${user.id}, page=${page}, limit=${limit}, status=${status}`);
    
    return this.ordersService.getUserOrders(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status
    });
  }

  // 특정 주문 상세 조회
  @Get(':orderNumber')
  async getOrderDetail(
    @Param('orderNumber') orderNumber: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    this.logger.log(`주문 상세 조회: orderNumber=${orderNumber}, userId=${user.id}`);
    
    return this.ordersService.getOrderDetail(orderNumber, user.id);
  }

  // 주문 취소 (사용자)
  @Post(':orderNumber/cancel')
  async cancelOrder(
    @Param('orderNumber') orderNumber: string,
    @Req() req: Request,
    @Body() cancelData: { reason: string }
  ) {
    const user = req.user as any;
    this.logger.log(`주문 취소 요청: orderNumber=${orderNumber}, userId=${user.id}, reason=${cancelData.reason}`);
    
    return this.ordersService.cancelOrder(orderNumber, user.id, cancelData.reason);
  }

  // 배송 추적 정보 조회 (사용자별)
  @Get('delivery/tracking')
  async getDeliveryTracking(
    @Req() req: Request,
    @Query() query: DeliveryTrackingQueryDto
  ) {
    const user = req.user as any;
    this.logger.log(`배송 추적 조회: userId=${user.id}, query=${JSON.stringify(query)}`);
    
    // 사용자는 자신의 주문만 조회 가능
    const trackingQuery = { ...query, userId: user.id };
    return this.ordersService.getDeliveryTracking(trackingQuery);
  }

  // 관리자 전용: 모든 주문 조회
  @Get('admin/all')
  async getAllOrdersForAdmin(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('vendorId') vendorId?: string,
    @Query('paymentMethod') paymentMethod?: string
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 목록 조회: adminId=${user.id}, page=${page}, limit=${limit}, status=${status}, search=${search}, vendorId=${vendorId}, paymentMethod=${paymentMethod}`);
    
    return this.ordersService.getAllOrdersForAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
      search,
      vendorId,
      paymentMethod
    });
  }

  // 관리자 전용: vendor 목록 조회
  @Get('admin/vendors')
  async getVendorsForAdmin(@Req() req: Request) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 vendor 목록 조회: adminId=${user.id}`);
    
    return this.ordersService.getVendorsForAdmin();
  }

  // 관리자 전용: 주문 상태 변경
  @Patch('admin/:orderNumber/status')
  async updateOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Body('status') status: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 상태 변경: adminId=${user.id}, orderNumber=${orderNumber}, status=${status}`);
    
    return this.ordersService.updateOrderStatus(orderNumber, status);
  }

  // 관리자 전용: 주문 메모 업데이트 (임시 해결책)
  @Patch('admin/:orderNumber/update-notes')
  async updateOrderNotes2(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { notes: string },
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인 (임시로 주석 처리)
    // if (user.role !== 'ADMIN') {
    //   throw new Error('관리자 권한이 필요합니다.');
    // }

    this.logger.log(`주문 메모 업데이트: orderNumber=${orderNumber}, notes=${body.notes}`);
    return this.ordersService.updateOrderNotes(orderNumber, body.notes);
  }

  // 관리자 전용: 주문 배송 정보 업데이트
  @Patch('admin/:orderId/delivery')
  async updateOrderDelivery(
    @Param('orderId') orderId: string,
    @Body() body: { courier: string; trackingNumber: string },
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 배송 정보 업데이트: adminId=${user.id}, orderId=${orderId}, courier=${body.courier}, trackingNumber=${body.trackingNumber}`);
    
    return this.ordersService.updateOrderDelivery(orderId, body.courier, body.trackingNumber);
  }

  // 관리자 전용: 주문 아이템별 배송 정보 업데이트
  @Patch('admin/:orderId/delivery/item')
  async updateOrderDeliveryWithItem(
    @Param('orderId') orderId: string,
    @Body() body: { itemId: string; courier: string; trackingNumber: string; quantity: number },
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 아이템별 배송 정보 업데이트: adminId=${user.id}, orderId=${orderId}, itemId=${body.itemId}, courier=${body.courier}, trackingNumber=${body.trackingNumber}, quantity=${body.quantity}`);
    
    return this.ordersService.updateOrderDeliveryWithItem(orderId, body.itemId, body.courier, body.trackingNumber, body.quantity);
  }

  // 관리자 전용: 주문 상세 조회
  @Get('admin/:orderNumber')
  async getOrderDetailForAdmin(
    @Param('orderNumber') orderNumber: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 상세 조회: adminId=${user.id}, orderNumber=${orderNumber}`);
    
    return this.ordersService.getOrderDetailForAdmin(orderNumber);
  }

  // 관리자 전용: 주문 아이템별 배송된 수량 조회
  @Get('admin/item/:itemId/shipped-quantity')
  async getShippedQuantityForItem(
    @Param('itemId') itemId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    this.logger.log(`관리자 주문 아이템 배송 수량 조회: adminId=${user.id}, itemId=${itemId}`);
    
    const shippedQuantity = await this.ordersService.getShippedQuantityForItem(itemId);
    return {
      success: true,
      data: { shippedQuantity }
    };
  }
}

// 배송 관련 컨트롤러 (인증 없이 공개)
@Controller('delivery')
export class DeliveryController {
  private readonly logger = new Logger(DeliveryController.name);
  
  constructor(private readonly ordersService: OrdersService) {}

  // 전체 배송 통계 (공개)
  @Get('stats')
  async getDeliveryStats() {
    this.logger.log('배송 통계 조회 요청');
    return this.ordersService.getDeliveryStats();
  }

  // 배송 추적 (주문번호로 조회 - 공개)
  @Get('track/:orderNumber')
  async trackDelivery(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`배송 추적 조회: orderNumber=${orderNumber}`);
    return this.ordersService.getDeliveryTracking({ orderNumber });
  }


}
