import { User, Mail, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export function ProfileSettings() {
  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Profile Information</CardTitle>
        <CardDescription>Update your personal details and company info.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <Input placeholder="John" className="h-11 rounded-xl pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <Input placeholder="Doe" className="h-11 rounded-xl pl-10" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input placeholder="john@example.com" className="h-11 rounded-xl pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Company Name</label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input placeholder="Acme Inc." className="h-11 rounded-xl pl-10" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="text-xs text-gray-500 dark:text-gray-400">Profile updates affect your generated documents and emails.</p>
          <Button variant="primary" className="rounded-xl">Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
