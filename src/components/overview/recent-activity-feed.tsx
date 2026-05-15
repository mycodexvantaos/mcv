'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  resource: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'deploy' | 'scan';
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    action: 'connector.health_check',
    actor: 'system',
    resource: 'Primary PostgreSQL',
    timestamp: '2 min ago',
    type: 'scan',
  },
  {
    id: '2',
    action: 'edge.deploy',
    actor: 'admin@autoecoops.io',
    resource: 'us-west-2 node',
    timestamp: '15 min ago',
    type: 'deploy',
  },
  {
    id: '3',
    action: 'connector.update',
    actor: 'admin@autoecoops.io',
    resource: 'Redis Cache config',
    timestamp: '1h ago',
    type: 'update',
  },
  {
    id: '4',
    action: 'scenario.create',
    actor: 'operator@autoecoops.io',
    resource: 'Healthcare AI Matrix',
    timestamp: '2h ago',
    type: 'create',
  },
  {
    id: '5',
    action: 'security.scan',
    actor: 'system',
    resource: 'Full vulnerability scan',
    timestamp: '3h ago',
    type: 'scan',
  },
  {
    id: '6',
    action: 'inference.routing_update',
    actor: 'admin@autoecoops.io',
    resource: 'Model routing weights',
    timestamp: '5h ago',
    type: 'update',
  },
  {
    id: '7',
    action: 'edge.rollback',
    actor: 'operator@autoecoops.io',
    resource: 'eu-central-1 node',
    timestamp: '8h ago',
    type: 'deploy',
  },
  {
    id: '8',
    action: 'connector.create',
    actor: 'admin@autoecoops.io',
    resource: 'S3 Storage connector',
    timestamp: '1d ago',
    type: 'create',
  },
];

const typeColors: Record<ActivityItem['type'], string> = {
  create: 'bg-chart-2/20 text-chart-2',
  update: 'bg-chart-1/20 text-chart-1',
  delete: 'bg-status-critical/20 text-status-critical',
  deploy: 'bg-chart-4/20 text-chart-4',
  scan: 'bg-chart-5/20 text-chart-5',
};

export function RecentActivityFeed() {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <Badge
              variant="secondary"
              className={`shrink-0 text-[10px] h-5 ${typeColors[activity.type]}`}
            >
              {activity.type}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                <span className="font-medium">{activity.resource}</span>
                <span className="text-muted-foreground"> — {activity.action}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activity.actor} · {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
