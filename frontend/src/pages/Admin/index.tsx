import { AdminStats } from './components/AdminStats';
import { SystemHealth } from './components/SystemHealth';
import { UsersTable } from './components/UsersTable';

export default function Admin() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Console</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">System overview and management.</p>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Management</h2>
          <UsersTable />
        </div>
        <div>
          <SystemHealth />
        </div>
      </div>
    </div>
  );
}
