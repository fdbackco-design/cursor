import { Module } from '@nestjs/common';
import { OrdersController, DeliveryController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController, DeliveryController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
