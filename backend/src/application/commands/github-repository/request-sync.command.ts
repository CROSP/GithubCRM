import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Inject } from '@nestjs/common';
import { SyncRequestResponse } from '@application/dtos/responses/sync-request.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { IRepositorySyncQueueService } from '@core/services/repository-sync-queue.service.interface';
import { ILOGGER_TOKEN, REPOSITORY_SYNC_QUEUE_SERVICE } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class RequestSyncCommand implements ICommand {
  constructor(
    public readonly repositoryId: string,
    public readonly userId: string,
  ) {}
}

@Injectable()
@CommandHandler(RequestSyncCommand)
export class RequestSyncCommandHandler implements ICommandHandler<RequestSyncCommand> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    @Inject(REPOSITORY_SYNC_QUEUE_SERVICE)
    private readonly queueService: IRepositorySyncQueueService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(RequestSyncCommandHandler.name);
  }

  async execute(command: RequestSyncCommand): Promise<SyncRequestResponse> {
    const { repositoryId, userId } = command;

    this.logger.log({
      message: 'Sync requested for repository',
      repositoryId,
      userId,
    });

    // Request sync in domain (validates permissions and rules)
    const repository = await this.repositoryService.requestSync(repositoryId, userId);

    // Add sync job to queue
    await this.queueService.addSyncJob({
      repositoryId: repository.id.getValue(),
      githubPath: repository.githubPath.getValue(),
      owner: repository.owner,
      repository: repository.repository,
      priority: 'high', // User-requested syncs have higher priority
      maxRetries: 3,
    });

    this.logger.log({
      message: 'Sync queued successfully',
      repositoryId,
      githubPath: repository.githubPath.getValue(),
    });

    return {
      repositoryId: repository.id.getValue(),
      githubPath: repository.githubPath.getValue(),
      syncStatus: repository.syncStatus.getStatus(),
      message: 'Synchronization requested successfully. The repository will be synced shortly.',
      requestedAt: new Date(),
    };
  }
}
