import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import {
  GetRepositoriesDto,
  SortByEnum,
  SortOrderEnum,
} from '@application/dtos/github-repository/get-repositories.dto';
import { RepositoriesListResponse } from '@application/dtos/responses/repositories-list.response';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GitHubRepositoryMapper } from '@application/mappers/github-repository.mapper';
import { ILOGGER_TOKEN } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';
import { IRepositoryFilters } from '@core/repositories/github-repository.repository.interface';

export class GetRepositoriesQuery implements IQuery {
  constructor(
    public readonly getRepositoriesDto: GetRepositoriesDto,
    public readonly userId?: string, // Optional: if provided, filter by user
  ) {}
}



@Injectable()
@QueryHandler(GetRepositoriesQuery)
export class GetRepositoriesQueryHandler implements IQueryHandler<GetRepositoriesQuery> {
  constructor(
    private readonly repositoryService: GitHubRepositoryService,
    private readonly mapper: GitHubRepositoryMapper,
    @Inject(ILOGGER_TOKEN) protected readonly logger: ILogger,
  ) {
    this.logger.setContext(GetRepositoriesQueryHandler.name);
  }

  async execute(query: GetRepositoriesQuery): Promise<RepositoriesListResponse> {
    const { getRepositoriesDto, userId } = query;

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = SortByEnum.CREATED_AT,
      sortOrder = SortOrderEnum.DESC,
      syncStatus,
    } = getRepositoriesDto;

    const filters: IRepositoryFilters = {
      search,
      syncStatus,
      sortBy,
      sortOrder,
      page,
      limit,
    };

    this.logger.debug({
      message: 'Getting repositories',
      ...filters,
      userId,
    });

    let result;

    if (userId) {
      // Get repositories for specific user (for user's own repositories)
      result = await this.repositoryService.getUserRepositoriesWithFilters(userId, filters);
    } else {
      // Get all repositories (admin view or public view)
      if (search) {
        result = await this.repositoryService.searchRepositories(
          search,
          page,
          limit,
          sortBy,
          sortOrder,
          syncStatus,
        );
      } else {
        result = await this.repositoryService.getAllRepositories(
          page,
          limit,
          sortBy,
          sortOrder,
          syncStatus,
        );
      }
    }

    const response: RepositoriesListResponse = {
      repositories: result.repositories.map(repo => this.mapper.toResponse(repo)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    this.logger.debug({
      message: 'Repositories retrieved successfully',
      count: response.repositories.length,
      total: response.total,
      filters,
    });

    return response;
  }
}
