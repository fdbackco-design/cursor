import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateReferralCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
