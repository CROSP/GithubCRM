export interface GitHubRepositoryData {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  owner: {
    login: string;
    id: number;
    type: string;
  };
  htmlUrl: string;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  pushedAt: string; // ISO date string
  language: string | null;
  topics: string[];
  archived: boolean;
  disabled: boolean;
  visibility: 'public' | 'private';
}

export interface IGitHubApiService {
  /**
   * Validate if a GitHub repository exists and is accessible
   */
  validateRepositoryExists(owner: string, repository: string): Promise<boolean>;

  /**
   * Get repository data from GitHub API
   */
  getRepositoryData(owner: string, repository: string): Promise<GitHubRepositoryData>;

  /**
   * Get multiple repositories data in batch
   */
  getRepositoriesData(
    repositories: { owner: string; repository: string }[],
  ): Promise<GitHubRepositoryData[]>;

  /**
   * Check rate limit status
   */
  getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetTime: Date;
  }>;

  /**
   * Search repositories on GitHub
   */
  searchRepositories(
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
  }>;
}
