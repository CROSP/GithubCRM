import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { RepositoryStatisticsResponse } from '@application/dtos/responses/repository-statistics.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';

export class GetRepositoryStatisticsQuery implements IQuery {
  constructor() {}
}

@Injectable()
@QueryHandler(GetRepositoryStatisticsQuery)
export class GetRepositoryStatisticsQueryHandler implements IQueryHandler<GetRepositoryStatisticsQuery> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(GetRepositoryStatisticsQueryHandler.name);
  }

  async execute(query: GetRepositoryStatisticsQuery): Promise<RepositoryStatisticsResponse> {
    this.logger.debug({
      message: 'Getting repository statistics',
    });

    const stats = await this.repositoryService.getStatistics();

    this.logger.debug({
      message: 'Repository statistics retrieved successfully',
      totalRepositories: stats.totalRepositories,
    });

    return {
      totalRepositories: stats.totalRepositories,
      pendingSync: stats.pendingSync,
      failedSync: stats.failedSync,
      completedSync: stats.completedSync,
      totalStars: stats.totalStars,
      totalForks: stats.totalForks,
    };
  }
}
