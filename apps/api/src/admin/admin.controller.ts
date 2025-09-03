import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Req() req: Request) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    return this.adminService.getAdminStats();
  }
}
