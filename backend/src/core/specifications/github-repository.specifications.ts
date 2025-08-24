import { Specification } from './specification.base';
import { GitHubRepository } from '@core/entities/github-repository.entity';

/**
 * Specification to check if repository needs sync
 */
export class RepositoryNeedsSyncSpecification extends Specification<GitHubRepository> {
  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.needsSync;
  }

  getDescription(): string {
    return 'Repository needs synchronization';
  }
}

/**
 * Specification to check if repository is stale
 */
export class RepositoryIsStaleSpecification extends Specification<GitHubRepository> {
  constructor(private readonly maxAgeInHours: number = 24) {
    super();
  }

  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.isStale(this.maxAgeInHours);
  }

  getDescription(): string {
    return `Repository data is older than ${this.maxAgeInHours} hours`;
  }
}

/**
 * Specification to check if repository sync is in progress
 */
export class RepositorySyncInProgressSpecification extends Specification<GitHubRepository> {
  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.isBeingSync;
  }

  getDescription(): string {
    return 'Repository sync is currently in progress';
  }
}

/**
 * Specification to check if repository has successful sync
 */
export class RepositorySyncCompletedSpecification extends Specification<GitHubRepository> {
  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.syncStatus.isCompleted();
  }

  getDescription(): string {
    return 'Repository sync has been completed successfully';
  }
}

/**
 * Specification to check if repository belongs to user
 */
export class RepositoryBelongsToUserSpecification extends Specification<GitHubRepository> {
  constructor(private readonly userId: string) {
    super();
  }

  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.addedByUserId.getValue() === this.userId;
  }

  getDescription(): string {
    return `Repository belongs to user ${this.userId}`;
  }
}

/**
 * Specification to check if repository is popular (has many stars)
 */
export class PopularRepositorySpecification extends Specification<GitHubRepository> {
  constructor(private readonly minStars: number = 1000) {
    super();
  }

  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.stars >= this.minStars;
  }

  getDescription(): string {
    return `Repository has at least ${this.minStars} stars`;
  }
}

/**
 * Specification to check if repository is active (has open issues)
 */
export class ActiveRepositorySpecification extends Specification<GitHubRepository> {
  isSatisfiedBy(repository: GitHubRepository): boolean {
    return repository.openIssues > 0;
  }

  getDescription(): string {
    return 'Repository has open issues and is actively maintained';
  }
}

/**
 * Specification to check if repository can be synced
 */
export class CanSyncRepositorySpecification extends Specification<GitHubRepository> {
  isSatisfiedBy(repository: GitHubRepository): boolean {
    // Can sync if not currently in progress
    return !repository.isBeingSync;
  }

  getDescription(): string {
    return 'Repository can be synchronized';
  }
}
