import { AdminStats } from './components/AdminStats';
import { SystemHealth } from './components/SystemHealth';
import { UsersTable } from './components/UsersTable';
import { DeadLettersAdmin } from './components/DeadLettersAdmin';
import { ShieldCheck, Users, Activity, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#f6fff8] via-[#f7fbff] to-[#fff8f2] p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
        <div className="absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Control Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Admin Console</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400 md:text-base">
              Oversee platform health, manage users, and keep automation infrastructure stable.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={() => navigate('/dashboard')}>
                Back to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/settings')}>
                Platform settings
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <Users className="mx-auto mb-1 h-4 w-4 text-sky-600 dark:text-sky-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">Manage</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <Activity className="mx-auto mb-1 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Health</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">Monitor</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Access</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">Secure</p>
            </div>
          </div>
        </div>
      </section>

      <AdminStats />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <UsersTable />
        </div>
        <div>
          <SystemHealth />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Dead-Letter Operations</h2>
        <DeadLettersAdmin />
      </div>
    </div>
  );
}
