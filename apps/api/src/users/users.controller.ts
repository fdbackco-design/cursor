import { Controller, Get, Query, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query('role') role?: string,
    @Query('excludeSellerUsers') excludeSellerUsers?: string
  ) {
    const shouldExcludeSellerUsers = excludeSellerUsers === 'true';
    return this.usersService.getAllUsers(role, shouldExcludeSellerUsers);
  }

  @Get('available-for-seller')
  async getAvailableUsersForSeller() {
    return this.usersService.getAvailableUsersForSeller();
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteUserAccount(@Request() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;
    const result = await this.usersService.deleteUserAccount(userId);
    
    if (result.success) {
      // HttpOnly 쿠키들을 서버에서 직접 만료시킴
      const expiredDate = new Date(0).toUTCString();
      
      // access_token 쿠키 만료
      res.cookie('access_token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.feedbackmall.com',
        path: '/'
      });
      
      // refresh_token 쿠키 만료
      res.cookie('refresh_token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.feedbackmall.com',
        path: '/'
      });
      
      // user_role 쿠키 만료
      res.cookie('user_role', '', {
        expires: new Date(0),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.feedbackmall.com',
        path: '/'
      });
      
      // referral_code 쿠키 만료
      res.cookie('referral_code', '', {
        expires: new Date(0),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.feedbackmall.com',
        path: '/'
      });
    }
    
    return result;
  }
}
