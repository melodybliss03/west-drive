import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor';
import { SanitizeInputPipe } from './shared/pipes/sanitize-input.pipe';

const BODY_SIZE_LIMIT = '10mb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable the default body parser so we can register our own with a custom
    // size limit AND the raw-body capture needed for Stripe webhook verification.
    bodyParser: false,
  });

  // Custom body parsers: 10 MB limit for JSON payloads (covers base64-encoded photo
  // uploads in event payloads) while still capturing the raw body for Stripe.
  app.use(
    express.json({
      limit: BODY_SIZE_LIMIT,
      verify: (req: IncomingMessage, _res: ServerResponse, buf: Buffer) => {
        (req as IncomingMessage & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));

  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: false,
  });
  // Enforce strict DTO contracts at the application boundary.
  app.useGlobalPipes(
    new SanitizeInputPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WestDrive Backend API')
    .setDescription('Core backend API for WestDrive rental operations')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
