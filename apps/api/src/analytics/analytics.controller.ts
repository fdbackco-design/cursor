import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('seller-sales')
  async getSellerSales(
    @Req() req: Request,
    @Query('period') period: string = 'month',
    @Query('sellerId') sellerId?: string
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getSellerSales(period, sellerId);
  }

  @Get('vendor-sales')
  async getVendorSales(
    @Req() req: Request,
    @Query('period') period: string = 'month',
    @Query('vendorId') vendorId?: string
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getVendorSales(period, vendorId);
  }

  @Get('product-sales')
  async getProductSales(
    @Req() req: Request,
    @Query('period') period: string = 'month',
    @Query('productId') productId?: string
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getProductSales(period, productId);
  }

  @Get('popular-products')
  async getPopularProducts(
    @Req() req: Request,
    @Query('period') period: string = 'month',
    @Query('limit') limit: string = '10'
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getPopularProducts(period, parseInt(limit));
  }

  @Get('return-rate')
  async getReturnRate(
    @Req() req: Request,
    @Query('period') period: string = 'month',
    @Query('productId') productId?: string
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getReturnRate(period, productId);
  }

  @Get('overview')
  async getOverview(
    @Req() req: Request,
    @Query('period') period: string = 'month'
  ) {
    const user = req.user as any;
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    return this.analyticsService.getOverview(period);
  }
}
