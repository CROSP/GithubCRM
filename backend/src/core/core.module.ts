import { Module } from '@nestjs/common';
import { DomainEventService } from './services/domain-event.service';
import { DomainValidationService } from './services/domain-validation.service';
import { UserAuthorizationService } from './services/user-authorization.service';
import { ApplicationEventService } from './services/application-event.service';
import { GitHubRepositoryService } from './services/github-repository.service';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { InfrastructureRepositoriesModule } from '@infrastructure/repositories/infrastructure-repositories.module';
import { DomainEventLoggerService } from '@infrastructure/logger/domain-event-logger.service';
import { IDOMAIN_EVENT_LOGGER_TOKEN } from '@shared/constants/tokens';

/**
 * Core Domain Module
 * Contains all domain services and DDD infrastructure
 */
@Module({
  imports: [LoggerModule, ConfigModule, PrismaModule, InfrastructureRepositoriesModule],
  providers: [
    DomainEventService,
    DomainValidationService,
    UserAuthorizationService,
    ApplicationEventService,
    GitHubRepositoryService,
    DomainEventLoggerService,
    {
      provide: IDOMAIN_EVENT_LOGGER_TOKEN,
      useExisting: DomainEventLoggerService,
    },
  ],
  exports: [
    DomainEventService,
    DomainValidationService,
    UserAuthorizationService,
    DomainEventLoggerService,
    ApplicationEventService,
    IDOMAIN_EVENT_LOGGER_TOKEN,
    GitHubRepositoryService,
  ],
})
export class CoreModule {}
