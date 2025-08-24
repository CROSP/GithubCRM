import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class GetRepositoryQuery implements IQuery {
  constructor(public readonly repositoryId: string) {}
}

@Injectable()
@QueryHandler(GetRepositoryQuery)
export class GetRepositoryQueryHandler implements IQueryHandler<GetRepositoryQuery> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(GetRepositoryQueryHandler.name);
  }

  async execute(query: GetRepositoryQuery): Promise<GitHubRepositoryResponse> {
    const { repositoryId } = query;

    this.logger.debug({
      message: 'Getting repository by ID',
      repositoryId,
    });

    const repository = await this.repositoryService.findRepositoryById(repositoryId);

    this.logger.debug({
      message: 'Repository retrieved successfully',
      repositoryId,
      githubPath: repository.githubPath.getValue(),
    });

    return this.mapper.toResponse(repository);
  }
}
