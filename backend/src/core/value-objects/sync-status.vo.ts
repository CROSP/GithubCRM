export enum SyncStatusType {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class SyncStatus {
  private readonly status: SyncStatusType;
  private readonly lastSyncAt?: Date;
  private readonly syncError?: string;

  constructor(status: SyncStatusType, lastSyncAt?: Date, syncError?: string) {
    this.status = status;
    this.lastSyncAt = lastSyncAt;
    this.syncError = syncError;
  }

  getStatus(): SyncStatusType {
    return this.status;
  }

  getLastSyncAt(): Date | undefined {
    return this.lastSyncAt;
  }

  getSyncError(): string | undefined {
    return this.syncError;
  }

  isPending(): boolean {
    return this.status === SyncStatusType.PENDING;
  }

  isInProgress(): boolean {
    return this.status === SyncStatusType.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === SyncStatusType.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === SyncStatusType.FAILED;
  }

  needsSync(): boolean {
    return this.isPending() || this.isFailed();
  }

  static pending(): SyncStatus {
    return new SyncStatus(SyncStatusType.PENDING);
  }

  static inProgress(): SyncStatus {
    return new SyncStatus(SyncStatusType.IN_PROGRESS);
  }

  static completed(lastSyncAt: Date = new Date()): SyncStatus {
    return new SyncStatus(SyncStatusType.COMPLETED, lastSyncAt);
  }

  static failed(error: string, lastSyncAt?: Date): SyncStatus {
    return new SyncStatus(SyncStatusType.FAILED, lastSyncAt, error);
  }

  equals(other: SyncStatus): boolean {
    return (
      this.status === other.status &&
      this.lastSyncAt?.getTime() === other.lastSyncAt?.getTime() &&
      this.syncError === other.syncError
    );
  }
}
