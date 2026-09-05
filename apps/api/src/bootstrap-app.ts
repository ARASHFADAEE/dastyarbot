import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { join } from 'path';
import express, { Express } from 'express';
import { AppModule } from './app.module';

export type NestBootstrapResult = {
  app: NestExpressApplication;
  express: Express;
};

/**
 * Shared Nest bootstrap for local `listen()` and Vercel serverless.
 */
export async function createNestApp(
  existingExpress?: Express,
): Promise<NestBootstrapResult> {
  const expressApp = existingExpress || express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { rawBody: true },
  );

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  try {
    app.useStaticAssets(join(__dirname, '..', '..', 'widget', 'dist'), {
      prefix: '/widget',
    });
  } catch {
    // widget optional on serverless
  }

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return { app, express: expressApp };
}
