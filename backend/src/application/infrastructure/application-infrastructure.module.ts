import { Module } from '@nestjs/common';
import { InfrastructureRepositoriesModule } from '@infrastructure/repositories/infrastructure-repositories.module';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { CoreModule } from '@core/core.module';
import { InfrastructureServicesModule } from '@infrastructure/services/infrastructure-services.module';

/**
 * Application Infrastructure Module
 * This module combines infrastructure services with domain services
 * following the Dependency Inversion Principle
 */
@Module({
  imports: [
    CoreModule,
    InfrastructureRepositoriesModule,
    InfrastructureServicesModule,
    QueueModule,
  ],
  exports: [
    CoreModule,
    InfrastructureRepositoriesModule,
    InfrastructureServicesModule,
    QueueModule,
  ],
})
export class ApplicationInfrastructureModule {}
