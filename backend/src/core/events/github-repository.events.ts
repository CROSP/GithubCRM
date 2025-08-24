import { DomainEvent } from './domain-event.base';
import { RepositoryId } from '@core/value-objects/repository-id.vo';
import { GitHubPath } from '@core/value-objects/github-path.vo';

export class RepositoryAddedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly addedByUserId: string,
  ) {
    super(); // Your DomainEvent constructor takes version: number = 1
  }

  getEventName(): string {
    return 'RepositoryAdded';
  }
}

export class RepositorySyncRequestedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly requestedByUserId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositorySyncRequested';
  }
}

export class RepositorySyncStartedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositorySyncStarted';
  }
}

export class RepositorySyncCompletedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly stars: number,
    public readonly forks: number,
    public readonly openIssues: number,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositorySyncCompleted';
  }
}

export class RepositorySyncFailedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly error: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositorySyncFailed';
  }
}

export class RepositoryDataUpdatedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly changes: Record<string, any>,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositoryDataUpdated';
  }
}

export class RepositoryRemovedEvent extends DomainEvent {
  constructor(
    public readonly repositoryId: RepositoryId,
    public readonly githubPath: GitHubPath,
    public readonly removedByUserId: string,
  ) {
    super();
  }

  getEventName(): string {
    return 'RepositoryRemoved';
  }
}
