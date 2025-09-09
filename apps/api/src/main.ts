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

  // ✅ CORS - 안전하고 유연하게
  app.enableCors({
    origin: (origin, cb) => {
      // 서버-서버/헬스체크/프리플라이트 등 Origin이 없는 경우 허용
      if (!origin) return cb(null, true);

      try {
        const { hostname } = new URL(origin);

        // 고정 화이트리스트
        const allowList = new Set([
          'feedbackmall.com',
          'www.feedbackmall.com',
          'api.feedbackmall.com',
          'localhost',
          '127.0.0.1',
        ]);

        // 패턴 허용: 모든 feedbackmall 서브도메인, vercel 프리뷰
        const allowByPattern =
          /\.feedbackmall\.com$/i.test(hostname) || /\.vercel\.app$/i.test(hostname);

        if (allowList.has(hostname) || allowByPattern) {
          return cb(null, true);
        }

        // ❌ 미허용 Origin: 에러 던지지 말고 false (브라우저만 막힘, 서버는 조용)
        return cb(null, false);
      } catch {
        return cb(null, false);
      }
    },
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

  // Swagger 문서는 개발 환경에서만 활성화
  const nodeEnv = configService.get('NODE_ENV', 'development');
  if (nodeEnv === 'development') {
    const swagger = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('E-commerce API - MVP Skeleton')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('App')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, document);
  } else {
    // 프로덕션 환경에서는 404 응답
    app.use('/docs', (req, res) => {
      res.status(404).json({ 
        message: 'API documentation is not available in production',
        statusCode: 404 
      });
    });
  }

  // /health
  const server = app.getHttpAdapter().getInstance();
  server.get('/health', (_req: Request, res: Response) => res.status(200).json({ status: 'ok' }));

  const port = configService.get('PORT', 3001) as number;
  await app.listen(port);
}
bootstrap();