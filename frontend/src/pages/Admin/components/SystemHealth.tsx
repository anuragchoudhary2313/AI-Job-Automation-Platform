import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/ui/Toast';

interface ServiceStatus {
  name: string;
  status: 'Operational' | 'Degraded' | 'Downtime';
  uptime: string;
}

const initialServices: ServiceStatus[] = [
  { name: 'PostgreSQL Database', status: 'Operational', uptime: '99.98%' },
  { name: 'Redis Cache', status: 'Operational', uptime: '99.99%' },
  { name: 'Scraper Engine (Selenium)', status: 'Degraded', uptime: '98.50%' },
  { name: 'SMTP Email Service', status: 'Operational', uptime: '99.95%' },
  { name: 'OpenAI API Gateway', status: 'Downtime', uptime: '95.00%' },
];

const getRandomStatus = (): 'Operational' | 'Degraded' | 'Downtime' => {
  const rand = Math.random();
  if (rand > 0.9) return 'Downtime';
  if (rand > 0.7) return 'Degraded';
  return 'Operational';
};

export function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info('Refreshing system health...');

    // Simulate API call to refresh service statuses
    setTimeout(() => {
      const updatedServices = services.map(service => ({
        ...service,
        status: getRandomStatus(),
      }));
      setServices(updatedServices);
      setIsRefreshing(false);
      toast.success('System health updated!');
    }, 1000);
  };

  return (
    <Card className="dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">System Health</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time infrastructure status.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {service.status === 'Operational' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {service.status === 'Degraded' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {service.status === 'Downtime' && <XCircle className="h-5 w-5 text-red-500" />}
                <span className="font-medium text-gray-900 dark:text-gray-200">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{service.uptime}</span>
                <Badge variant={
                  service.status === 'Operational' ? 'success' :
                    service.status === 'Degraded' ? 'warning' : 'danger'
                }>
                  {service.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
