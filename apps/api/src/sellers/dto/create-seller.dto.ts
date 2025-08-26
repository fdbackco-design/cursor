import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateSellerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  representativeName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  // 추천 코드 관련 필드 (선택사항)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referralCodes?: string[];
}
