import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { DiscountType } from '@repo/db';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber()
  @Min(1)
  userMaxUses?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
