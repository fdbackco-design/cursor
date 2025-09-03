import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ProductsModule } from './products/products.module';
import { SellersModule } from './sellers/sellers.module';
import { ReferralCodesModule } from './referral-codes/referral-codes.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { CouponsModule } from './coupons/coupons.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReturnsModule } from './returns/returns.module';
import { RefundsModule } from './refunds/refunds.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    // 1) 전역 환경변수
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 2) 전역 JWT (환경변수로 secret 주입)
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), // ✅ .env 필요
        signOptions: { expiresIn: '1d' },
      }),
    }),

    // 3) 요청 제한(옵션)
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),

    // 4) 나머지 모듈
    AuthModule,
    WishlistModule,
    ProductsModule,
    SellersModule,
    ReferralCodesModule,
    UsersModule,
    CartModule,
    CouponsModule,
    AuditLogModule,
    AdminModule,
    AnalyticsModule,
    PaymentsModule,
    OrdersModule,
    AddressesModule,
    ReturnsModule,
    RefundsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}