import { Users, Mail, PlayCircle, Shield } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';

export function TeamStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Members</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">8</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Roles</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">3</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bots Running</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">12</h3>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow dark:border-gray-800">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invites</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">2</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
