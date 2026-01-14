import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@repo/db';
import { CreateReferralCodeDto } from './create-referral-code.dto';

export class UpdateReferralCodeDto extends PartialType(CreateReferralCodeDto) {
  @IsOptional()
  @IsEnum(UserRole)
  roleType?: UserRole; // BIZ 또는 CONSUMER
}
