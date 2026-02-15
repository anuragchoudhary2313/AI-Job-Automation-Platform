import { Skeleton } from './Skeleton';
import { Card, CardContent, CardHeader } from './Card';

export function ChartSkeleton() {
  return (
    <Card className="dark:border-gray-800">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-[140px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-sm"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
