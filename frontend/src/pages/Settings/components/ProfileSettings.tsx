import { User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function ProfileSettings() {
  const navigate = useNavigate();

  return (
    <Card className="border-gray-200/80 dark:border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold">Profile Information</CardTitle>
        <CardDescription>Manage your full candidate profile from the dedicated profile section.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4" />
            Profile updates affect your generated documents and emails.
          </div>
          <Button variant="primary" className="rounded-xl" onClick={() => navigate('/profile')}>
            Open Profile
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
