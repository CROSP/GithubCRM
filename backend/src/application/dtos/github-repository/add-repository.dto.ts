import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddRepositoryDto {
  @ApiProperty({
    description: 'GitHub repository path in format "owner/repository"',
    example: 'facebook/react',
    pattern: '^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, {
    message: 'GitHub path must be in format "owner/repository" (e.g., "facebook/react")',
  })
  githubPath: string;
}
