import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}