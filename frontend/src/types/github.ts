export type SyncStatus = "pending" | "in_progress" | "completed" | "failed";
export type SortField = "createdAt" | "stars" | "forks" | "name" | "lastSync";
export type SortOrder = "asc" | "desc";

export interface GitHubRepository {
    /** Repository ID */
    id: string;
    /** GitHub repository path (e.g., "facebook/react") */
    githubPath: string;
    /** Repository URL */
    repositoryUrl: string;
    /** Repository name */
    name: string;
    /** Repository description */
    description: string | null;
    /** Repository owner */
    owner: string;
    /** Number of stars */
    stars: number;
    /** Number of forks */
    forks: number;
    /** Number of open issues */
    openIssues: number;
    /** Synchronization status */
    syncStatus: SyncStatus;
    /** Last synchronization timestamp */
    lastSyncAt: string | null;
    /** Synchronization error message */
    syncError: string | null;
    /** ID of the user who added this repository */
    addedByUserId: string;
    /** Repository creation date on GitHub */
    createdAtGitHub: string | null;
    /** GitHub creation timestamp (Unix) */
    createdAtGitHubUnix: number | null;
    /** When the repository was added to our system */
    createdAt: string;
    /** Last update timestamp */
    updatedAt: string;
    /** Whether the repository needs synchronization */
    needsSync: boolean;
    /** Whether sync is currently in progress */
    isBeingSync: boolean;
}

export interface RepositoryListResponse {
    /** List of repositories */
    repositories: GitHubRepository[];
    /** Total number of repositories */
    total: number;
    /** Current page number */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of pages */
    totalPages: number;
}

export interface RepositoryStatistics {
    /** Total number of repositories */
    totalRepositories: number;
    /** Number of repositories pending sync */
    pendingSync: number;
    /** Number of repositories with failed sync */
    failedSync: number;
    /** Number of repositories with completed sync */
    completedSync: number;
    /** Total stars across all repositories */
    totalStars: number;
    /** Total forks across all repositories */
    totalForks: number;
}

export interface AddRepositoryRequest {
    /** GitHub repository path in format "owner/repository" */
    githubPath: string;
}

export interface UpdateRepositoryRequest {
    /** Number of stars */
    stars?: number;
    /** Number of forks */
    forks?: number;
    /** Number of open issues */
    openIssues?: number;
    /** Repository description */
    description?: string;
}

export interface SyncRequestResponse {
    /** Repository ID */
    repositoryId: string;
    /** GitHub repository path */
    githubPath: string;
    /** Sync status after request */
    syncStatus: SyncStatus;
    /** Message about the sync request */
    message: string;
    /** When the sync was requested */
    requestedAt: string;
}

export interface RepositoryFilters {
    /** Page number (default: 1) */
    page?: number;
    /** Items per page (default: 10, max: 100) */
    limit?: number;
    /** Search term for repository name, owner, or description */
    search?: string;
    /** Sort field */
    sortBy?: SortField;
    /** Sort order */
    sortOrder?: SortOrder;
    /** Filter by sync status */
    syncStatus?: SyncStatus;
}

// UI-specific types
export interface RepositoryTableColumn {
    key: keyof GitHubRepository | 'actions';
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface RepositoryFormData {
    githubPath: string;
}

export interface RepositoryCardProps {
    repository: GitHubRepository;
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
    onSync: (id: string) => void;
}

export interface RepositoryActionsProps {
    repository: GitHubRepository;
    onUpdate: (repository: GitHubRepository) => void;
    onDelete: (id: string) => void;
    onSync: (id: string) => void;
}

// Error types
export interface GitHubError {
    status: number;
    message: string;
    details?: string;
}

// API Response wrapper
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: number;
}

// Chart data for statistics
export interface StatisticsChartData {
    name: string;
    value: number;
    color?: string;
}

// Table sorting state
export interface TableSortState {
    field: SortField | null;
    order: SortOrder;
}

// Repository view modes
export type ViewMode = 'table' | 'cards' | 'list';

// Search and filter state
export interface SearchState {
    query: string;
    filters: RepositoryFilters;
    viewMode: ViewMode;
}

export default GitHubRepository;