// create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsDecimal()
  priceB2B: string;

  @IsDecimal()
  priceB2C: string;

  @IsOptional()
  @IsDecimal()
  comparePrice?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsDecimal()
  weight?: string;

  @IsOptional()
  @IsDecimal()
  length?: string;

  @IsOptional()
  @IsDecimal()
  width?: string;

  @IsOptional()
  @IsDecimal()
  height?: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsString()
  isFeatured?: string;

  @IsString()
  stockQuantity: string;

  @IsOptional()
  @IsString()
  lowStockThreshold?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  metadata?: string;

  @IsOptional()
  @IsArray()
  images?: any[];

  @IsOptional()
  @IsArray()
  descriptionImages?: any[];
}