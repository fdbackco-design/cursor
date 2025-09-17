import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
}