import { Zap, Clock, FileText, Search, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

export function BotConfig() {
  const { toast } = useToast();

  const handleSave = () => {
    toast.success('Configuration saved successfully');
  };

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Bot Configuration</CardTitle>
        <CardDescription>Manage automation rules and limits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Daily Application Limit</label>
          <div className="relative">
            <Zap className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input type="number" placeholder="50" className="h-11 rounded-xl pl-10" />
          </div>
          <p className="text-xs text-gray-500">Maximum applications per 24h cycle.</p>
        </div>

        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Search Keywords</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
            <Input placeholder="React, Python, Remote..." className="h-11 rounded-xl pl-10" />
          </div>
          <p className="text-xs text-gray-500">Comma separated keywords for job search.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <label htmlFor="bot-schedule" className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Schedule</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <select id="bot-schedule" className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900">
                <option>Every 6 Hours</option>
                <option>Daily at 9 AM</option>
                <option>Continuous</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <label htmlFor="resume-template" className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Resume Template</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              <select id="resume-template" className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900">
                <option>Standard Modern</option>
                <option>Tech Minimalist</option>
                <option>Creative Bold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="text-xs text-gray-500 dark:text-gray-400">Changes apply to your next automation cycle.</p>
          <Button variant="primary" className="rounded-xl" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
