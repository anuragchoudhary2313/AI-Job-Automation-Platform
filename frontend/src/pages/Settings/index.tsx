import { ProfileSettings } from './components/ProfileSettings';
import { BotConfig } from './components/BotConfig';
import { SecuritySettings } from './components/SecuritySettings';

export function Settings() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and bot preferences.</p>
      </div>

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
