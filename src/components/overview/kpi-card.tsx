'use client';

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SystemStatus } from '@/types/dashboard';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  change: number;
  status: SystemStatus | 'warning';
  icon: LucideIcon;
}

const statusColors: Record<string, string> = {
  healthy: 'text-status-healthy',
  degraded: 'text-status-warning',
  critical: 'text-status-critical',
  idle: 'text-status-idle',
  warning: 'text-status-warning',
};

const statusBgColors: Record<string, string> = {
  healthy: 'bg-status-healthy/10',
  degraded: 'bg-status-warning/10',
  critical: 'bg-status-critical/10',
  idle: 'bg-status-idle/10',
  warning: 'bg-status-warning/10',
};

export function KpiCard({ title, value, subtitle, change, status, icon: Icon }: KpiCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md ${statusBgColors[status]}`}
          >
            <Icon className={`h-4 w-4 ${statusColors[status]}`} />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold font-headline">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          {change !== 0 && (
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-status-healthy' : 'text-status-critical'}`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
