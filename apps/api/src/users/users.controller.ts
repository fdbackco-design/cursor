import { Controller, Get, Query, Delete, UseGuards, Request } from '@nestjs/common';
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
  async deleteUserAccount(@Request() req) {
    const userId = req.user.id;
    return this.usersService.deleteUserAccount(userId);
  }
}
