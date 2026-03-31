import { ProfileSettings } from './components/ProfileSettings';
import { BotConfig } from './components/BotConfig';
import { SecuritySettings } from './components/SecuritySettings';
import { SlidersHorizontal, ShieldCheck, Bot, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#f7fbff] via-[#f8fff7] to-[#fffaf2] p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-900/30" />
        <div className="absolute -bottom-10 left-8 h-40 w-40 rounded-full bg-lime-200/40 blur-3xl dark:bg-lime-900/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-800 dark:bg-gray-900 dark:text-cyan-300">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Personal Control Panel
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Settings</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400 md:text-base">
              Configure your profile, tune automation behavior, and secure integrations from one place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-xl" onClick={() => navigate('/jobs')}>
                Go to jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/dashboard')}>
                Back to dashboard
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <SlidersHorizontal className="mx-auto mb-1 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Profile</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Identity</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <Bot className="mx-auto mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Automation</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Rules</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 text-center dark:border-gray-700 dark:bg-gray-900/70">
              <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Security</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Access</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8 lg:col-span-2">
          <ProfileSettings />
          <BotConfig />
        </div>
        <div>
          <SecuritySettings />
        </div>
      </div>
    </div>
  );
}

export default Settings;
