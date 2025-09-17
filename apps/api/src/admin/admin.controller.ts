import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('home-order')
  async getHomeOrder() {
    return this.adminService.getHomeOrder();
  }

  @Post('home-order')
  async updateHomeOrder(@Body() body: { categoryProducts: any; mdPicks: string[] }) {
    return this.adminService.updateHomeOrder(body.categoryProducts, body.mdPicks);
  }

  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Get('product-attributes')
  async getProductAttributes() {
    return this.adminService.getProductAttributes();
  }

  @Post('product-attributes')
  async updateProductAttributes(@Body() body: { shortDescription: string }) {
    return this.adminService.updateProductAttributes(body.shortDescription);
  }
}