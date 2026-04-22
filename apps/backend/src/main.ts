import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());

  /**
   * CORS: parse comma-separated CORS_ORIGIN from env (trimmed, trailing slash
   * stripped). In non-production, always allow local dev origins and any
   * localhost / 127.0.0.1 port so Vite dev servers and mock UIs just work.
   */
  const envOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const devOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:3000',
  ];

  const allowList = new Set<string>([...envOrigins, ...devOrigins]);
  const isProd = process.env.NODE_ENV === 'production';

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const clean = origin.replace(/\/$/, '');
      if (allowList.has(clean)) return cb(null, true);
      if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AWDMS API')
    .setDescription('Academic Workload Distribution & Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`AWDMS backend listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
