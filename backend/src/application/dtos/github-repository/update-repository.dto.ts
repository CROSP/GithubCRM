import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateRepositoryDto {
  @ApiPropertyOptional({
    description: 'Number of stars',
    example: 1500,
    minimum: 0,
    maximum: 10000000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000000)
  stars?: number;

  @ApiPropertyOptional({
    description: 'Number of forks',
    example: 300,
    minimum: 0,
    maximum: 1000000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  forks?: number;

  @ApiPropertyOptional({
    description: 'Number of open issues',
    example: 45,
    minimum: 0,
    maximum: 100000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  openIssues?: number;

  @ApiPropertyOptional({
    description: 'Repository description',
    example: 'A JavaScript library for building user interfaces',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
