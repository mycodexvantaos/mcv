'use client';

import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Activity,
  Database,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { useConnectorStore } from '@/lib/stores/connector-store';

interface StatusBarProps {
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export function StatusBar({
  isLeftPanelOpen,
  isRightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
}: StatusBarProps) {
  const { lastSync, overview } = useDashboardStore();
  const { connectors } = useConnectorStore();

  const healthyConnectors = connectors.filter((c) => c.status === 'connected').length;
  const totalConnectors = connectors.length || overview?.connectors.total || 0;
  const systemStatus = overview
    ? overview.connectors.degraded > 0 || overview.governance.recentViolations > 0
      ? 'degraded'
      : 'healthy'
    : 'idle';

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <footer className="flex items-center justify-between border-t border-border px-4 py-1 text-xs text-muted-foreground bg-secondary/20">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleLeftPanel}>
              {isLeftPanelOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Toggle Navigation</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1.5">
          {systemStatus === 'healthy' ? (
            <Wifi className="h-3 w-3 text-status-healthy" />
          ) : systemStatus === 'degraded' ? (
            <Activity className="h-3 w-3 text-status-warning" />
          ) : (
            <WifiOff className="h-3 w-3 text-status-idle" />
          )}
          <span className="capitalize">{systemStatus}</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>
            {healthyConnectors}/{totalConnectors} connectors
          </span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Sync: {formatLastSync(lastSync)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="h-5 text-[10px] font-mono">
          MyCodeXvantaOS v1.0.0
        </Badge>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleRightPanel}>
              {isRightPanelOpen ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Toggle AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
}
