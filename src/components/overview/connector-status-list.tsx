'use client';

import { Database, Github, HardDrive, Cloud, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConnectorType, ConnectorHealthStatus } from '@/types/connector';

interface ConnectorStatus {
  name: string;
  type: ConnectorType;
  status: ConnectorHealthStatus;
  latencyMs: number;
}

const mockConnectors: ConnectorStatus[] = [
  { name: 'Primary PostgreSQL', type: 'postgresql', status: 'connected', latencyMs: 3.2 },
  { name: 'Redis Cache', type: 'redis', status: 'connected', latencyMs: 0.8 },
  { name: 'GitHub Integration', type: 'github', status: 'connected', latencyMs: 45 },
  { name: 'S3 Storage', type: 's3', status: 'connected', latencyMs: 12 },
];

const connectorIcons: Record<ConnectorType, typeof Database> = {
  postgresql: Database,
  redis: HardDrive,
  github: Github,
  s3: Cloud,
  custom: Database,
};

const statusColors: Record<ConnectorHealthStatus, string> = {
  connected: 'text-status-healthy',
  degraded: 'text-status-warning',
  disconnected: 'text-status-critical',
  configuring: 'text-status-idle',
};

const statusBgColors: Record<ConnectorHealthStatus, string> = {
  connected: 'bg-status-healthy',
  degraded: 'bg-status-warning',
  disconnected: 'bg-status-critical',
  configuring: 'bg-status-idle',
};

export function ConnectorStatusList() {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-3">
        {mockConnectors.map((connector) => {
          const Icon = connectorIcons[connector.type];
          return (
            <div
              key={connector.name}
              className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{connector.name}</p>
                  <p className="text-xs text-muted-foreground">{connector.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono">
                  {connector.latencyMs}ms
                </span>
                <div className="flex items-center gap-1.5">
                  <Circle className={`h-2 w-2 fill-current ${statusColors[connector.status]}`} />
                  <span className={`text-xs ${statusColors[connector.status]}`}>
                    {connector.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
