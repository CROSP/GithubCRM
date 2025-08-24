import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GitHubRepositoryData,
  IGitHubApiService,
} from '@core/services/github-api.service.interface';
import {
  GitHubApiException,
  GitHubApiRateLimitException,
  GitHubRepositoryNotFoundException,
} from '@core/exceptions/github-exceptions';

@Injectable()
export class GitHubApiService implements IGitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);
  private readonly baseUrl: string;
  private readonly authToken?: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('GITHUB_API_BASE_URL', 'https://api.github.com');
    this.authToken = this.configService.get<string>('GITHUB_API_TOKEN');
  }

  async validateRepositoryExists(owner: string, repository: string): Promise<boolean> {
    try {
      await this.getRepositoryData(owner, repository);
      return true;
    } catch (error) {
      if (error instanceof GitHubRepositoryNotFoundException) {
        return false;
      }
      throw error;
    }
  }

  async getRepositoryData(owner: string, repository: string): Promise<GitHubRepositoryData> {
    const url = `${this.baseUrl}/repos/${owner}/${repository}`;

    try {
      const response = await this.makeApiRequest(url);

      if (response.status === 404) {
        throw new GitHubRepositoryNotFoundException(`${owner}/${repository}`);
      }

      if (!response.ok) {
        throw new GitHubApiException(
          `Failed to fetch repository data: ${response.statusText}`,
          response.status,
        );
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        owner: {
          login: data.owner.login,
          id: data.owner.id,
          type: data.owner.type,
        },
        htmlUrl: data.html_url,
        stargazersCount: data.stargazers_count,
        forksCount: data.forks_count,
        openIssuesCount: data.open_issues_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        pushedAt: data.pushed_at,
        language: data.language,
        topics: data.topics || [],
        archived: data.archived,
        disabled: data.disabled,
        visibility: data.visibility,
      };
    } catch (error) {
      if (
        error instanceof GitHubRepositoryNotFoundException ||
        error instanceof GitHubApiException
      ) {
        throw error;
      }

      this.logger.error(`Failed to fetch repository data for ${owner}/${repository}`, error);
      throw new GitHubApiException(`Network error: ${error.message}`);
    }
  }

  async getRepositoriesData(
    repositories: { owner: string; repository: string }[],
  ): Promise<GitHubRepositoryData[]> {
    const promises = repositories.map(repo =>
      this.getRepositoryData(repo.owner, repo.repository).catch(error => {
        this.logger.warn(
          `Failed to fetch data for ${repo.owner}/${repo.repository}: ${error.message}`,
        );

        return null;
      }),
    );

    const results = await Promise.all(promises);

    return results.filter((data): data is GitHubRepositoryData => data !== null);
  }

  async getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetTime: Date;
  }> {
    const url = `${this.baseUrl}/rate_limit`;

    try {
      const response = await this.makeApiRequest(url);
      const data = await response.json();

      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetTime: new Date(data.rate.reset * 1000),
      };
    } catch (error) {
      this.logger.error('Failed to fetch rate limit information', error);
      throw new GitHubApiException(`Failed to fetch rate limit: ${error.message}`);
    }
  }

  async searchRepositories(
    query: string,
    options?: {
      sort?: 'stars' | 'forks' | 'updated';
      order?: 'desc' | 'asc';
      perPage?: number;
      page?: number;
    },
  ): Promise<{
    items: GitHubRepositoryData[];
    totalCount: number;
  }> {
    const searchParams = new URLSearchParams({
      q: query,
      sort: options?.sort || 'stars',
      order: options?.order || 'desc',
      per_page: (options?.perPage || 30).toString(),
      page: (options?.page || 1).toString(),
    });

    const url = `${this.baseUrl}/search/repositories?${searchParams}`;

    try {
      const response = await this.makeApiRequest(url);
      const data = await response.json();

      return {
        items: data.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          fullName: item.full_name,
          description: item.description,
          owner: {
            login: item.owner.login,
            id: item.owner.id,
            type: item.owner.type,
          },
          htmlUrl: item.html_url,
          stargazersCount: item.stargazers_count,
          forksCount: item.forks_count,
          openIssuesCount: item.open_issues_count,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          pushedAt: item.pushed_at,
          language: item.language,
          topics: item.topics || [],
          archived: item.archived,
          disabled: item.disabled,
          visibility: item.visibility,
        })),
        totalCount: data.total_count,
      };
    } catch (error) {
      this.logger.error(`Failed to search repositories with query: ${query}`, error);
      throw new GitHubApiException(`Search failed: ${error.message}`);
    }
  }

  private async makeApiRequest(url: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Repository-CRM/1.0',
    };

    if (this.authToken) {
      headers['Authorization'] = `token ${this.authToken}`;
    }

    const response = await fetch(url, { headers });

    // Check for rate limit
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');

      if (rateLimitRemaining === '0' && rateLimitReset) {
        const resetTime = new Date(parseInt(rateLimitReset) * 1000);
        throw new GitHubApiRateLimitException(resetTime);
      }
    }

    return response;
  }
}
