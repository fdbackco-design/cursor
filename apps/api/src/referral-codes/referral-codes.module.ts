import { Module } from '@nestjs/common';
import { ReferralCodesController } from './referral-codes.controller';
import { ReferralCodesService } from './referral-codes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralCodesController],
  providers: [ReferralCodesService],
  exports: [ReferralCodesService],
})
export class ReferralCodesModule {}
