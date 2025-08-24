import React from "react";
import { GitFork, Star, AlertCircle, CheckCircle, Clock, Database } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card.tsx";
import { Skeleton } from "@/ui/skeleton.tsx";
import { Progress } from "@/ui/progress.tsx";

import type { RepositoryStatistics } from "#/github.ts";
import githubService from "@/api/services/githubService.ts";

interface RepositoryStatisticsProps {
    statistics: RepositoryStatistics | null | undefined;
}

const RepositoryStatistics: React.FC<RepositoryStatisticsProps> = ({ statistics }) => {
    if (!statistics) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px] mb-2" />
                            <Skeleton className="h-3 w-[120px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const {
        totalRepositories,
        pendingSync,
        failedSync,
        completedSync,
        totalStars,
        totalForks,
    } = statistics;

    // Calculate sync completion percentage
    const totalSyncOperations = pendingSync + failedSync + completedSync;
    const syncCompletionRate = totalSyncOperations > 0
        ? Math.round((completedSync / totalSyncOperations) * 100)
        : 100;

    const statisticsCards = [
        {
            title: "Total Repositories",
            value: totalRepositories.toLocaleString(),
            description: "Repositories being tracked",
            icon: Database,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Total Stars",
            value: githubService.formatNumber(totalStars),
            description: "Across all repositories",
            icon: Star,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Total Forks",
            value: githubService.formatNumber(totalForks),
            description: "Across all repositories",
            icon: GitFork,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Completed Sync",
            value: completedSync.toLocaleString(),
            description: `${syncCompletionRate}% sync rate`,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            progress: syncCompletionRate,
        },
        {
            title: "Pending Sync",
            value: pendingSync.toLocaleString(),
            description: "Waiting for synchronization",
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            title: "Failed Sync",
            value: failedSync.toLocaleString(),
            description: "Require attention",
            icon: AlertCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
    ];

    return (
        <div className="space-y-4">
            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statisticsCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                                <p className="text-xs text-gray-500 mb-2">
                                    {stat.description}
                                </p>
                                {stat.progress !== undefined && (
                                    <div className="space-y-1">
                                        <Progress value={stat.progress} className="h-2" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Summary Card */}
            {totalRepositories > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Repository Health Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Sync Status Distribution */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-600">
                                    Sync Status Distribution
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
										<span className="text-sm text-gray-600 flex items-center">
											<CheckCircle className="h-3 w-3 mr-1 text-green-600" />
											Completed
										</span>
                                        <span className="text-sm font-medium">
											{completedSync} ({Math.round((completedSync / totalRepositories) * 100)}%)
										</span>
                                    </div>
                                    <div className="flex justify-between items-center">
										<span className="text-sm text-gray-600 flex items-center">
											<Clock className="h-3 w-3 mr-1 text-orange-600" />
											Pending
										</span>
                                        <span className="text-sm font-medium">
											{pendingSync} ({Math.round((pendingSync / totalRepositories) * 100)}%)
										</span>
                                    </div>
                                    <div className="flex justify-between items-center">
										<span className="text-sm text-gray-600 flex items-center">
											<AlertCircle className="h-3 w-3 mr-1 text-red-600" />
											Failed
										</span>
                                        <span className="text-sm font-medium">
											{failedSync} ({Math.round((failedSync / totalRepositories) * 100)}%)
										</span>
                                    </div>
                                </div>
                            </div>

                            {/* Average Stats */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-600">
                                    Average per Repository
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Stars</span>
                                        <span className="text-sm font-medium">
											{totalRepositories > 0
                                                ? githubService.formatNumber(Math.round(totalStars / totalRepositories))
                                                : "0"
                                            }
										</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Forks</span>
                                        <span className="text-sm font-medium">
											{totalRepositories > 0
                                                ? githubService.formatNumber(Math.round(totalForks / totalRepositories))
                                                : "0"
                                            }
										</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-600">
                                    Quick Insights
                                </h4>
                                <div className="space-y-2">
                                    {failedSync > 0 && (
                                        <div className="flex items-center text-sm text-red-600">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            {failedSync} repositories need attention
                                        </div>
                                    )}
                                    {pendingSync > 0 && (
                                        <div className="flex items-center text-sm text-orange-600">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {pendingSync} repositories syncing
                                        </div>
                                    )}
                                    {syncCompletionRate === 100 && (
                                        <div className="flex items-center text-sm text-green-600">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            All repositories synced
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RepositoryStatistics;