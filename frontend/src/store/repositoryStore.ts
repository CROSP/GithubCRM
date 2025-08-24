import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import {toast} from "sonner";

import githubService from "@/api/services/githubService";
import type {GitHubRepository, RepositoryFilters, RepositoryStatistics} from "@/types/github";

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

type RepositoryStore = {
    repositories: GitHubRepository[];
    statistics: RepositoryStatistics | null;
    currentPage: number;
    totalPages: number;
    total: number;
    filters: RepositoryFilters;
    isLoading: boolean;

    actions: {
        setRepositories: (repos: GitHubRepository[]) => void;
        addRepository: (repo: GitHubRepository) => void;
        updateRepository: (id: string, repo: Partial<GitHubRepository>) => void;
        removeRepository: (id: string) => void;
        setFilters: (filters: Partial<RepositoryFilters>) => void;
        setPagination: (page: number, totalPages: number, total: number) => void;
        setStatistics: (stats: RepositoryStatistics) => void;
        setLoading: (loading: boolean) => void;
        clearRepositories: () => void;
    };
};

const initialFilters: RepositoryFilters = {
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    syncStatus: undefined,
};

const useRepositoryStore = create<RepositoryStore>()(
    persist(
        (set, _) => ({
            repositories: [],
            statistics: null,
            currentPage: 1,
            totalPages: 1,
            total: 0,
            filters: initialFilters,
            isLoading: false,

            actions: {
                setRepositories: (repositories) => {
                    set({repositories});
                },
                addRepository: (repo) => {
                    set((state) => ({
                        repositories: [repo, ...state.repositories],
                        total: state.total + 1,
                    }));
                },
                updateRepository: (id, updatedRepo) => {
                    set((state) => ({
                        repositories: state.repositories.map((repo) =>
                            repo.id === id ? {...repo, ...updatedRepo} : repo
                        ),
                    }));
                },
                removeRepository: (id) => {
                    set((state) => ({
                        repositories: state.repositories.filter((repo) => repo.id !== id),
                        total: state.total - 1,
                    }));
                },
                setFilters: (newFilters) => {
                    set((state) => ({
                        filters: {...state.filters, ...newFilters},
                    }));
                },
                setPagination: (page, totalPages, total) => {
                    set({currentPage: page, totalPages, total});
                },
                setStatistics: (statistics) => {
                    set({statistics});
                },
                setLoading: (isLoading) => {
                    set({isLoading});
                },
                clearRepositories: () => {
                    set({
                        repositories: [],
                        statistics: null,
                        currentPage: 1,
                        totalPages: 1,
                        total: 0,
                        filters: initialFilters,
                    });
                },
            },
        }),
        {
            name: "repositoryStore",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                repositories: state.repositories,
                filters: state.filters,
            }),
        }
    )
);

// Selectors
export const useRepositories = () => useRepositoryStore((state) => state.repositories);
export const useRepositoryStatistics = () => useRepositoryStore((state) => state.statistics);
export const useRepositoryFilters = () => useRepositoryStore((state) => state.filters);
export const useRepositoryPagination = () => useRepositoryStore((state) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    total: state.total,
}));
export const useRepositoryLoading = () => useRepositoryStore((state) => state.isLoading);
export const useRepositoryActions = () => useRepositoryStore((state) => state.actions);

// React Query hooks
export const useRepositoriesQuery = () => {
    const filters = useRepositoryFilters();
    const {setRepositories, setPagination, setLoading} = useRepositoryActions();

    return useQuery({
        queryKey: ["repositories", filters],
        queryFn: async () => {
            setLoading(true);
            try {
                const response = await githubService.getRepositories(filters);
                setRepositories(response.repositories);
                setPagination(response.page, response.totalPages, response.total);
                return response;
            } finally {
                setLoading(false);
            }
        },
        retry: 3,
    });
};

export const useMyRepositoriesQuery = () => {
    const {setRepositories, setLoading} = useRepositoryActions();

    return useQuery({
        queryKey: ["repositories", "mine"],
        queryFn: async () => {
            setLoading(true);
            try {
                const repositories = await githubService.getMyRepositories();
                setRepositories(repositories);
                return repositories;
            } finally {
                setLoading(false);
            }
        },
    });
};

export const useRepositoryStatisticsQuery = () => {
    const {setStatistics, setLoading} = useRepositoryActions();

    return useQuery({
        queryKey: ["repository-statistics"],
        queryFn: async () => {
            setLoading(true);
            try {
                const response = await githubService.getRepositoryStatistics();
                setStatistics(response);
                return response;
            } finally {
                setLoading(false);
            }
        },
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

export const useAddRepositoryMutation = () => {
    const { addRepository } = useRepositoryActions();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: githubService.addRepository,
        onSuccess: (data) => {
            // Update local store (optimistic update)
            addRepository(data);
            toast.success("Repository added successfully!");

            // Invalidate and refetch repositories query
            queryClient.invalidateQueries({
                queryKey: ["repositories"]
            });

            // Also invalidate statistics if needed
            queryClient.invalidateQueries({
                queryKey: ["repository-statistics"]
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add repository");
        },
    });
};

export const useUpdateRepositoryMutation = () => {
    const { updateRepository } = useRepositoryActions();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateRepositoryRequest }) => {
            return await githubService.updateRepository(id, data);
        },
        onSuccess: (updatedRepo) => {
            // Update local store (optimistic update)
            updateRepository(updatedRepo.id, updatedRepo);
            toast.success("Repository updated successfully");

            // Invalidate queries to ensure fresh data
            queryClient.invalidateQueries({
                queryKey: ["repositories"]
            });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update repository");
        },
    });
};

export const useDeleteRepositoryMutation = () => {
    const { removeRepository } = useRepositoryActions();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: githubService.deleteRepository,
        onSuccess: (_, id) => {
            // Update local store (optimistic update)
            removeRepository(id);
            toast.success("Repository deleted successfully!");

            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({
                queryKey: ["repositories"]
            });

            // Also invalidate statistics
            queryClient.invalidateQueries({
                queryKey: ["repository-statistics"]
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete repository");
        },
    });
};

export const useSyncRepositoryMutation = () => {
    const { updateRepository } = useRepositoryActions();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: githubService.requestSync,
        onSuccess: (data) => {
            // Update local store (optimistic update)
            updateRepository(data.repositoryId, { syncStatus: data.syncStatus });
            toast.success("Sync requested successfully!");

            // Invalidate repositories query to get updated sync status
            queryClient.invalidateQueries({
                queryKey: ["repositories"]
            });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to request sync");
        },
    });
};
export default useRepositoryStore;