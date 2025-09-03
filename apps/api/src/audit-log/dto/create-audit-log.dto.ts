// create-audit-log.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  SHIPMENT = 'SHIPMENT',
  REGISTER = 'REGISTER',
}

// 스키마의 resource에 대응
export enum ResourceType {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  SELLER = 'SELLER',
  COUPON = 'COUPON',
  CART = 'CART',
  WISHLIST = 'WISHLIST',
  REVIEW = 'REVIEW',
  PAYMENT = 'PAYMENT',
  SHIPMENT = 'SHIPMENT',
}

export class CreateAuditLogDto {
  @IsString()
  @IsOptional()           // Prisma 스키마에서 userId는 optional
  userId?: string;

  @IsEnum(ActionType)
  action!: ActionType;

  // entityType → resource (스키마: AuditLog.resource)
  @IsEnum(ResourceType)
  resource!: ResourceType;

  // entityId → resourceId (스키마: AuditLog.resourceId)
  @IsString()
  @IsOptional()
  resourceId?: string;

  // 스키마의 oldValues/newValues에 매핑
  @IsObject()
  @IsOptional()
  oldValues?: Record<string, any>;

  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}