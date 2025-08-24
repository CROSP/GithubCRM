import { Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IRepositorySyncQueueService } from '@core/services/repository-sync-queue.service.interface';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { ILOGGER_TOKEN, REPOSITORY_SYNC_QUEUE_SERVICE } from '@shared/constants/tokens';
import { ILogger } from '@infrastructure/logger/logger.interface';
import { Public } from '@shared/decorators/public.decorator';

@ApiTags('Debug')
@Controller('debug')
export class DebugController {
  constructor(
    @InjectQueue('repository-sync') private readonly syncQueue: Queue,
    @Inject(REPOSITORY_SYNC_QUEUE_SERVICE)
    private readonly queueService: IRepositorySyncQueueService,
    private readonly repositoryService: GitHubRepositoryService,
    @Inject(ILOGGER_TOKEN) private readonly logger: ILogger,
  ) {
    this.logger.setContext('DebugController');
  }

  @Public()
  @Get('sync-status/:repositoryId')
  @ApiOperation({ summary: 'Get detailed sync status for a repository' })
  async getSyncStatus(@Param('repositoryId') repositoryId: string) {
    try {
      // Get repository from database
      const repository = await this.repositoryService.findRepositoryById(repositoryId);

      // Get job from queue
      const job = await this.syncQueue.getJob(`sync-${repositoryId}`);

      // Get queue stats
      const queueStats = await this.queueService.getQueueStats();

      return {
        repositoryId,
        githubPath: repository.githubPath.getValue(),
        database: {
          syncStatus: repository.syncStatus.getStatus(),
          lastSyncAt: repository.syncStatus.getLastSyncAt(),
          syncError: repository.syncStatus.getSyncError(),
          updatedAt: repository.updatedAt,
        },
        queue: {
          jobExists: !!job,
          jobId: job?.id,
          jobState: job?.finishedOn ? 'completed' : job?.processedOn ? 'processing' : 'waiting',
          jobProgress: job?.progress,
          jobTimestamp: job?.timestamp,
          jobProcessedOn: job?.processedOn,
          jobFinishedOn: job?.finishedOn,
          jobFailedReason: job?.failedReason,
          jobAttempts: job?.attemptsMade,
          jobMaxAttempts: job?.opts?.attempts,
        },
        queueOverall: queueStats,
        diagnostics: {
          isPaused: await this.queueService.isQueuePaused(),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get sync status for ${repositoryId}`, error.stack);
      return {
        error: error.message,
        repositoryId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @Get('queue/overview')
  @ApiOperation({ summary: 'Get complete queue overview' })
  async getQueueOverview() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.syncQueue.getJobs(['waiting'], 0, 10), // Get first 10
        this.syncQueue.getJobs(['active'], 0, 10),
        this.syncQueue.getJobs(['completed'], 0, 5),
        this.syncQueue.getJobs(['failed'], 0, 10),
        this.syncQueue.getJobs(['delayed'], 0, 5),
      ]);

      return {
        stats: await this.queueService.getQueueStats(),
        isPaused: await this.queueService.isQueuePaused(),
        jobs: {
          waiting: waiting.map(job => ({
            id: job.id,
            repositoryId: job.data.repositoryId,
            githubPath: job.data.githubPath,
            priority: job.data.priority,
            timestamp: job.timestamp,
            delay: job.delay,
          })),
          active: active.map(job => ({
            id: job.id,
            repositoryId: job.data.repositoryId,
            githubPath: job.data.githubPath,
            progress: job.progress,
            processedOn: job.processedOn,
          })),
          failed: failed.map(job => ({
            id: job.id,
            repositoryId: job.data.repositoryId,
            githubPath: job.data.githubPath,
            failedReason: job.failedReason,
            finishedOn: job.finishedOn,
            attemptsMade: job.attemptsMade,
          })),
          completed: completed.slice(0, 3).map(job => ({
            id: job.id,
            repositoryId: job.data.repositoryId,
            githubPath: job.data.githubPath,
            finishedOn: job.finishedOn,
          })),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue overview', error.stack);
      return { error: error.message };
    }
  }

  @Public()
  @Get('jobs/stuck')
  @ApiOperation({ summary: 'Find potentially stuck jobs' })
  async findStuckJobs(@Query('minutes') minutes: string = '10') {
    const minutesAgo = parseInt(minutes);
    const cutoffTime = Date.now() - minutesAgo * 60 * 1000;

    try {
      const [active, waiting] = await Promise.all([
        this.syncQueue.getJobs(['active']),
        this.syncQueue.getJobs(['waiting'], 0, 50),
      ]);

      const stuckActive = active.filter(job => job.processedOn && job.processedOn < cutoffTime);

      const oldWaiting = waiting.filter(job => job.timestamp < cutoffTime);

      return {
        cutoffTime: new Date(cutoffTime).toISOString(),
        stuckActiveJobs: stuckActive.map(job => ({
          id: job.id,
          repositoryId: job.data.repositoryId,
          githubPath: job.data.githubPath,
          processedOn: new Date(job.processedOn!).toISOString(),
          stuckForMinutes: Math.round((Date.now() - job.processedOn!) / 60000),
          progress: job.progress,
        })),
        oldWaitingJobs: oldWaiting.map(job => ({
          id: job.id,
          repositoryId: job.data.repositoryId,
          githubPath: job.data.githubPath,
          timestamp: new Date(job.timestamp).toISOString(),
          waitingForMinutes: Math.round((Date.now() - job.timestamp) / 60000),
        })),
        summary: {
          stuckActiveCount: stuckActive.length,
          oldWaitingCount: oldWaiting.length,
        },
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Public()
  @Post('queue/clean-stuck')
  @ApiOperation({ summary: 'Clean up stuck jobs' })
  async cleanStuckJobs(@Query('minutes') minutes: string = '15') {
    const minutesAgo = parseInt(minutes);
    const cutoffTime = Date.now() - minutesAgo * 60 * 1000;

    try {
      const active = await this.syncQueue.getJobs(['active']);
      const stuckJobs = active.filter(job => job.processedOn && job.processedOn < cutoffTime);

      const results = [];
      for (const job of stuckJobs) {
        try {
          await job.moveToFailed(
            new Error(`Job stuck for over ${minutesAgo} minutes - cleaned up`),
          );
          results.push({
            id: job.id,
            repositoryId: job.data.repositoryId,
            status: 'moved_to_failed',
          });
        } catch (err) {
          results.push({
            id: job.id,
            repositoryId: job.data.repositoryId,
            status: 'failed_to_clean',
            error: err.message,
          });
        }
      }

      return {
        cleanedCount: results.filter(r => r.status === 'moved_to_failed').length,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'System health check for sync functionality' })
  async getSystemHealth() {
    try {
      const queueStats = await this.queueService.getQueueStats();
      const isPaused = await this.queueService.isQueuePaused();

      // Check for potential issues
      const issues = [];

      if (isPaused) {
        issues.push('Queue is paused');
      }

      if (queueStats.processing === 0 && queueStats.pending > 0) {
        issues.push('Jobs waiting but no workers processing');
      }

      if (queueStats.failed > queueStats.completed) {
        issues.push('More failed jobs than completed');
      }

      return {
        healthy: issues.length === 0,
        issues,
        stats: queueStats,
        isPaused,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
