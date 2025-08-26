import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(role?: string, excludeSellerUsers: boolean = false) {
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (excludeSellerUsers) {
      // 이미 셀러로 등록된 사용자는 제외
      where.seller = null;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            companyName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getAvailableUsersForSeller() {
    // 아직 셀러로 등록되지 않은 사용자들만 반환
    return this.prisma.user.findMany({
      where: {
        seller: null, // 아직 셀러로 등록되지 않은 사용자
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
