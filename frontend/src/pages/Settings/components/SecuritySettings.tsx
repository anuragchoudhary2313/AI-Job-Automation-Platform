import { useState } from 'react';
import { Lock, Key, Smartphone, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export function SecuritySettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <Card className="h-full border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Security & Integrations</CardTitle>
        <CardDescription>Manage credentials and API keys.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Change Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input type="password" placeholder="Current Password" className="mb-2 h-11 rounded-xl pl-10" />
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <Input type="password" placeholder="New Password" className="h-11 rounded-xl pl-10" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="rounded-lg">Update Password</Button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Telegram Bot Token</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input type="password" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" className="h-11 rounded-xl pl-10" />
          </div>
          <p className="text-xs text-gray-500">Required for mobile notifications.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive summary reports.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsEnabled((prev) => !prev)}
            className={`relative h-6 w-11 rounded-full transition ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            aria-label="Toggle email notifications"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${notificationsEnabled ? 'right-1' : 'left-1'}`}
            />
          </button>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" className="rounded-xl">Save Security Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}
