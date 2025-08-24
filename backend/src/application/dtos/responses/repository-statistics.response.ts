import { ApiProperty } from '@nestjs/swagger';

export class RepositoryStatisticsResponse {
  @ApiProperty({
    description: 'Total number of repositories',
    example: 150,
  })
  totalRepositories: number;

  @ApiProperty({
    description: 'Number of repositories pending sync',
    example: 5,
  })
  pendingSync: number;

  @ApiProperty({
    description: 'Number of repositories with failed sync',
    example: 3,
  })
  failedSync: number;

  @ApiProperty({
    description: 'Number of repositories with completed sync',
    example: 142,
  })
  completedSync: number;

  @ApiProperty({
    description: 'Total stars across all repositories',
    example: 1250000,
  })
  totalStars: number;

  @ApiProperty({
    description: 'Total forks across all repositories',
    example: 180000,
  })
  totalForks: number;
}
