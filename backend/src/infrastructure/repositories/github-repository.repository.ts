import { Injectable } from '@nestjs/common';
import {
  IGitHubRepositoryRepository,
  IPaginatedResult,
  IRepositoryFilters,
} from '@core/repositories/github-repository.repository.interface';
import { GitHubRepository } from '@core/entities/github-repository.entity';
import { RepositoryId } from '@core/value-objects/repository-id.vo';
import { GitHubPath } from '@core/value-objects/github-path.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import { SyncStatusType } from '@core/value-objects/sync-status.vo';
import {
  SortByEnum,
  SortOrderEnum,
} from '@application/dtos/github-repository/get-repositories.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class GitHubRepositoryRepository implements IGitHubRepositoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(repository: GitHubRepository): Promise<GitHubRepository> {
    const repositoryData = {
      id: repository.id.getValue(),
      githubPath: repository.githubPath.getValue(),
      repositoryUrl: repository.repositoryUrl.getValue(),
      name: repository.name,
      description: repository.description,
      owner: repository.owner,
      stars: repository.stars,
      forks: repository.forks,
      openIssues: repository.openIssues,
      syncStatus: repository.syncStatus.getStatus(),
      lastSyncAt: repository.lastSyncAt || null,
      syncError: repository.syncError || null,
      addedByUserId: repository.addedByUserId.getValue(),
      createdAtGitHub: repository.createdAtGitHub,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
    };

    const data = await this.prisma.gitHubRepository.create({
      data: repositoryData,
    });

    return this.mapToDomain(data);
  }

  async update(repository: GitHubRepository): Promise<GitHubRepository> {
    const data = await this.prisma.gitHubRepository.update({
      where: { id: repository.id.getValue() },
      data: {
        githubPath: repository.githubPath.getValue(),
        repositoryUrl: repository.repositoryUrl.getValue(),
        name: repository.name || null,
        description: repository.description || null,
        stars: repository.stars || 0,
        forks: repository.forks || 0,
        openIssues: repository.openIssues || 0,
        syncStatus: repository.syncStatus.getStatus(),
        lastSyncAt: repository.lastSyncAt || null,
        syncError: repository.syncError || null,
        addedByUserId: repository.addedByUserId.getValue(),
        createdAtGitHub: repository.createdAtGitHub || null,
        updatedAt: repository.updatedAt,
      },
    });

    return this.mapToDomain(data);
  }

  async findById(id: RepositoryId): Promise<GitHubRepository | null> {
    const data = await this.prisma.gitHubRepository.findUnique({
      where: { id: id.getValue() },
    });

    return data ? this.mapToDomain(data) : null;
  }

  async findByGitHubPath(githubPath: GitHubPath): Promise<GitHubRepository | null> {
    const data = await this.prisma.gitHubRepository.findUnique({
      where: { githubPath: githubPath.getValue() },
    });

    return data ? this.mapToDomain(data) : null;
  }

  async findByUserId(userId: UserId): Promise<GitHubRepository[]> {
    const data = await this.prisma.gitHubRepository.findMany({
      where: { addedByUserId: userId.getValue() },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(item => this.mapToDomain(item));
  }

  async findByUserIdWithFilters(
    userId: UserId,
    filters: IRepositoryFilters,
  ): Promise<IPaginatedResult> {
    const { page, limit, search, syncStatus, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.GitHubRepositoryWhereInput = {
      addedByUserId: userId.getValue(),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
          { githubPath: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(syncStatus && { syncStatus }),
    };

    // Build order by clause
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [data, total] = await Promise.all([
      this.prisma.gitHubRepository.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.gitHubRepository.count({ where: whereClause }),
    ]);

    const repositories = data.map(item => this.mapToDomain(item));

    return {
      repositories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySyncStatus(status: SyncStatusType): Promise<GitHubRepository[]> {
    const data = await this.prisma.gitHubRepository.findMany({
      where: { syncStatus: status },
      orderBy: { createdAt: 'desc' },
    });

    return data.map(item => this.mapToDomain(item));
  }

  async findRepositoriesNeedingSync(): Promise<GitHubRepository[]> {
    const data = await this.prisma.gitHubRepository.findMany({
      where: {
        syncStatus: {
          in: ['pending', 'failed'],
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return data.map(item => this.mapToDomain(item));
  }

  async findStaleRepositories(maxAgeInHours: number): Promise<GitHubRepository[]> {
    const staleThreshold = new Date(Date.now() - maxAgeInHours * 60 * 60 * 1000);

    const data = await this.prisma.gitHubRepository.findMany({
      where: {
        OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: staleThreshold } }],
      },
      orderBy: { lastSyncAt: 'asc' },
    });

    return data.map(item => this.mapToDomain(item));
  }

  async findAll(
    page: number,
    limit: number,
    sortBy: SortByEnum = SortByEnum.CREATED_AT,
    sortOrder: SortOrderEnum = SortOrderEnum.DESC,
    syncStatus?: string,
  ): Promise<IPaginatedResult> {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.GitHubRepositoryWhereInput = {
      ...(syncStatus && { syncStatus }),
    };

    // Build order by clause
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [data, total] = await Promise.all([
      this.prisma.gitHubRepository.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.gitHubRepository.count({ where: whereClause }),
    ]);

    const repositories = data.map(item => this.mapToDomain(item));

    return {
      repositories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(
    query: string,
    page: number,
    limit: number,
    sortBy: SortByEnum = SortByEnum.CREATED_AT,
    sortOrder: SortOrderEnum = SortOrderEnum.DESC,
    syncStatus?: string,
  ): Promise<IPaginatedResult> {
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.GitHubRepositoryWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { owner: { contains: query, mode: 'insensitive' } },
        { githubPath: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
      ...(syncStatus && { syncStatus }),
    };

    // Build order by clause
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [data, total] = await Promise.all([
      this.prisma.gitHubRepository.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.gitHubRepository.count({ where: whereClause }),
    ]);

    const repositories = data.map(item => this.mapToDomain(item));

    return {
      repositories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: RepositoryId): Promise<boolean> {
    try {
      await this.prisma.gitHubRepository.delete({
        where: { id: id.getValue() },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(githubPath: GitHubPath): Promise<boolean> {
    const count = await this.prisma.gitHubRepository.count({
      where: { githubPath: githubPath.getValue() },
    });
    return count > 0;
  }

  async getStatistics(): Promise<{
    totalRepositories: number;
    pendingSync: number;
    failedSync: number;
    completedSync: number;
    totalStars: number;
    totalForks: number;
  }> {
    const [totalRepositories, pendingSync, failedSync, completedSync, aggregates] =
      await Promise.all([
        this.prisma.gitHubRepository.count(),
        this.prisma.gitHubRepository.count({ where: { syncStatus: 'pending' } }),
        this.prisma.gitHubRepository.count({ where: { syncStatus: 'failed' } }),
        this.prisma.gitHubRepository.count({ where: { syncStatus: 'completed' } }),
        this.prisma.gitHubRepository.aggregate({
          _sum: {
            stars: true,
            forks: true,
          },
        }),
      ]);

    return {
      totalRepositories,
      pendingSync,
      failedSync,
      completedSync,
      totalStars: aggregates._sum.stars || 0,
      totalForks: aggregates._sum.forks || 0,
    };
  }

  /**
   * Build Prisma orderBy clause from sort parameters
   */
  private buildOrderByClause(
    sortBy: SortByEnum,
    sortOrder: SortOrderEnum,
  ): Prisma.GitHubRepositoryOrderByWithRelationInput {
    const direction = sortOrder === SortOrderEnum.ASC ? 'asc' : 'desc';

    switch (sortBy) {
      case SortByEnum.CREATED_AT:
        return { createdAt: direction };
      case SortByEnum.STARS:
        return { stars: direction };
      case SortByEnum.FORKS:
        return { forks: direction };
      case SortByEnum.NAME:
        return { name: direction };
      case SortByEnum.LAST_SYNC:
        return { lastSyncAt: direction };
      default:
        return { createdAt: direction };
    }
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToDomain(item: any): GitHubRepository {
    return GitHubRepository.fromData({
      id: item.id,
      githubPath: item.githubPath,
      repositoryUrl: item.repositoryUrl,
      name: item.name,
      description: item.description,
      stars: item.stars,
      forks: item.forks,
      openIssues: item.openIssues,
      syncStatus: item.syncStatus,
      lastSyncAt: item.lastSyncAt,
      syncError: item.syncError,
      addedByUserId: item.addedByUserId,
      createdAtGitHub: item.createdAtGitHub,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }
}
