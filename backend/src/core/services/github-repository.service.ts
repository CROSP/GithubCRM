import { Inject, Injectable } from '@nestjs/common';
import {
  IGitHubRepositoryRepository,
  IRepositoryFilters,
} from '@core/repositories/github-repository.repository.interface';
import { GitHubRepository } from '@core/entities/github-repository.entity';
import { RepositoryId } from '@core/value-objects/repository-id.vo';
import { GitHubPath } from '@core/value-objects/github-path.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { SyncStatus } from '@core/value-objects/sync-status.vo';
import {
  SortByEnum,
  SortOrderEnum,
} from '@application/dtos/github-repository/get-repositories.dto';
import {
  BusinessRuleValidationException,
  EntityNotFoundException,
} from '@core/exceptions/domain-exceptions';
import { RepositoryBelongsToUserSpecification } from '@core/specifications/github-repository.specifications';
import { DomainEventService } from '@core/services/domain-event.service';
import { GITHUB_REPOSITORY_REPOSITORY } from '@shared/constants/tokens';
import { RepositoryStats } from '@core/value-objects/repository-stats.vo';

@Injectable()
export class GitHubRepositoryService {
  constructor(
    @Inject(GITHUB_REPOSITORY_REPOSITORY)
    private readonly gitHubRepositoryRepository: IGitHubRepositoryRepository,
    private readonly domainEventService: DomainEventService,
  ) {}

  /**
   * Get user's repositories with filters and sorting
   */
  async getUserRepositoriesWithFilters(
    userId: string,
    filters: IRepositoryFilters,
  ): Promise<{
    repositories: GitHubRepository[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userIdVO = UserId.fromString(userId);

    return this.gitHubRepositoryRepository.findByUserIdWithFilters(userIdVO, filters);
  }

  /**
   * Get user's repositories (legacy method - kept for backward compatibility)
   */
  async getUserRepositories(userId: string): Promise<GitHubRepository[]> {
    const userIdVO = UserId.fromString(userId);
    return this.gitHubRepositoryRepository.findByUserId(userIdVO);
  }

  /**
   * Search repositories with sorting and filtering
   */
  async searchRepositories(
    query: string,
    page: number = 1,
    limit: number = 10,
    sortBy: SortByEnum = SortByEnum.CREATED_AT,
    sortOrder: SortOrderEnum = SortOrderEnum.DESC,
    syncStatus?: string,
  ): Promise<{
    repositories: GitHubRepository[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.gitHubRepositoryRepository.search(
      query,
      page,
      limit,
      sortBy,
      sortOrder,
      syncStatus,
    );
  }

  /**
   * Get all repositories with sorting and filtering
   */
  async getAllRepositories(
    page: number = 1,
    limit: number = 10,
    sortBy: SortByEnum = SortByEnum.CREATED_AT,
    sortOrder: SortOrderEnum = SortOrderEnum.DESC,
    syncStatus?: string,
  ): Promise<{
    repositories: GitHubRepository[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.gitHubRepositoryRepository.findAll(page, limit, sortBy, sortOrder, syncStatus);
  }

  /**
   * Add new repository
   */
  async addRepository(
    githubPath: string,
    repositoryUrl: string,
    addedByUserId: string,
  ): Promise<GitHubRepository> {
    const gitHubPathVO = new GitHubPath(githubPath);
    const userIdVO = UserId.fromString(addedByUserId);

    // Check if repository already exists
    const existingRepository = await this.gitHubRepositoryRepository.findByGitHubPath(gitHubPathVO);

    if (existingRepository) {
      throw new BusinessRuleValidationException('Repository with this GitHub path already exists');
    }

    // Create new repository - FIX: Pass two separate arguments
    const repository = GitHubRepository.create(gitHubPathVO, userIdVO);

    // Validate repository
    this.validateRepository(repository);

    // Save repository
    const savedRepository = await this.gitHubRepositoryRepository.create(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(savedRepository);

    return savedRepository;
  }
  /**
   * Update repository sync data
   */
  async updateRepositorySync(
    repositoryId: string,
    syncData: {
      name?: string;
      description?: string;
      stars?: number;
      forks?: number;
      openIssues?: number;
      syncStatus?: SyncStatus;
      syncError?: string;
      createdAtGitHub?: Date;
    },
  ): Promise<GitHubRepository> {
    const repository = await this.findRepositoryById(repositoryId);

    // Update sync data
    repository.updateSyncData(syncData);

    // Save changes
    const updatedRepository = await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(updatedRepository);

    return updatedRepository;
  }

  /**
   * Remove a repository
   */
  async removeRepository(repositoryId: string, removedByUserId: string): Promise<boolean> {
    const repository = await this.findRepositoryById(repositoryId);

    // Check if user can remove this repository
    const belongsToUserSpec = new RepositoryBelongsToUserSpecification(removedByUserId);
    if (!belongsToUserSpec.isSatisfiedBy(repository)) {
      throw new BusinessRuleValidationException(
        'Only the user who added the repository can remove it',
      );
    }

    // Mark for removal (triggers domain event)
    repository.markForRemoval(removedByUserId);

    // Dispatch events before deletion
    await this.domainEventService.dispatchEventsFromAggregate(repository);

    // Delete from repository
    return this.gitHubRepositoryRepository.delete(repository.id);
  }

  /**
   * Request sync for a repository
   */
  async requestSync(repositoryId: string, userId: string): Promise<GitHubRepository> {
    const repository = await this.findRepositoryById(repositoryId);

    // Check if user can request sync for this repository
    const belongsToUserSpec = new RepositoryBelongsToUserSpecification(userId);
    if (!belongsToUserSpec.isSatisfiedBy(repository)) {
      throw new BusinessRuleValidationException(
        'Only the user who added the repository can request sync',
      );
    }

    // Request sync (this will trigger domain events)
    repository.requestSync(userId);

    // Save changes
    const updatedRepository = await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(updatedRepository);

    return updatedRepository;
  }

  /**
   * Update repository data (rename from updateRepositorySync)
   */
  async updateRepositoryData(
    repositoryId: string,
    userId: string,
    updateData: {
      name?: string;
      description?: string;
      stars?: number;
      forks?: number;
      openIssues?: number;
    },
  ): Promise<GitHubRepository> {
    const repository = await this.findRepositoryById(repositoryId);

    // Check if user can update this repository
    const belongsToUserSpec = new RepositoryBelongsToUserSpecification(userId);
    if (!belongsToUserSpec.isSatisfiedBy(repository)) {
      throw new BusinessRuleValidationException(
        'Only the user who added the repository can update it',
      );
    }

    // Update repository data manually
    if (updateData.name) repository.updateName(updateData.name);
    if (updateData.description !== undefined) repository.updateDescription(updateData.description);
    if (
      updateData.stars !== undefined ||
      updateData.forks !== undefined ||
      updateData.openIssues !== undefined
    ) {
      const newStats = new RepositoryStats(
        updateData.stars ?? repository.stars ?? 0,
        updateData.forks ?? repository.forks ?? 0,
        updateData.openIssues ?? repository.openIssues ?? 0,
      );
      repository.updateStatsManually(newStats, updateData.description);
    }

    // Save changes
    const updatedRepository = await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(updatedRepository);

    return updatedRepository;
  }

  /**
   * Start sync process
   */
  async startSync(repositoryId: string): Promise<void> {
    const repository = await this.findRepositoryById(repositoryId);

    // Start sync (domain logic)
    repository.startSync();

    // Save changes
    await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(repository);
  }

  /**
   * Complete sync with data
   */
  async completeSyncWithData(
    repositoryId: string,
    name: string,
    description: string | null,
    stars: number,
    forks: number,
    openIssues: number,
    createdAtGitHub: Date,
  ): Promise<void> {
    const repository = await this.findRepositoryById(repositoryId);

    // Complete sync with data (domain logic)
    repository.completeSyncWithData(name, description, stars, forks, openIssues, createdAtGitHub);

    // Save changes
    await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(repository);
  }

  /**
   * Fail sync with error
   */
  async failSync(repositoryId: string, error: string): Promise<void> {
    const repository = await this.findRepositoryById(repositoryId);

    // Fail sync (domain logic)
    repository.failSync(error);

    // Save changes
    await this.gitHubRepositoryRepository.update(repository);

    // Dispatch domain events
    await this.domainEventService.dispatchEventsFromAggregate(repository);
  }

  /**
   * Get repository by ID
   */
  async findRepositoryById(repositoryId: string): Promise<GitHubRepository> {
    const repositoryIdVO = RepositoryId.fromString(repositoryId);
    const repository = await this.gitHubRepositoryRepository.findById(repositoryIdVO);

    if (!repository) {
      throw new EntityNotFoundException('GitHubRepository', repositoryId);
    }

    return repository;
  }

  /**
   * Find repository by GitHub path
   */
  async findByGitHubPath(githubPath: string): Promise<GitHubRepository | null> {
    const gitHubPathVO = new GitHubPath(githubPath);
    return this.gitHubRepositoryRepository.findByGitHubPath(gitHubPathVO);
  }

  /**
   * Get repository statistics
   */
  async getStatistics(): Promise<{
    totalRepositories: number;
    pendingSync: number;
    failedSync: number;
    completedSync: number;
    totalStars: number;
    totalForks: number;
  }> {
    return this.gitHubRepositoryRepository.getStatistics();
  }

  /**
   * Validate repository using domain validation service
   */
  private validateRepository(repository: GitHubRepository): void {
    if (!repository.githubPath || !repository.addedByUserId) {
      throw new BusinessRuleValidationException(
        'Repository must have a GitHub path and added by user',
      );
    }
  }
}
