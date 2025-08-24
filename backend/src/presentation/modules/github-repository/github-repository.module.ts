import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApplicationInfrastructureModule } from '@application/infrastructure/application-infrastructure.module';
import { CoreModule } from '@core/core.module';
import { GitHubRepositoryController } from './github-repository.controller';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { CommandHandlers } from '@application/commands/github-repository/index';
import { QueryHandlers } from '@application/queries/github-repository/index';
import { EventHandlers } from '@application/events/github-repository.event-handlers';
import { DebugController } from '@presentation/modules/github-repository/debug.controller';

@Module({
  imports: [CqrsModule, CoreModule, ApplicationInfrastructureModule],
  controllers: [GitHubRepositoryController, DebugController],
  providers: [
    // Mapper
    GitHubRepositoryMapper,

    // Command handlers
    ...CommandHandlers,

    // Query handlers
    ...QueryHandlers,

    // Event handlers
    ...EventHandlers,
  ],
  exports: [],
})
export class GitHubRepositoryModule {}
