import { Play, Mail, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

export function QuickActions({ loading }: { loading?: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (loading) return null;

  const handleAutoApply = () => {
    toast.info('Auto-Apply feature coming soon!');
    // navigate('/jobs'); // Uncomment when ready
  };

  const handleColdEmails = () => {
    toast.info('Cold Email feature coming soon!');
    // navigate('/email'); // Uncomment when ready
  };

  const handleOptimizeResume = () => {
    navigate('/resumes');
  };

  const handleBotSettings = () => {
    navigate('/settings');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Perform common tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="primary" className="w-full justify-start" onClick={handleAutoApply}>
          <Play className="mr-2 h-4 w-4" /> Start Auto-Apply
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={handleColdEmails}>
          <Mail className="mr-2 h-4 w-4" /> Send Cold Emails
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={handleOptimizeResume}>
          <FileText className="mr-2 h-4 w-4" /> Optimize Resume
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={handleBotSettings}>
          <Settings className="mr-2 h-4 w-4" /> Bot Settings
        </Button>
      </CardContent>
    </Card>
  );
}
