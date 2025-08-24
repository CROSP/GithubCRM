import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Infrastructure
import { I18nModule } from '@infrastructure/i18n/i18n.module';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';

// Core Domain
import { CoreModule } from '@core/core.module';

// Feature Modules (Presentation Layer)
import { AuthModule } from '@presentation/modules/auth/auth.module';
import { UserModule } from '@presentation/modules/user/user.module';
import { RoleModule } from '@presentation/modules/role/role.module';
import { GitHubRepositoryModule } from '@presentation/modules/github-repository/github-repository.module';

// Global providers
import { LoggingInterceptor } from '@presentation/interceptors/logging.interceptor';
import { TransformInterceptor } from '@presentation/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '@presentation/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from '@presentation/filters/domain-exceptions.filter';

// Config
import configuration from '@infrastructure/config/configuration';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),

    // Core Infrastructure (Data access, External services)
    InfrastructureModule,

    // Logging & I18n
    LoggerModule,
    I18nModule,

    // CQRS
    CqrsModule,

    // Core Domain
    CoreModule,

    // Feature Modules (Presentation Layer)
    GitHubRepositoryModule,
    AuthModule,
    UserModule,
    RoleModule,
  ],
  controllers: [],
  providers: [
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global filters
    {
      provide: APP_FILTER,
      useClass: DomainExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
