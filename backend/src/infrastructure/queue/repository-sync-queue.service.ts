import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  IRepositorySyncQueueService,
  RepositorySyncJob,
} from '@core/services/repository-sync-queue.service.interface';

@Injectable()
export class RepositorySyncQueueService implements IRepositorySyncQueueService {
  private readonly logger = new Logger(RepositorySyncQueueService.name);

  constructor(@InjectQueue('repository-sync') private readonly syncQueue: Queue) {}

  async addSyncJob(job: Omit<RepositorySyncJob, 'createdAt' | 'retryCount'>): Promise<void> {
    try {
      const syncType = job.syncType || 'manual'; // Default to manual
      const timestamp = Date.now();

      // Generate unique job ID based on sync type
      const jobId = `${job.repositoryId}-${syncType}-${timestamp}`;

      this.logger.log(`Adding ${syncType} sync job with ID: ${jobId}`);

      await this.syncQueue.add(
        'sync-repository',
        {
          ...job,
          createdAt: new Date(),
          retryCount: 0,
          syncType, // Include sync type in job data
        },
        {
          priority: this.getPriorityNumber(job.priority),
          attempts: job.maxRetries + 1,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
          delay: job.scheduledFor ? job.scheduledFor.getTime() - Date.now() : undefined,
          jobId: jobId, // ✅ Unique ID based on sync type
        },
      );

      this.logger.log(`Added ${syncType} sync job for repository: ${job.githubPath}`);
    } catch (error) {
      this.logger.error(`Failed to add sync job for repository: ${job.githubPath}`, error);
      throw error;
    }
  }

  async addBatchSyncJobs(
    jobs: Omit<RepositorySyncJob, 'createdAt' | 'retryCount'>[],
  ): Promise<void> {
    try {
      const jobsWithDefaults = jobs.map(job => {
        const syncType = job.syncType || 'manual'; // Default to manual
        const timestamp = Date.now();

        // Generate unique job ID based on sync type
        const jobId = `${job.repositoryId}-${syncType}-${timestamp}`;
        return {
          name: 'sync-repository',
          data: {
            ...job,
            createdAt: new Date(),
            retryCount: 0,
          },
          opts: {
            priority: this.getPriorityNumber(job.priority),
            attempts: job.maxRetries + 1,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 10,
            removeOnFail: 50,
            delay: job.scheduledFor ? job.scheduledFor.getTime() - Date.now() : undefined,
            jobId: jobId,
          },
        };
      });

      await this.syncQueue.addBulk(jobsWithDefaults);
      this.logger.log(`Added ${jobs.length} sync jobs to queue`);
    } catch (error) {
      this.logger.error(`Failed to add batch sync jobs`, error);
      throw error;
    }
  }

  async processNextJob(): Promise<RepositorySyncJob | null> {
    // This method is called by the worker/consumer
    // In BullMQ, jobs are automatically processed by workers
    // We don't manually call this method, but we keep it for interface compliance
    const waiting = await this.syncQueue.getJobs(['waiting'], 0, 0);

    return waiting.length > 0 ? waiting[0].data : null;
  }

  async markJobCompleted(repositoryId: string): Promise<void> {
    try {
      const job = await this.syncQueue.getJob(`sync-${repositoryId}`);
      if (job && !job.finishedOn) {
        await job.moveToCompleted('Completed successfully', job.token || '');
        this.logger.log(`Marked sync job as completed for repository: ${repositoryId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to mark job as completed for repository: ${repositoryId}`, error);
    }
  }

  async markJobFailed(repositoryId: string, error: string): Promise<void> {
    try {
      const job = await this.syncQueue.getJob(`sync-${repositoryId}`);
      if (job && !job.finishedOn) {
        await job.moveToFailed(new Error(error), job.token || '');
        this.logger.log(`Marked sync job as failed for repository: ${repositoryId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to mark job as failed for repository: ${repositoryId}`, err);
    }
  }

  async getPendingJobsCount(): Promise<number> {
    return await this.syncQueue.getWaiting().then(jobs => jobs.length);
  }

  async getFailedJobsCount(): Promise<number> {
    return await this.syncQueue.getFailed().then(jobs => jobs.length);
  }

  async clearQueue(): Promise<void> {
    await this.syncQueue.obliterate();
    this.logger.log('Cleared repository sync queue');
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.syncQueue.getWaiting(),
      this.syncQueue.getActive(),
      this.syncQueue.getCompleted(),
      this.syncQueue.getFailed(),
    ]);

    return {
      pending: waiting.length,
      processing: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.syncQueue.pause();
    this.logger.log('Paused repository sync queue');
  }

  async resumeQueue(): Promise<void> {
    await this.syncQueue.resume();
    this.logger.log('Resumed repository sync queue');
  }

  async isQueuePaused(): Promise<boolean> {
    return await this.syncQueue.isPaused();
  }

  private getPriorityNumber(priority: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'normal':
        return 5;
      case 'low':
        return 10;
      default:
        return 5;
    }
  }
}
