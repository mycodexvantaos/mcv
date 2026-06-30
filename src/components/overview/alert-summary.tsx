"use client";

import { AlertTriangle, ShieldAlert, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/types/dashboard";

interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  source: string;
  time: string;
}

const mockAlerts: AlertItem[] = [
  {
    id: "1",
    severity: "critical",
    title: "Edge node eu-central-1 unreachable",
    source: "Edge Monitor",
    time: "5m ago",
  },
  {
    id: "2",
    severity: "high",
    title: "PostgreSQL connection pool at 85%",
    source: "Connector Health",
    time: "12m ago",
  },
  {
    id: "3",
    severity: "medium",
    title: "Model gemini-2.5-flash latency elevated",
    source: "Inference Monitor",
    time: "30m ago",
  },
  {
    id: "4",
    severity: "low",
    title: "Governance policy review pending",
    source: "Governance Engine",
    time: "2h ago",
  },
  {
    id: "5",
    severity: "low",
    title: "API key rotation scheduled for next week",
    source: "Security Scanner",
    time: "1d ago",
  },
];

const severityConfig: Record<Severity, { icon: typeof AlertTriangle; color: string; bg: string }> =
  {
    critical: { icon: XCircle, color: "text-status-critical", bg: "bg-status-critical/10" },
    high: { icon: ShieldAlert, color: "text-status-critical", bg: "bg-status-critical/10" },
    medium: { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10" },
    low: { icon: Info, color: "text-status-idle", bg: "bg-status-idle/10" },
  };

export function AlertSummary() {
  const counts = {
    critical: mockAlerts.filter((a) => a.severity === "critical").length,
    high: mockAlerts.filter((a) => a.severity === "high").length,
    medium: mockAlerts.filter((a) => a.severity === "medium").length,
    low: mockAlerts.filter((a) => a.severity === "low").length,
  };

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="flex gap-4">
        {(["critical", "high", "medium", "low"] as Severity[]).map((severity) => {
          const config = severityConfig[severity];
          const Icon = config.icon;
          return (
            <div
              key={severity}
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${config.bg}`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <div>
                <p className="text-lg font-bold font-headline">{counts[severity]}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">
                  {severity}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent alerts */}
      <div className="space-y-2">
        {mockAlerts.slice(0, 3).map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-2 p-2 rounded-md hover:bg-secondary/50"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{alert.title}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.source} · {alert.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
