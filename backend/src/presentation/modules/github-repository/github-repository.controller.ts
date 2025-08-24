import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

// DTOs
import { AddRepositoryDto } from '@application/dtos/github-repository/add-repository.dto';
import { UpdateRepositoryDto } from '@application/dtos/github-repository/update-repository.dto';
import { GetRepositoriesDto } from '@application/dtos/github-repository/get-repositories.dto';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';
import { RepositoriesListResponse } from '@application/dtos/responses/repositories-list.response';
import { RepositoryStatisticsResponse } from '@application/dtos/responses/repository-statistics.response';
import { SyncRequestResponse } from '@application/dtos/responses/sync-request.response';
import { GetRepositoryStatisticsQuery } from '@application/queries/github-repository/get-repository-statistics.query';
import { AddRepositoryCommand } from '@application/commands/github-repository/add-repository.command';
import { UpdateRepositoryCommand } from '@application/commands/github-repository/update-repository.command';
import { RequestSyncCommand } from '@application/commands/github-repository/request-sync.command';
import { DeleteRepositoryCommand } from '@application/commands/github-repository/delete-repository.command';
import { GetRepositoryQuery } from '@application/queries/github-repository/get-repository.query';
import { GetRepositoriesQuery } from '@application/queries/github-repository/get-repositories.query';
import { UserContext } from '@presentation/context/user.context';

// Commands

// Queries

@ApiTags('GitHub Repositories')
@Controller('repositories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GitHubRepositoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Get repositories with pagination, search, and filters
   * GET /api/repositories
   */
  @Get()
  @ApiOperation({
    summary: 'Get repositories',
    description:
      'Retrieve a paginated list of GitHub repositories with optional search and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repositories retrieved successfully',
    type: RepositoriesListResponse,
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for repository name, owner, or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'stars', 'forks', 'name', 'lastSync'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'syncStatus',
    required: false,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    description: 'Filter by sync status',
  })
  async getRepositories(
    @Query() getRepositoriesDto: GetRepositoriesDto,
    @CurrentUser() user: UserContext,
  ): Promise<RepositoriesListResponse> {
    return this.queryBus.execute(new GetRepositoriesQuery(getRepositoriesDto));
  }

  @Get('mine')
  @ApiOperation({
    summary: 'Get my repositories',
    description: 'Retrieve repositories added by the current user with filtering and sorting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User repositories retrieved successfully',
    type: RepositoriesListResponse, // Changed from array to paginated response
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for repository name, owner, or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'stars', 'forks', 'name', 'lastSync'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'syncStatus',
    required: false,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    description: 'Filter by sync status',
  })
  async getMyRepositories(
    @Query() getRepositoriesDto: GetRepositoriesDto,
    @CurrentUser() user: UserContext,
  ): Promise<RepositoriesListResponse> {
    return this.queryBus.execute(new GetRepositoriesQuery(getRepositoriesDto, user.userId));
  }

  /**
   * Get repository statistics
   * GET /api/repositories/statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get repository statistics',
    description: 'Retrieve overall statistics about repositories in the system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: RepositoryStatisticsResponse,
  })
  async getStatistics(): Promise<RepositoryStatisticsResponse> {
    return this.queryBus.execute(new GetRepositoryStatisticsQuery());
  }

  /**
   * Get specific repository by ID
   * GET /api/repositories/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get repository by ID',
    description: 'Retrieve a specific repository by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repository retrieved successfully',
    type: GitHubRepositoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Repository not found',
  })
  async getRepository(@Param('id') repositoryId: string): Promise<GitHubRepositoryResponse> {
    return this.queryBus.execute(new GetRepositoryQuery(repositoryId));
  }

  /**
   * Add new repository
   * POST /api/repositories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add new repository',
    description:
      'Add a new GitHub repository to track by providing the GitHub path (e.g., "facebook/react")',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Repository added successfully',
    type: GitHubRepositoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid GitHub path or repository already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GitHub repository not found or not accessible',
  })
  async addRepository(
    @Body() addRepositoryDto: AddRepositoryDto,
    @CurrentUser() user: UserContext,
  ): Promise<GitHubRepositoryResponse> {
    return this.commandBus.execute(new AddRepositoryCommand(addRepositoryDto, user.userId));
  }

  /**
   * Update repository manually
   * PUT /api/repositories/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update repository manually',
    description:
      'Manually update repository statistics (stars, forks, open issues) and description. Only the user who added the repository can update it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repository updated successfully',
    type: GitHubRepositoryResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only the user who added the repository can update it',
  })
  async updateRepository(
    @Param('id') repositoryId: string,
    @Body() updateRepositoryDto: UpdateRepositoryDto,
    @CurrentUser() user: UserContext,
  ): Promise<GitHubRepositoryResponse> {
    return this.commandBus.execute(
      new UpdateRepositoryCommand(repositoryId, updateRepositoryDto, user.userId),
    );
  }

  /**
   * Request repository synchronization
   * POST /api/repositories/:id/sync
   */
  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Request repository sync',
    description:
      'Request synchronization with GitHub to update repository data. Only the user who added the repository can request sync.',
  })
  @ApiParam({
    name: 'id',
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Sync request accepted and queued',
    type: SyncRequestResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only the user who added the repository can request sync',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Repository sync is already in progress',
  })
  async requestSync(
    @Param('id') repositoryId: string,
    @CurrentUser() user: UserContext,
  ): Promise<SyncRequestResponse> {
    return this.commandBus.execute(new RequestSyncCommand(repositoryId, user.userId));
  }

  /**
   * Delete repository
   * DELETE /api/repositories/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete repository',
    description:
      'Delete a repository from tracking. Only the user who added the repository can delete it.',
  })
  @ApiParam({
    name: 'id',
    description: 'Repository ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Repository deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Repository not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only the user who added the repository can delete it',
  })
  async deleteRepository(
    @Param('id') repositoryId: string,
    @CurrentUser() user: UserContext,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRepositoryCommand(repositoryId, user.userId));
  }
}
