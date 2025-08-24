import { ApiProperty } from '@nestjs/swagger';
import { GitHubRepositoryResponse } from './github-repository.response';

export class RepositoriesListResponse {
  @ApiProperty({
    description: 'List of repositories',
    type: [GitHubRepositoryResponse],
  })
  repositories: GitHubRepositoryResponse[];

  @ApiProperty({
    description: 'Total number of repositories',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}
