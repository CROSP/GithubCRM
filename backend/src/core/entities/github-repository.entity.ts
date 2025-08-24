import { AggregateRoot } from '@core/events/domain-event.base';
import { RepositoryId } from '@core/value-objects/repository-id.vo';
import { GitHubPath } from '@core/value-objects/github-path.vo';
import { RepositoryUrl } from '@core/value-objects/repository-url.vo';
import { RepositoryStats } from '@core/value-objects/repository-stats.vo';
import { SyncStatus, SyncStatusType } from '@core/value-objects/sync-status.vo';
import { UserId } from '@core/value-objects/user-id.vo';
import {
  RepositoryAddedEvent,
  RepositorySyncRequestedEvent,
  RepositorySyncStartedEvent,
  RepositorySyncCompletedEvent,
  RepositorySyncFailedEvent,
  RepositoryDataUpdatedEvent,
  RepositoryRemovedEvent,
} from '@core/events/github-repository.events';
import {
  InvalidValueObjectException,
  BusinessRuleValidationException,
} from '@core/exceptions/domain-exceptions';

export class GitHubRepository extends AggregateRoot {
  private readonly _id: RepositoryId;
  private readonly _githubPath: GitHubPath;
  private _repositoryUrl: RepositoryUrl;
  private _name: string;
  private _description: string | null;
  private _stats: RepositoryStats;
  private _syncStatus: SyncStatus;
  private readonly _addedByUserId: UserId;
  private _createdAtGitHub: Date | null; // GitHub repository creation date
  private readonly _createdAt: Date; // When added to our system
  private _updatedAt: Date;
  private _syncError?: string;

  private constructor(
    id: RepositoryId,
    githubPath: GitHubPath,
    repositoryUrl: RepositoryUrl,
    addedByUserId: UserId,
    name?: string,
    description?: string | null,
    stats?: RepositoryStats,
    syncStatus?: SyncStatus,
    createdAtGitHub?: Date | null,
    createdAt?: Date,
  ) {
    super();
    this._id = id;
    this._githubPath = githubPath;
    this._repositoryUrl = repositoryUrl;
    this._addedByUserId = addedByUserId;
    this._name = name || githubPath.getRepository();
    this._description = description || null;
    this._stats = stats || RepositoryStats.zero();
    this._syncStatus = syncStatus || SyncStatus.pending();
    this._createdAtGitHub = createdAtGitHub || null;
    this._createdAt = createdAt || new Date();
    this._updatedAt = new Date();
  }

  // Factory method for creating new repository
  static create(githubPath: GitHubPath, addedByUserId: UserId): GitHubRepository {
    const repositoryId = RepositoryId.create();
    const repositoryUrl = new RepositoryUrl(`https://github.com/${githubPath.getValue()}`);

    const repository = new GitHubRepository(repositoryId, githubPath, repositoryUrl, addedByUserId);

    // Add domain event
    repository.addDomainEvent(
      new RepositoryAddedEvent(repositoryId, githubPath, addedByUserId.getValue()),
    );

    return repository;
  }

  // Factory method for reconstituting from persistence
  static fromData(data: {
    id: string;
    githubPath: string;
    repositoryUrl: string;
    name: string;
    description: string | null;
    stars: number;
    forks: number;
    openIssues: number;
    syncStatus: string;
    lastSyncAt: Date | null;
    syncError: string | null;
    addedByUserId: string;
    createdAtGitHub: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): GitHubRepository {
    const repository = new GitHubRepository(
      RepositoryId.fromString(data.id),
      new GitHubPath(data.githubPath),
      new RepositoryUrl(data.repositoryUrl),
      UserId.fromString(data.addedByUserId),
      data.name,
      data.description,
      new RepositoryStats(data.stars, data.forks, data.openIssues),
      new SyncStatus(
        data.syncStatus as SyncStatusType,
        data.lastSyncAt || undefined,
        data.syncError || undefined,
      ),
      data.createdAtGitHub,
      data.createdAt,
    );

    repository._updatedAt = data.updatedAt;

    return repository;
  }

  // ===========================================
  // GETTERS
  // ===========================================

  get id(): RepositoryId {
    return this._id;
  }

  get githubPath(): GitHubPath {
    return this._githubPath;
  }

  get repositoryUrl(): RepositoryUrl {
    return this._repositoryUrl;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get owner(): string {
    return this._githubPath.getOwner();
  }

  get repository(): string {
    return this._githubPath.getRepository();
  }

  get stats(): RepositoryStats {
    return this._stats;
  }

  get syncError(): string | undefined {
    return this._syncError;
  }

  get stars(): number {
    return this._stats.getStars();
  }

  get forks(): number {
    return this._stats.getForks();
  }

  get openIssues(): number {
    return this._stats.getOpenIssues();
  }

  get syncStatus(): SyncStatus {
    return this._syncStatus;
  }

  get addedByUserId(): UserId {
    return this._addedByUserId;
  }

  get createdAtGitHub(): Date | null {
    return this._createdAtGitHub;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get needsSync(): boolean {
    return this._syncStatus.needsSync();
  }

  get isBeingSync(): boolean {
    return this._syncStatus.isInProgress();
  }

  get lastSyncAt(): Date | undefined {
    return this._syncStatus.getLastSyncAt();
  }

  // ===========================================
  // BUSINESS METHODS
  // ===========================================
  /**
   * Update repository name
   */
  updateName(newName: string): void {
    this.validateName(newName);

    if (this._name === newName) {
      return; // No change needed
    }

    const oldName = this._name;
    this._name = newName;
    this._updatedAt = new Date();

    // Add domain event for name change
    this.addDomainEvent(
      new RepositoryDataUpdatedEvent(this._id, this._githubPath, {
        name: { from: oldName, to: newName }
      })
    );
  }

  /**
   * Update repository description
   */
  updateDescription(newDescription: string | null): void {
    if (this._description === newDescription) {
      return; // No change needed
    }

    const oldDescription = this._description;
    this._description = newDescription;
    this._updatedAt = new Date();

    // Add domain event for description change
    this.addDomainEvent(
      new RepositoryDataUpdatedEvent(this._id, this._githubPath, {
        description: { from: oldDescription, to: newDescription }
      })
    );
  }
  requestSync(requestedByUserId: string): void {
    if (this._syncStatus.isInProgress()) {
      throw new BusinessRuleValidationException(
        'Cannot request sync while sync is already in progress',
      );
    }

    this._syncStatus = SyncStatus.pending();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new RepositorySyncRequestedEvent(this._id, this._githubPath, requestedByUserId),
    );
  }

  startSync(): void {
    if (!this._syncStatus.needsSync()) {
      throw new BusinessRuleValidationException('Repository does not need sync');
    }

    this._syncStatus = SyncStatus.inProgress();
    this._updatedAt = new Date();

    this.addDomainEvent(new RepositorySyncStartedEvent(this._id, this._githubPath));
  }

  updateSyncData(syncData: {
    name?: string;
    description?: string;
    stars?: number;
    forks?: number;
    openIssues?: number;
    syncStatus?: SyncStatus;
    syncError?: string;
    createdAtGitHub?: Date;
  }): void {
    let hasChanges = false;
    const changes: Record<string, unknown> = {};

    if (syncData.name && syncData.name !== this._name) {
      changes.name = { from: this._name, to: syncData.name };
      this._name = syncData.name;
      hasChanges = true;
    }

    if (syncData.description !== undefined && syncData.description !== this._description) {
      changes.description = { from: this._description, to: syncData.description };
      this._description = syncData.description;
      hasChanges = true;
    }

    if (
      syncData.stars !== undefined ||
      syncData.forks !== undefined ||
      syncData.openIssues !== undefined
    ) {
      const newStats = new RepositoryStats(
        syncData.stars ?? this._stats.getStars(),
        syncData.forks ?? this._stats.getForks(),
        syncData.openIssues ?? this._stats.getOpenIssues(),
      );

      if (!this._stats.equals(newStats)) {
        changes.stats = {
          from: {
            stars: this._stats.getStars(),
            forks: this._stats.getForks(),
            openIssues: this._stats.getOpenIssues(),
          },
          to: {
            stars: newStats.getStars(),
            forks: newStats.getForks(),
            openIssues: newStats.getOpenIssues(),
          },
        };
        this._stats = newStats;
        hasChanges = true;
      }
    }

    if (syncData.syncStatus) {
      this._syncStatus = syncData.syncStatus;
      hasChanges = true;
    }

    if (syncData.syncError !== undefined) {
      this._syncError = syncData.syncError;
      hasChanges = true;
    }

    if (syncData.createdAtGitHub && syncData.createdAtGitHub !== this._createdAtGitHub) {
      changes.createdAtGitHub = { from: this._createdAtGitHub, to: syncData.createdAtGitHub };
      this._createdAtGitHub = syncData.createdAtGitHub;
      hasChanges = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();

      if (Object.keys(changes).length > 0) {
        this.addDomainEvent(new RepositoryDataUpdatedEvent(this._id, this._githubPath, changes));
      }
    }
  }

  completeSyncWithData(
    name: string,
    description: string | null,
    stars: number,
    forks: number,
    openIssues: number,
    createdAtGitHub: Date,
  ): void {
    if (!this._syncStatus.isInProgress()) {
      throw new BusinessRuleValidationException('Cannot complete sync that is not in progress');
    }

    const changes: Record<string, unknown> = {};

    // Track changes
    if (this._name !== name) {
      changes.name = { from: this._name, to: name };
      this._name = name;
    }

    if (this._description !== description) {
      changes.description = { from: this._description, to: description };
      this._description = description;
    }

    const newStats = new RepositoryStats(stars, forks, openIssues);
    if (!this._stats.equals(newStats)) {
      changes.stats = {
        from: {
          stars: this._stats.getStars(),
          forks: this._stats.getForks(),
          openIssues: this._stats.getOpenIssues(),
        },
        to: { stars, forks, openIssues },
      };
      this._stats = newStats;
    }

    if (this._createdAtGitHub?.getTime() !== createdAtGitHub.getTime()) {
      changes.createdAtGitHub = { from: this._createdAtGitHub, to: createdAtGitHub };
      this._createdAtGitHub = createdAtGitHub;
    }

    this._syncStatus = SyncStatus.completed();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new RepositorySyncCompletedEvent(this._id, this._githubPath, stars, forks, openIssues),
    );

    if (Object.keys(changes).length > 0) {
      this.addDomainEvent(new RepositoryDataUpdatedEvent(this._id, this._githubPath, changes));
    }
  }

  failSync(error: string): void {
    if (!this._syncStatus.isInProgress()) {
      throw new BusinessRuleValidationException('Cannot fail sync that is not in progress');
    }

    this._syncStatus = SyncStatus.failed(error);
    this._updatedAt = new Date();

    this.addDomainEvent(new RepositorySyncFailedEvent(this._id, this._githubPath, error));
  }

  markForRemoval(removedByUserId: string): void {
    this._updatedAt = new Date();

    this.addDomainEvent(new RepositoryRemovedEvent(this._id, this._githubPath, removedByUserId));
  }

  // ===========================================
  // VALIDATION METHODS
  // ===========================================

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidValueObjectException('Repository name cannot be empty');
    }

    if (name.length > 100) {
      throw new InvalidValueObjectException('Repository name is too long (max 100 characters)');
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Get the GitHub creation timestamp as Unix timestamp
   */
  getCreatedAtGitHubUnixTimestamp(): number | null {
    return this._createdAtGitHub ? Math.floor(this._createdAtGitHub.getTime() / 1000) : null;
  }

  /**
   * Check if repository data is stale (needs refresh)
   */
  isStale(maxAgeInHours: number = 24): boolean {
    if (!this._syncStatus.isCompleted() || !this._syncStatus.getLastSyncAt()) {
      return true;
    }

    const ageInHours =
      (Date.now() - this._syncStatus.getLastSyncAt()!.getTime()) / (1000 * 60 * 60);
    return ageInHours > maxAgeInHours;
  }

  /**
   * Get a summary string of the repository
   */
  getSummary(): string {
    return `${this._githubPath.getValue()} - ${this._stats.getStars()} stars, ${this._stats.getForks()} forks`;
  }

  updateStatsManually(newStats: RepositoryStats, newDescription?: string): void {
    const changes: Record<string, unknown> = {};

    // Track changes
    if (!this._stats.equals(newStats)) {
      changes.stats = {
        from: {
          stars: this._stats.getStars(),
          forks: this._stats.getForks(),
          openIssues: this._stats.getOpenIssues(),
        },
        to: {
          stars: newStats.getStars(),
          forks: newStats.getForks(),
          openIssues: newStats.getOpenIssues(),
        },
      };
      this._stats = newStats;
    }

    if (newDescription !== undefined && this._description !== newDescription) {
      changes.description = { from: this._description, to: newDescription };
      this._description = newDescription;
    }

    this._updatedAt = new Date();

    if (Object.keys(changes).length > 0) {
      this.addDomainEvent(new RepositoryDataUpdatedEvent(this._id, this._githubPath, changes));
    }
  }
}
