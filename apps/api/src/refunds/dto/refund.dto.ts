import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';
import { RefundReason, RefundStatus } from '@repo/db';

export class CreateRefundDto {
  @IsString()
  returnId: string;

  @IsString()
  orderId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  orderItemIds?: string[];

  @IsEnum(RefundReason)
  refundReason: RefundReason;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  processedBy: string;
}

export class ProcessRefundDto {
  @IsString()
  processedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RefundCalculationResult {
  orderId: string;
  totalRefundAmount: number;
  itemRefunds: Array<{
    orderItemId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    alreadyRefunded: number;
    refundableAmount: number;
  }>;
  couponRefundAmount: number;
  shippingRefundAmount: number;
  alreadyRefundedAmount: number;
  refundableAmount: number;
  isFullRefund: boolean;
}

export class RefundQueryDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  returnId?: string;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;

  @IsOptional()
  @IsEnum(RefundReason)
  refundReason?: RefundReason;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 1;
    const num = Number(value);
    return isNaN(num) ? 1 : Math.max(1, num);
  })
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 20;
    const num = Number(value);
    return isNaN(num) ? 20 : Math.max(1, Math.min(100, num));
  })
  @IsNumber()
  limit?: number = 20;
}
