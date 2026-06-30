"use client";

import { useEffect } from "react";
import {
  Brain,
  Network,
  Globe,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import { KpiCard } from "./kpi-card";
import { InferenceSparkline } from "./inference-sparkline";
import { ConnectorStatusList } from "./connector-status-list";
import { RecentActivityFeed } from "./recent-activity-feed";
import { AlertSummary } from "./alert-summary";

export function SystemOverview() {
  const { overview, isLoading, fetchOverview } = useDashboardStore();

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const kpis = overview
    ? [
        {
          title: "Inference Throughput",
          value: `${(overview.inference.throughput24h / 1000).toFixed(1)}K`,
          subtitle: "requests/24h",
          change: 12.5,
          status: "healthy" as const,
          icon: Brain,
        },
        {
          title: "Active Connectors",
          value: `${overview.connectors.healthy}/${overview.connectors.total}`,
          subtitle: `${overview.connectors.degraded} degraded`,
          change: 0,
          status: overview.connectors.degraded > 0 ? ("degraded" as const) : ("healthy" as const),
          icon: Network,
        },
        {
          title: "Edge Nodes Online",
          value: `${overview.edge.onlineNodes}/${overview.edge.totalNodes}`,
          subtitle: `${overview.edge.deployingNodes} deploying`,
          change: 5.2,
          status: "healthy" as const,
          icon: Globe,
        },
        {
          title: "Governance Score",
          value: `${overview.governance.complianceScore}%`,
          subtitle: `${overview.governance.pendingReviews} pending reviews`,
          change: -2.1,
          status:
            overview.governance.complianceScore >= 90 ? ("healthy" as const) : ("warning" as const),
          icon: ShieldCheck,
        },
      ]
    : [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">System Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time operational health of MyCodeXvantaOS infrastructure
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Activity className="h-3 w-3 text-status-healthy" />
          All Systems Operational
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inference Throughput (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <InferenceSparkline />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alert Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertSummary />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connector Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectorStatusList />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
