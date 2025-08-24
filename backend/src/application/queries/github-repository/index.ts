import { GetRepositoryQueryHandler } from '@application/queries/github-repository/get-repository.query';
import { GetRepositoriesQueryHandler } from '@application/queries/github-repository/get-repositories.query';
import { GetRepositoryStatisticsQueryHandler } from '@application/queries/github-repository/get-repository-statistics.query';
import { GetUserRepositoriesQueryHandler } from '@application/queries/github-repository/get-user-repositories.query';
import { SearchRepositoriesQueryHandler } from '@application/queries/github-repository/search-repositories.query';

export const QueryHandlers = [
  GetRepositoriesQueryHandler,
  GetRepositoryQueryHandler,
  GetRepositoryStatisticsQueryHandler,
  SearchRepositoriesQueryHandler,
  GetUserRepositoriesQueryHandler,
];
