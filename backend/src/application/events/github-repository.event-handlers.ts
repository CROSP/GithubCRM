import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import {
  RepositoryAddedEvent,
  RepositoryRemovedEvent,
  RepositorySyncCompletedEvent,
  RepositorySyncFailedEvent,
  RepositorySyncRequestedEvent,
} from '@core/events/github-repository.events';
import { IRepositorySyncQueueService } from '@core/services/repository-sync-queue.service.interface';
import { ILOGGER_TOKEN, REPOSITORY_SYNC_QUEUE_SERVICE } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

/**
 * Handle RepositoryAddedEvent
 * This could be used for additional side effects when a repository is added
 */
@Injectable()
@EventsHandler(RepositoryAddedEvent)
export class RepositoryAddedEventHandler implements IEventHandler<RepositoryAddedEvent> {
  constructor(@Inject(ILOGGER_TOKEN) protected readonly logger: ILogger) {
    this.logger.setContext(RepositoryAddedEventHandler.name);
  }

  async handle(event: RepositoryAddedEvent): Promise<void> {
    this.logger.log({
      message: 'Repository added event received',
      repositoryId: event.repositoryId.getValue(),
      githubPath: event.githubPath.getValue(),
      addedByUserId: event.addedByUserId,
    });

    // Here you could add side effects like:
    // - Sending notifications to users
    // - Updating analytics
    // - Triggering webhooks
    // - etc.
  }
}

/**
 * Handle RepositorySyncRequestedEvent
 * Adds sync job to queue when sync is requested
 */
@Injectable()
@EventsHandler(RepositorySyncRequestedEvent)
export class RepositorySyncRequestedEventHandler
  implements IEventHandler<RepositorySyncRequestedEvent>
{
  constructor(
    @Inject(REPOSITORY_SYNC_QUEUE_SERVICE)
    private readonly queueService: IRepositorySyncQueueService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(RepositorySyncRequestedEventHandler.name);
  }

  async handle(event: RepositorySyncRequestedEvent): Promise<void> {
    const githubPath = event.githubPath.getValue();
    const [owner, repository] = githubPath.split('/');

    this.logger.log({
      message: 'Repository sync requested event received',
      repositoryId: event.repositoryId.getValue(),
      githubPath,
      requestedByUserId: event.requestedByUserId,
    });

    try {
      // Add sync job to queue
      await this.queueService.addSyncJob({
        repositoryId: event.repositoryId.getValue(),
        githubPath,
        owner,
        repository,
        priority: 'normal',
        maxRetries: 3,
      });

      this.logger.log({
        message: 'Sync job added to queue successfully',
        repositoryId: event.repositoryId.getValue(),
        githubPath,
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to add sync job to queue',
        repositoryId: event.repositoryId.getValue(),
        githubPath,
        error: error.message,
      });
    }
  }
}

/**
 * Handle RepositorySyncCompletedEvent
 * This could trigger additional actions after successful sync
 */
@Injectable()
@EventsHandler(RepositorySyncCompletedEvent)
export class RepositorySyncCompletedEventHandler
  implements IEventHandler<RepositorySyncCompletedEvent>
{
  constructor(@Inject(ILOGGER_TOKEN) protected readonly logger: ILogger) {
    this.logger.setContext(RepositorySyncCompletedEventHandler.name);
  }

  async handle(event: RepositorySyncCompletedEvent): Promise<void> {
    this.logger.log({
      message: 'Repository sync completed event received',
      repositoryId: event.repositoryId.getValue(),
      githubPath: event.githubPath.getValue(),
      stars: event.stars,
      forks: event.forks,
      openIssues: event.openIssues,
    });
  }
}

/**
 * Handle RepositorySyncFailedEvent
 * This could trigger retry logic or notifications
 */
@Injectable()
@EventsHandler(RepositorySyncFailedEvent)
export class RepositorySyncFailedEventHandler implements IEventHandler<RepositorySyncFailedEvent> {
  constructor(@Inject(ILOGGER_TOKEN) protected readonly logger: ILogger) {
    this.logger.setContext(RepositorySyncFailedEventHandler.name);
  }

  async handle(event: RepositorySyncFailedEvent): Promise<void> {
    this.logger.warn({
      message: 'Repository sync failed event received',
      repositoryId: event.repositoryId.getValue(),
      githubPath: event.githubPath.getValue(),
      error: event.error,
    });
  }
}

/**
 * Handle RepositoryRemovedEvent
 * Clean up related data when repository is removed
 */
@Injectable()
@EventsHandler(RepositoryRemovedEvent)
export class RepositoryRemovedEventHandler implements IEventHandler<RepositoryRemovedEvent> {
  constructor(@Inject(ILOGGER_TOKEN) protected readonly logger: ILogger) {
    this.logger.setContext(RepositoryRemovedEventHandler.name);
  }

  async handle(event: RepositoryRemovedEvent): Promise<void> {
    this.logger.log({
      message: 'Repository removed event received',
      repositoryId: event.repositoryId.getValue(),
      githubPath: event.githubPath.getValue(),
      removedByUserId: event.removedByUserId,
    });
  }
}

// ===========================================
// EVENT HANDLERS EXPORT
// ===========================================

export const EventHandlers = [
  RepositoryAddedEventHandler,
  RepositorySyncRequestedEventHandler,
  RepositorySyncCompletedEventHandler,
  RepositorySyncFailedEventHandler,
  RepositoryRemovedEventHandler,
];
