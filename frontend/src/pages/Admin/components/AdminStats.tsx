import { useState, useEffect } from 'react';
import { Users, Building, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import apiClient from '../../../lib/api';

interface StatsResponse {
  total_users: number;
  active_teams: number;
  bot_runs: number;
  alerts: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<StatsResponse>('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Users
          </CardTitle>
          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.total_users?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Across platform
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Teams
          </CardTitle>
          <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.active_teams?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Registered organizations
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Global Bot Runs
          </CardTitle>
          <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.bot_runs?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total automation runs
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            System Alerts
          </CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats?.alerts || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Requires attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
