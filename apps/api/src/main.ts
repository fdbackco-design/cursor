// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // ✅ CORS - 임시로 모든 Origin 허용 (운영환경 문제 해결용)
  app.enableCors({
    origin: true, // 모든 Origin 허용
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  });

  // ✅ 프리플라이트 빠른 응답(방어)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(cookieParser());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  app.use((req, res, next) => { res.setTimeout(300000); next(); });

  app.setGlobalPrefix('api/v1');

  const swagger = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API - MVP Skeleton')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('App')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  // /health
  const server = app.getHttpAdapter().getInstance();
  server.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok' }));

  const port = configService.get('PORT', 3001) as number;
  await app.listen(port);
}
bootstrap();