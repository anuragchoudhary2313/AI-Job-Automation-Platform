import { Users, Building, Activity, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export function AdminStats() {
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">2,543</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +180 from last month
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">128</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +12% new teams
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">45,231</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +20% this week
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
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">3</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Requires attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
