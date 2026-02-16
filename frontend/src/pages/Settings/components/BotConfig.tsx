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
    <Card className="dark:border-gray-800">
      <CardHeader>
        <CardTitle>Bot Configuration</CardTitle>
        <CardDescription>Manage automation rules and limits.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Application Limit</label>
          <div className="relative">
            <Zap className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input type="number" placeholder="50" className="pl-10" />
          </div>
          <p className="text-xs text-gray-500">Maximum applications per 24h cycle.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Keywords</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input placeholder="React, Python, Remote..." className="pl-10" />
          </div>
          <p className="text-xs text-gray-500">Comma separated keywords for job search.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="bot-schedule" className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <select id="bot-schedule" className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900">
                <option>Every 6 Hours</option>
                <option>Daily at 9 AM</option>
                <option>Continuous</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="resume-template" className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume Template</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <select id="resume-template" className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900">
                <option>Standard Modern</option>
                <option>Tech Minimalist</option>
                <option>Creative Bold</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
