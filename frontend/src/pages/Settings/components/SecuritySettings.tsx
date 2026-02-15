import { Lock, Key, Smartphone, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export function SecuritySettings() {
  return (
    <Card className="dark:border-gray-800 h-full">
      <CardHeader>
        <CardTitle>Security & Integrations</CardTitle>
        <CardDescription>Manage credentials and API keys.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Change Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input type="password" placeholder="Current Password" className="pl-10 mb-2" />
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input type="password" placeholder="New Password" className="pl-10" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm">Update Password</Button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telegram Bot Token</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input type="password" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" className="pl-10" />
          </div>
          <p className="text-xs text-gray-500">Required for mobile notifications.</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive summary reports.</p>
            </div>
          </div>
          <div className="h-6 w-11 bg-blue-600 rounded-full cursor-pointer relative">
            <div className="absolute top-1 right-1 h-4 w-4 bg-white rounded-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
