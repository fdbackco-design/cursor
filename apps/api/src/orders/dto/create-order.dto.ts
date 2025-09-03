import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsDecimal, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  productSku: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsNumber()
  finalPrice: number;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @IsOptional()
  @IsString()
  couponId?: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  shippingAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsString()
  referralCodeUsed?: string;

  @IsOptional()
  @IsString()
  couponCodeUsed?: string;

  @IsObject()
  shippingAddress: any;

  @IsObject()
  billingAddress: any;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  // 결제 정보
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsNumber()
  paidAmount: number;
}
