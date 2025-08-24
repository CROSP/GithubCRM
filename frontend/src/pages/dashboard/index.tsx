import { useRepositoryStatistics, useRepositoryStatisticsQuery } from '@/store/repositoryStore';
import RepositoryStatistics from './components/repositoryStatistics';

const Dashboard = () => {
    const statistics = useRepositoryStatistics();

    useRepositoryStatisticsQuery();

    return (
        <div className="container mx-auto p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Monitor and manage your GitHub repositories
                    </p>
                </div>

                <RepositoryStatistics statistics={statistics} />
            </div>
        </div>
    );
};

export default Dashboard;