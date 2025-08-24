import { Injectable } from '@nestjs/common';
import { GitHubRepository } from '@core/entities/github-repository.entity';
import { GitHubRepositoryResponse } from '@application/dtos/responses/github-repository.response';

@Injectable()
export class GitHubRepositoryMapper {
  /**
   * Convert GitHubRepository entity to GitHubRepositoryResponse DTO
   */
  toResponse(repository: GitHubRepository): GitHubRepositoryResponse {
    return {
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
      syncError: repository.syncStatus.getSyncError() || null,
      addedByUserId: repository.addedByUserId.getValue(),
      createdAtGitHub: repository.createdAtGitHub,
      createdAtGitHubUnix: repository.getCreatedAtGitHubUnixTimestamp(),
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
      needsSync: repository.needsSync,
      isBeingSync: repository.isBeingSync,
    };
  }

  /**
   * Convert array of GitHubRepository entities to array of DTOs
   */
  toResponseList(repositories: GitHubRepository[]): GitHubRepositoryResponse[] {
    return repositories.map(repository => this.toResponse(repository));
  }
}
