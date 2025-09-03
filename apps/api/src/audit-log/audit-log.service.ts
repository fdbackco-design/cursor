// audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAuditLogDto,
  ActionType,
  ResourceType, // ✅ 기존 EntityType 대신
} from './dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  // 감사 로그 생성
  async createAuditLog(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId ?? null,
        action: dto.action,
        resource: dto.resource,                 // ✅ entityType → resource
        resourceId: dto.resourceId ?? null,     // ✅ entityId → resourceId
        oldValues: dto.oldValues ?? null,       // ✅ description/metadata 제거 → old/new
        newValues: dto.newValues ?? null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      },
    });
  }

  // 최근 활동 조회 (관리자 대시보드용)
  async getRecentActivities(limit = 10) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  // 사용자별 감사 로그 조회
  async getAuditLogsByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  // 리소스별 감사 로그 조회 (기존 getAuditLogsByEntity 대체)
  async getAuditLogsByResource(resource: ResourceType, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: { resource, resourceId },        // ✅
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  // === 편의 메서드들 ===
  // 사용자 등록
  async logUserRegistration(userId: string, userInfo: any, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: ActionType.REGISTER,
      resource: ResourceType.USER,            // ✅
      resourceId: userId,
      // 이전 description/metadata → newValues로 요약 저장
      newValues: {
        summary: `새 사용자가 가입했습니다: ${userInfo.name} (${userInfo.email})`,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRole: userInfo.role,
      },
      ipAddress,
      userAgent,
    });
  }

  // 주문 생성
  async logOrderCreation(userId: string, orderId: string, orderInfo: any, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: ActionType.ORDER,
      resource: ResourceType.ORDER,           // ✅
      resourceId: orderId,
      newValues: {
        summary: `새 주문이 생성되었습니다: ${orderInfo.orderNumber || orderId}`,
        orderNumber: orderInfo.orderNumber,
        totalAmount: orderInfo.totalAmount,
        itemCount: orderInfo.items?.length || 0,
        paymentMethod: orderInfo.paymentMethod,
      },
      ipAddress,
      userAgent,
    });
  }

  // 상품 생성
  async logProductCreation(userId: string, productId: string, productInfo: any, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: ActionType.CREATE,
      resource: ResourceType.PRODUCT,         // ✅
      resourceId: productId,
      newValues: {
        summary: `새 상품이 등록되었습니다: ${productInfo.name}`,
        productName: productInfo.name,
        productPrice: productInfo.priceB2C,
        categoryName: productInfo.category?.name,
        vendorName: productInfo.vendor?.name,
      },
      ipAddress,
      userAgent,
    });
  }

  // 셀러 등록
  async logSellerRegistration(userId: string, sellerId: string, sellerInfo: any, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: ActionType.REGISTER,
      resource: ResourceType.SELLER,          // ✅
      resourceId: sellerId,
      newValues: {
        summary: `새 셀러가 등록되었습니다: ${sellerInfo.companyName}`,
        companyName: sellerInfo.companyName,
        representativeName: sellerInfo.representativeName,
        phone: sellerInfo.phone,
      },
      ipAddress,
      userAgent,
    });
  }

  // 로그인
  async logUserLogin(userId: string, userInfo: any, ipAddress?: string, userAgent?: string) {
    return this.createAuditLog({
      userId,
      action: ActionType.LOGIN,
      resource: ResourceType.USER,            // ✅
      resourceId: userId,
      newValues: {
        summary: `사용자가 로그인했습니다: ${userInfo.name}`,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRole: userInfo.role,
      },
      ipAddress,
      userAgent,
    });
  }
}