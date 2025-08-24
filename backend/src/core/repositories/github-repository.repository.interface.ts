import { GitHubRepository } from '@core/entities/github-repository.entity';
import { RepositoryId } from '@core/value-objects/repository-id.vo';
import { GitHubPath } from '@core/value-objects/github-path.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { SyncStatusType } from '@core/value-objects/sync-status.vo';
import {
  SortByEnum,
  SortOrderEnum,
} from '@application/dtos/github-repository/get-repositories.dto';

export interface IRepositoryFilters {
  search?: string;
  syncStatus?: string;
  sortBy: SortByEnum;
  sortOrder: SortOrderEnum;
  page: number;
  limit: number;
}

export interface IPaginatedResult {
  repositories: GitHubRepository[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IGitHubRepositoryRepository {
  /**
   * Create a new GitHub repository record
   */
  create(repository: GitHubRepository): Promise<GitHubRepository>;

  /**
   * Update an existing GitHub repository
   */
  update(repository: GitHubRepository): Promise<GitHubRepository>;

  /**
   * Find repository by ID
   */
  findById(id: RepositoryId): Promise<GitHubRepository | null>;

  /**
   * Find repository by GitHub path
   */
  findByGitHubPath(githubPath: GitHubPath): Promise<GitHubRepository | null>;

  /**
   * Find all repositories added by a user
   */
  findByUserId(userId: UserId): Promise<GitHubRepository[]>;

  /**
   * Find repositories by user ID with filters and sorting
   */
  findByUserIdWithFilters(userId: UserId, filters: IRepositoryFilters): Promise<IPaginatedResult>;

  /**
   * Find repositories by sync status
   */
  findBySyncStatus(status: SyncStatusType): Promise<GitHubRepository[]>;

  /**
   * Find repositories that need sync (pending or failed)
   */
  findRepositoriesNeedingSync(): Promise<GitHubRepository[]>;

  /**
   * Find stale repositories (not synced recently)
   */
  findStaleRepositories(maxAgeInHours: number): Promise<GitHubRepository[]>;

  /**
   * Find all repositories with pagination, sorting, and filtering
   */
  findAll(
    page: number,
    limit: number,
    sortBy?: SortByEnum,
    sortOrder?: SortOrderEnum,
    syncStatus?: string,
  ): Promise<IPaginatedResult>;

  /**
   * Search repositories by name or owner with sorting and filtering
   */
  search(
    query: string,
    page: number,
    limit: number,
    sortBy?: SortByEnum,
    sortOrder?: SortOrderEnum,
    syncStatus?: string,
  ): Promise<IPaginatedResult>;

  /**
   * Delete a repository
   */
  delete(id: RepositoryId): Promise<boolean>;

  /**
   * Check if repository exists by GitHub path
   */
  exists(githubPath: GitHubPath): Promise<boolean>;

  /**
   * Get repository statistics
   */
  getStatistics(): Promise<{
    totalRepositories: number;
    pendingSync: number;
    failedSync: number;
    completedSync: number;
    totalStars: number;
    totalForks: number;
  }>;
}
