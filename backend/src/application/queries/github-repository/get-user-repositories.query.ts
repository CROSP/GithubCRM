import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class GetUserRepositoriesQuery implements IQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(GetUserRepositoriesQuery)
export class GetUserRepositoriesQueryHandler implements IQueryHandler<GetUserRepositoriesQuery> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(GetUserRepositoriesQueryHandler.name);
  }

  async execute(query: GetUserRepositoriesQuery): Promise<GitHubRepositoryResponse[]> {
    const { userId } = query;

    this.logger.debug({
      message: 'Getting user repositories',
      userId,
    });

    const repositories = await this.repositoryService.getUserRepositories(userId);

    this.logger.debug({
      message: 'User repositories retrieved successfully',
      userId,
      count: repositories.length,
    });

    return repositories.map(repo => this.mapper.toResponse(repo));
  }
}
