import { useState, useEffect } from 'react';
import { Users, Building, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import apiClient from '../../../lib/api';

interface StatsResponse {
  total_users: number;
  active_users: number;
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
      <Card className="border-gray-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            Total Users
          </CardTitle>
          <div className="rounded-full bg-sky-100 p-2 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {stats?.total_users?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Across platform
          </p>
        </CardContent>
      </Card>
      <Card className="border-gray-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            Active Users
          </CardTitle>
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Building className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {stats?.active_users?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Currently active accounts
          </p>
        </CardContent>
      </Card>
      <Card className="border-gray-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            Global Bot Runs
          </CardTitle>
          <div className="rounded-full bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {stats?.bot_runs?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total automation runs
          </p>
        </CardContent>
      </Card>
      <Card className="border-gray-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
            System Alerts
          </CardTitle>
          <div className="rounded-full bg-red-100 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black tracking-tight text-red-600 dark:text-red-400">
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
