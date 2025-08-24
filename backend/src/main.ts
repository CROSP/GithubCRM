import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '@presentation/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser());

  // Global exception filter
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));

  // Enable CORS with security settings
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    exposedHeaders: ['X-New-Access-Token'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Get i18n service to use in Swagger
  const i18nService = app.get(ConfigService).get('i18n');
  const supportedLanguages = i18nService?.supportedLocales || ['en', 'ua'];

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Github CRM API')
    .setDescription('The API documentation for the Github CRM API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('roles', 'Role management endpoints')
    .addTag('admin', 'Admin endpoints')
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      required: false,
      schema: {
        type: 'string',
        default: 'en',
        enum: supportedLanguages,
        example: 'en',
        description: 'Language preference for the response',
      },
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This is a key to be used in @ApiBearerAuth() decorator
    )
    .build();

  // Basic Auth for Swagger (only in production)
  if (configService.get<string>('NODE_ENV') === 'production') {
    app.use(
      '/docs',
      basicAuth({
        challenge: true,
        users: {
          [configService.get<string>('SWAGGER_USER', 'admin')]: configService.get<string>(
            'SWAGGER_PASSWORD',
            'admin',
          ),
        },
      }),
    );
  }

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'NestJS Clean Architecture API',
  });

  // Start server
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  await app.listen(port);
  const appUrl = await app.getUrl();

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`🚀 Application started on port ${port}`, 'Bootstrap');
  logger.log(`🚀 Application started on url ${appUrl}`, 'Bootstrap');
  logger.log(`📚 Documentation: http://localhost:${port}/docs`, 'Bootstrap');
  logger.log(`🌍 Environment: ${nodeEnv || 'development'}`, 'Bootstrap');
  logger.log(`📊 MongoDB logging enabled`, 'Bootstrap');
}

bootstrap().catch(err => {
  console.error('Error starting application:', err);
  process.exit(1);
});
