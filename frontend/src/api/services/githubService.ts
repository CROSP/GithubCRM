import apiClient from "../apiClient";
import type {
    GitHubRepository,
    RepositoryFilters,
    RepositoryListResponse,
    RepositoryStatistics,
    AddRepositoryRequest,
    UpdateRepositoryRequest,
    SyncRequestResponse
} from "@/types/github";

export enum GitHubApi {
    GetRepositories = "/repositories",
    GetMyRepositories = "/repositories/mine",
    GetRepositoryStatistics = "/repositories/statistics",
    GetRepository = "/repositories",
    AddRepository = "/repositories",
    UpdateRepository = "/repositories",
    DeleteRepository = "/repositories",
    RequestSync = "/repositories",
}

class GitHubService {
    /**
     * Get paginated list of repositories with optional search and filters
     */
    async getRepositories(filters: RepositoryFilters): Promise<RepositoryListResponse> {
        const params = new URLSearchParams();

        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
        if (filters.syncStatus) params.append("syncStatus", filters.syncStatus);

        const queryString = params.toString();
        const url = `${GitHubApi.GetRepositories}${queryString ? `?${queryString}` : ""}`;

        return apiClient.get<RepositoryListResponse>({ url });
    }

    /**
     * Get repositories added by the current user
     */
    async getMyRepositories(): Promise<GitHubRepository[]> {
        return apiClient.get<GitHubRepository[]>({ url: GitHubApi.GetMyRepositories });
    }

    /**
     * Get overall statistics about repositories in the system
     */
    async getRepositoryStatistics(): Promise<RepositoryStatistics> {
        return apiClient.get<RepositoryStatistics>({ url: GitHubApi.GetRepositoryStatistics });
    }

    /**
     * Get a specific repository by its ID
     */
    async getRepository(id: string): Promise<GitHubRepository> {
        return apiClient.get<GitHubRepository>({ url: `${GitHubApi.GetRepository}/${id}` });
    }

    /**
     * Add a new GitHub repository to track
     */
    async addRepository(data: AddRepositoryRequest): Promise<GitHubRepository> {
        return apiClient.post<GitHubRepository>({
            url: GitHubApi.AddRepository,
            data
        });
    }

    /**
     * Update repository statistics and description manually
     */
    async updateRepository(id: string, data: UpdateRepositoryRequest): Promise<GitHubRepository> {
        return apiClient.put<GitHubRepository>({
            url: `${GitHubApi.UpdateRepository}/${id}`,
            data
        });
    }

    /**
     * Delete a repository from tracking
     */
    async deleteRepository(id: string): Promise<void> {
        return apiClient.delete({ url: `${GitHubApi.DeleteRepository}/${id}` });
    }

    /**
     * Request synchronization with GitHub to update repository data
     */
    async requestSync(id: string): Promise<SyncRequestResponse> {
        return apiClient.post<SyncRequestResponse>({
            url: `${GitHubApi.RequestSync}/${id}/sync`
        });
    }

    /**
     * Validate GitHub repository path format
     */
    validateGitHubPath(path: string): boolean {
        const githubPathRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
        return githubPathRegex.test(path);
    }

    /**
     * Extract owner and repo name from GitHub path
     */
    parseGitHubPath(path: string): { owner: string; repo: string } | null {
        if (!this.validateGitHubPath(path)) {
            return null;
        }

        const [owner, repo] = path.split('/');
        return { owner, repo };
    }

    /**
     * Generate GitHub URL from path
     */
    generateGitHubUrl(path: string): string {
        return `https://github.com/${path}`;
    }

    /**
     * Format Unix timestamp to readable date
     */
    formatUnixTimestamp(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Get sync status display info
     */
    getSyncStatusInfo(status: string): {
        text: string;
        color: 'default' | 'secondary' | 'warning' | 'destructive'
    } {
        switch (status) {
            case 'pending':
                return { text: 'Pending', color: 'secondary' };
            case 'in_progress':
                return { text: 'Syncing...', color: 'warning' };
            case 'completed':
                return { text: 'Completed', color: 'default' };
            case 'failed':
                return { text: 'Failed', color: 'destructive' };
            default:
                return { text: 'Unknown', color: 'secondary' };
        }
    }

    /**
     * Format numbers for display (e.g., 1000 -> 1K)
     */
    formatNumber(num: number): string {
        if (num < 1000) return num.toString();
        if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
        if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
        return `${(num / 1000000000).toFixed(1)}B`;
    }
}

const githubService = new GitHubService();
export default githubService;