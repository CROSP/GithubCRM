import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { AddRepositoryDto } from '@application/dtos/github-repository/add-repository.dto';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { IGitHubApiService } from '@core/services/github-api.service.interface';
import { IRepositorySyncQueueService } from '@core/services/repository-sync-queue.service.interface';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { GitHubRepositoryNotFoundException } from '@core/exceptions/github-exceptions';
import {
  GITHUB_API_SERVICE,
  ILOGGER_TOKEN,
  REPOSITORY_SYNC_QUEUE_SERVICE,
} from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class AddRepositoryCommand implements ICommand {
  constructor(
    public readonly addRepositoryDto: AddRepositoryDto,
    public readonly userId: string,
  ) {}
}

@Injectable()
@CommandHandler(AddRepositoryCommand)
export class AddRepositoryCommandHandler implements ICommandHandler<AddRepositoryCommand> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    @Inject(GITHUB_API_SERVICE)
    private readonly githubApiService: IGitHubApiService,
    @Inject(REPOSITORY_SYNC_QUEUE_SERVICE)
    private readonly queueService: IRepositorySyncQueueService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(AddRepositoryCommandHandler.name);
  }

  async execute(command: AddRepositoryCommand): Promise<GitHubRepositoryResponse> {
    const { githubPath } = command.addRepositoryDto;
    const { userId } = command;

    this.logger.log({
      message: 'Adding new repository',
      githubPath,
      userId,
    });

    // Extract owner and repository name
    const [owner, repository] = githubPath.split('/');

    // Validate repository exists on GitHub before adding
    const repositoryExists = await this.githubApiService.validateRepositoryExists(
      owner,
      repository,
    );
    if (!repositoryExists) {
      throw new GitHubRepositoryNotFoundException(githubPath);
    }

    // Add repository to our system
    const addedRepository = await this.repositoryService.addRepository(
      githubPath,
      `https://github.com/${githubPath}`,
      userId,
    );
    // Queue sync job for the new repository
    await this.queueService.addSyncJob({
      repositoryId: addedRepository.id.getValue(),
      githubPath: addedRepository.githubPath.getValue(),
      owner: addedRepository.owner,
      repository: addedRepository.repository,
      priority: 'normal',
      maxRetries: 3,
    });

    this.logger.log({
      message: 'Repository added successfully',
      repositoryId: addedRepository.id.getValue(),
      githubPath,
    });

    return this.mapper.toResponse(addedRepository);
  }
}
