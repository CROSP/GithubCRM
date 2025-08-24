export interface RepositorySyncJob {
  repositoryId: string;
  githubPath: string;
  owner: string;
  repository: string;
  priority: 'low' | 'normal' | 'high';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledFor?: Date;
  syncType?: 'initial' | 'manual' | 'scheduled';
}

export interface IRepositorySyncQueueService {
  /**
   * Add a repository sync job to the queue
   */
  addSyncJob(job: Omit<RepositorySyncJob, 'createdAt' | 'retryCount'>): Promise<void>;

  /**
   * Add multiple sync jobs to the queue
   */
  addBatchSyncJobs(jobs: Omit<RepositorySyncJob, 'createdAt' | 'retryCount'>[]): Promise<void>;

  /**
   * Process next sync job from the queue
   */
  processNextJob(): Promise<RepositorySyncJob | null>;

  /**
   * Mark a job as completed
   */
  markJobCompleted(repositoryId: string): Promise<void>;

  /**
   * Mark a job as failed and potentially retry
   */
  markJobFailed(repositoryId: string, error: string): Promise<void>;

  /**
   * Get pending jobs count
   */
  getPendingJobsCount(): Promise<number>;

  /**
   * Get failed jobs count
   */
  getFailedJobsCount(): Promise<number>;

  /**
   * Clear all jobs from the queue
   */
  clearQueue(): Promise<void>;

  /**
   * Get queue statistics
   */
  getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;

  /**
   * Pause/resume queue processing
   */
  pauseQueue(): Promise<void>;
  resumeQueue(): Promise<void>;
  isQueuePaused(): Promise<boolean>;
}
