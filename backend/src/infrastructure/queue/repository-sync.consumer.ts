import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { RepositorySyncJob } from '@core/services/repository-sync-queue.service.interface';
import { IGitHubApiService } from '@core/services/github-api.service.interface';
import { GitHubRepositoryService } from '@core/services/github-repository.service';
import { GITHUB_API_SERVICE } from '@shared/constants/tokens';

@Injectable()
@Processor('repository-sync')
export class RepositorySyncConsumer extends WorkerHost {
  private readonly logger = new Logger(RepositorySyncConsumer.name);

  constructor(
    @Inject(GITHUB_API_SERVICE)
    private readonly githubApiService: IGitHubApiService,
    private readonly repositoryService: GitHubRepositoryService,
  ) {
    super();
  }

  async process(job: Job<RepositorySyncJob>): Promise<any> {
    const { repositoryId, owner, repository: repoName, githubPath } = job.data;

    this.logger.log(`Starting sync for repository: ${githubPath} (${repositoryId})`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // Start the sync in our domain
      await this.repositoryService.startSync(repositoryId);
      await job.updateProgress(20);

      // Fetch data from GitHub API
      this.logger.log(`Fetching GitHub data for: ${owner}/${repoName}`);
      const githubData = await this.githubApiService.getRepositoryData(owner, repoName);
      await job.updateProgress(60);

      // Complete the sync with fetched data
      await this.repositoryService.completeSyncWithData(
        repositoryId,
        githubData.name,
        githubData.description,
        githubData.stargazersCount,
        githubData.forksCount,
        githubData.openIssuesCount,
        new Date(githubData.createdAt),
      );
      await job.updateProgress(100);

      this.logger.log(`Successfully synced repository: ${githubPath}`);

      return {
        repositoryId,
        githubPath,
        syncedAt: new Date(),
        stats: {
          stars: githubData.stargazersCount,
          forks: githubData.forksCount,
          openIssues: githubData.openIssuesCount,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to sync repository: ${githubPath}`, error);

      // Mark sync as failed in domain
      await this.repositoryService.failSync(repositoryId, error.message);

      throw error; // Re-throw to let BullMQ handle retries
    }
  }
}
