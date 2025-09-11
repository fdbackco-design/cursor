import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@repo/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('데이터베이스 연결 성공');
    } catch (error) {
      console.warn('데이터베이스 연결 실패, 개발 모드로 계속 진행:', error.message);
      // 개발 모드에서는 데이터베이스 연결 실패해도 계속 진행
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      console.warn('데이터베이스 연결 해제 실패:', error.message);
    }
  }
}
