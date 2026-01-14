import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '@repo/db';

export class CreateReferralCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  roleType?: UserRole; // BIZ 또는 CONSUMER (기본값: CONSUMER)
}
