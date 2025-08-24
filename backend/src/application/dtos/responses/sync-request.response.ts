import { ApiProperty } from '@nestjs/swagger';

export class SyncRequestResponse {
  @ApiProperty({
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  repositoryId: string;

  @ApiProperty({
    description: 'GitHub repository path',
    example: 'facebook/react',
  })
  githubPath: string;

  @ApiProperty({
    description: 'Sync status after request',
    example: 'pending',
  })
  syncStatus: string;

  @ApiProperty({
    description: 'Message about the sync request',
    example: 'Synchronization requested successfully. The repository will be synced shortly.',
  })
  message: string;

  @ApiProperty({
    description: 'When the sync was requested',
    example: '2024-01-15T10:30:00Z',
  })
  requestedAt: Date;
}
