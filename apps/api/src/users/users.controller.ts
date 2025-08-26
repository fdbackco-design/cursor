import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';

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
}
