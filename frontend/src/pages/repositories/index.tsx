import React, {useEffect, useState} from "react";
import {Edit3, ExternalLink, Plus, RotateCw, Search, Trash2} from "lucide-react";
import {Table} from "antd";
import type {ColumnsType} from "antd/es/table";

import {Button} from "@/ui/button";
import {Card, CardContent, CardHeader} from "@/ui/card";
import {Input} from "@/ui/input";
import {Badge} from "@/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/ui/select";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/ui/dropdown-menu";

import {
    useDeleteRepositoryMutation,
    useRepositoriesQuery,
    useRepositoryActions,
    useRepositoryFilters,
    useRepositoryLoading,
    useRepositoryPagination,
    useSyncRepositoryMutation,
} from "@/store/repositoryStore";
import type {GitHubRepository, SortField, SortOrder, SyncStatus} from "@/types/github";
import {useSearchWithDebounce} from "@/hooks/useDebounced";
import AddRepositoryForm from "./components/addRepositoryForm";
import ManualUpdateDialog from "./components/manualUpdateDialog";

const RepositoryList: React.FC = () => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedRepository, setSelectedRepository] = useState<GitHubRepository | null>(null);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

    // Enhanced search with debounce
    const {
        searchValue,
        debouncedValue: debouncedSearch,
        isSearching,
        setSearchValue,
        clearSearch
    } = useSearchWithDebounce("", 300);

    // Store state
    const filters = useRepositoryFilters();
    const {currentPage, total} = useRepositoryPagination();
    const isLoading = useRepositoryLoading();
    const {setFilters} = useRepositoryActions();

    // API calls
    const {data: repositoriesData, refetch} = useRepositoriesQuery();
    const deleteRepositoryMutation = useDeleteRepositoryMutation();
    const syncRepositoryMutation = useSyncRepositoryMutation();

    const repositories = repositoriesData?.repositories || [];

    // Update search filter when debounced value changes
    useEffect(() => {
        setFilters({search: debouncedSearch, page: 1});
    }, [debouncedSearch, setFilters]);

    const handleSort = (field: SortField) => {
        const newOrder: SortOrder =
            filters.sortBy === field && filters.sortOrder === "asc" ? "desc" : "asc";
        setFilters({sortBy: field, sortOrder: newOrder, page: 1});
    };

    const handlePageChange = (page: number) => {
        setFilters({page});
    };

    const handleSyncStatusFilter = (status: SyncStatus | "all") => {
        setFilters({
            syncStatus: status === "all" ? undefined : status,
            page: 1
        });
    };

    const getSortIcon = (field: SortField) => {
        if (filters.sortBy !== field) return "↕️";
        return filters.sortOrder === "asc" ? "↑" : "↓";
    };

    const getSyncStatusBadge = (status: SyncStatus) => {
        const variants = {
            pending: {variant: "secondary" as const, label: "Pending"},
            in_progress: {variant: "default" as const, label: "In Progress"},
            completed: {variant: "success" as const, label: "Completed"},
            failed: {variant: "destructive" as const, label: "Failed"},
        };

        const config = variants[status] || variants.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handleSyncRepository = async (id: string) => {
        try {
            await syncRepositoryMutation.mutateAsync(id);
        } catch (error) {
            console.error("Sync failed:", error);
        }
    };

    const handleDeleteRepository = async (id: string) => {
        try {
            await deleteRepositoryMutation.mutateAsync(id);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleManualUpdate = (repository: GitHubRepository) => {
        setSelectedRepository(repository);
        setIsUpdateDialogOpen(true);
    };

    const columns: ColumnsType<GitHubRepository> = [
        {
            title: (
                <span className="cursor-pointer hover:text-primary" onClick={() => handleSort("name")}>
          Repository {getSortIcon("name")}
        </span>
            ),
            dataIndex: "githubPath",
            key: "githubPath",
            render: (githubPath: string, record) => (
                <div className="flex items-center gap-2">
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-sm text-muted-foreground">{githubPath}</div>
                    </div>
                    <a
                        href={record.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                    >
                        <ExternalLink className="h-4 w-4"/>
                    </a>
                </div>
            ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (description: string | null) => (
                <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {description || "No description"}
        </span>
            ),
        },
        {
            title: (
                <span className="cursor-pointer hover:text-primary" onClick={() => handleSort("stars")}>
          Stars {getSortIcon("stars")}
        </span>
            ),
            dataIndex: "stars",
            key: "stars",
            align: "center",
            render: (stars: number) => stars.toLocaleString(),
        },
        {
            title: (
                <span className="cursor-pointer hover:text-primary" onClick={() => handleSort("forks")}>
          Forks {getSortIcon("forks")}
        </span>
            ),
            dataIndex: "forks",
            key: "forks",
            align: "center",
            render: (forks: number) => forks.toLocaleString(),
        },
        {
            title: "Issues",
            dataIndex: "openIssues",
            key: "openIssues",
            align: "center",
            render: (issues: number) => issues.toLocaleString(),
        },
        {
            title: (
                <span className="cursor-pointer hover:text-primary" onClick={() => handleSort("createdAt")}>
          Created {getSortIcon("createdAt")}
        </span>
            ),
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: "Status",
            dataIndex: "syncStatus",
            key: "syncStatus",
            render: (status: SyncStatus) => getSyncStatusBadge(status),
        },
        {
            title: "Actions",
            key: "actions",
            align: "right",
            render: (_, record) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            ⋮
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => handleSyncRepository(record.id)}
                            disabled={record.syncStatus === "in_progress"}
                        >
                            <RotateCw
                                className={`mr-2 h-4 w-4 ${record.syncStatus === "in_progress" ? "animate-spin" : ""}`}/>
                            {record.syncStatus === "in_progress" ? "Syncing..." : "Sync"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleManualUpdate(record)}
                        >
                            <Edit3 className="mr-2 h-4 w-4"/>
                            Manual Update
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDeleteRepository(record.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
                <p className="text-muted-foreground">
                    Manage and track your GitHub repositories
                </p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search repositories..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="pl-8"
                                />
                                {isSearching && (
                                    <div className="absolute right-2 top-2.5">
                                        <div
                                            className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    </div>
                                )}
                                {searchValue && !isSearching && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="absolute right-1 top-1 h-6 w-6 p-0"
                                        onClick={clearSearch}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                            <Select
                                value={filters.syncStatus || "all"}
                                onValueChange={(value) => handleSyncStatusFilter(value as SyncStatus | "all")}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Add Repository
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Repository</DialogTitle>
                                    </DialogHeader>
                                    <AddRepositoryForm onSuccess={() => setIsAddDialogOpen(false)}/>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                                <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}/>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table
                        columns={columns}
                        dataSource={repositories}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            current: currentPage,
                            total: total,
                            pageSize: filters.limit || 10,
                            onChange: handlePageChange,
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} repositories`,
                        }}
                    />
                </CardContent>
            </Card>

            {/* Manual Update Dialog */}
            <ManualUpdateDialog
                repository={selectedRepository}
                open={isUpdateDialogOpen}
                onOpenChange={setIsUpdateDialogOpen}
            />
        </div>
    );
};

export default RepositoryList;