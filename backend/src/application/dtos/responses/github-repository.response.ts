import { ApiProperty } from '@nestjs/swagger';

export class GitHubRepositoryResponse {
  @ApiProperty({
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  id: string;

  @ApiProperty({
    description: 'GitHub repository path',
    example: 'facebook/react',
  })
  githubPath: string;

  @ApiProperty({
    description: 'Repository URL',
    example: 'https://github.com/facebook/react',
  })
  repositoryUrl: string;

  @ApiProperty({
    description: 'Repository name',
    example: 'react',
  })
  name: string;

  @ApiProperty({
    description: 'Repository description',
    example: 'The library for web and native user interfaces.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Repository owner',
    example: 'facebook',
  })
  owner: string;

  @ApiProperty({
    description: 'Number of stars',
    example: 228000,
  })
  stars: number;

  @ApiProperty({
    description: 'Number of forks',
    example: 46000,
  })
  forks: number;

  @ApiProperty({
    description: 'Number of open issues',
    example: 1200,
  })
  openIssues: number;

  @ApiProperty({
    description: 'Synchronization status',
    example: 'completed',
    enum: ['pending', 'in_progress', 'completed', 'failed'],
  })
  syncStatus: string;

  @ApiProperty({
    description: 'Last synchronization timestamp',
    example: '2024-01-15T10:30:00Z',
    nullable: true,
  })
  lastSyncAt: Date | null;

  @ApiProperty({
    description: 'Synchronization error message',
    example: null,
    nullable: true,
  })
  syncError: string | null;

  @ApiProperty({
    description: 'ID of the user who added this repository',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  addedByUserId: string;

  @ApiProperty({
    description: 'Repository creation date on GitHub',
    example: '2013-05-24T16:15:54Z',
    nullable: true,
  })
  createdAtGitHub: Date | null;

  @ApiProperty({
    description: 'GitHub creation timestamp (Unix)',
    example: 1369414554,
    nullable: true,
  })
  createdAtGitHubUnix: number | null;

  @ApiProperty({
    description: 'When the repository was added to our system',
    example: '2024-01-10T08:15:30Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether the repository needs synchronization',
    example: false,
  })
  needsSync: boolean;

  @ApiProperty({
    description: 'Whether sync is currently in progress',
    example: false,
  })
  isBeingSync: boolean;
}
