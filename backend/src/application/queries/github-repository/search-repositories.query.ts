import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { RepositoriesListResponse } from '@application/dtos/responses/repositories-list.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { ILogger } from '@infrastructure/logger/logger.interface';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';

export class SearchRepositoriesQuery implements IQuery {
  constructor(
    public readonly searchQuery: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

@Injectable()
@QueryHandler(SearchRepositoriesQuery)
export class SearchRepositoriesQueryHandler implements IQueryHandler<SearchRepositoriesQuery> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(SearchRepositoriesQueryHandler.name);
  }

  async execute(query: SearchRepositoriesQuery): Promise<RepositoriesListResponse> {
    const { searchQuery, page, limit } = query;

    this.logger.debug({
      message: 'Searching repositories',
      searchQuery,
      page,
      limit,
    });

    const result = await this.repositoryService.searchRepositories(searchQuery, page, limit);

    const response: RepositoriesListResponse = {
      repositories: result.repositories.map(repo => this.mapper.toResponse(repo)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    this.logger.debug({
      message: 'Repository search completed successfully',
      searchQuery,
      resultsFound: response.repositories.length,
      total: response.total,
    });

    return response;
  }
}
