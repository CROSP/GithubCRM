import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortByEnum {
  CREATED_AT = 'createdAt',
  STARS = 'stars',
  FORKS = 'forks',
  NAME = 'name',
  LAST_SYNC = 'lastSync',
}

export enum SortOrderEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetRepositoriesDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search query for repository name, owner, or description',
    example: 'react',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: SortByEnum,
    default: SortByEnum.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortByEnum)
  sortBy?: SortByEnum = SortByEnum.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrderEnum)
  sortOrder?: SortOrderEnum = SortOrderEnum.DESC;

  @ApiPropertyOptional({
    description: 'Filter by sync status',
    example: 'completed',
    enum: ['pending', 'in_progress', 'completed', 'failed'],
  })
  @IsOptional()
  @IsString()
  syncStatus?: string;
}
