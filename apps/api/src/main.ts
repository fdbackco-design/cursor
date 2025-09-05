import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: (origin, cb) => {
      const whitelist = [
        'https://feedbackmall.com',
        'https://www.feedbackmall.com',
        'http://localhost:3000',
      ];
      if (!origin || whitelist.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Cookie parser middleware
  app.use(cookieParser());
  
  // Body parser 제한 증가 (100MB)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  
  // 정적 파일 서빙을 위한 설정
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // 쿠키 파싱 디버깅을 위한 미들웨어
  app.use((req, res, next) => {
    // console.log('=== 쿠키 파서 미들웨어 ===');
    // console.log('요청 URL:', req.url);
    // console.log('요청 메서드:', req.method);
    // console.log('요청 쿠키 (parsed):', req.headers.cookie);
    // console.log('요청 헤더 전체:', req.headers);
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // NestJS 전역 설정 - 페이로드 크기 제한 증가
  app.use((req, res, next) => {
    res.setTimeout(300000); // 5분 타임아웃
    next();
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API - MVP Skeleton')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('App')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  

  // console.log(`🚀 Application is running on: http://localhost:${port}`);
  // console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();