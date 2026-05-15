'use client';

import { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  User,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/types/dashboard';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: Role;
  actorIp: string;
  action: string;
  resourceType: string;
  resourceName: string;
  changes: string;
  governanceApproved: boolean;
  governanceApprovedBy: string | null;
}

const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'a1',
    timestamp: '2025-05-04T22:15:00Z',
    actorEmail: 'admin@autoecoops.io',
    actorRole: 'super_admin',
    actorIp: '203.0.113.42',
    action: 'connector.update',
    resourceType: 'connector',
    resourceName: 'Redis Cache Cluster',
    changes: 'maxConnections: 50 → 100',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
  {
    id: 'a2',
    timestamp: '2025-05-04T21:45:00Z',
    actorEmail: 'operator@autoecoops.io',
    actorRole: 'operator',
    actorIp: '203.0.113.55',
    action: 'edge.deploy',
    resourceType: 'edge_node',
    resourceName: 'ap-southeast-1',
    changes: 'version: v2.3.8 → v2.4.1',
    governanceApproved: true,
    governanceApprovedBy: 'admin@autoecoops.io',
  },
  {
    id: 'a3',
    timestamp: '2025-05-04T20:30:00Z',
    actorEmail: 'admin@autoecoops.io',
    actorRole: 'admin',
    actorIp: '203.0.113.42',
    action: 'scenario.create',
    resourceType: 'scenario_matrix',
    resourceName: 'Healthcare AI Diagnostics',
    changes: 'Created new scenario matrix',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
  {
    id: 'a4',
    timestamp: '2025-05-04T18:20:00Z',
    actorEmail: 'system',
    actorRole: 'operator',
    actorIp: '10.0.0.1',
    action: 'security.scan',
    resourceType: 'system',
    resourceName: 'Full Vulnerability Scan',
    changes: 'Scan completed — 0 vulnerabilities',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
  {
    id: 'a5',
    timestamp: '2025-05-04T16:10:00Z',
    actorEmail: 'admin@autoecoops.io',
    actorRole: 'admin',
    actorIp: '203.0.113.42',
    action: 'inference.routing_update',
    resourceType: 'model_routing',
    resourceName: 'gemini-2.5-flash',
    changes: 'weight: 0.4 → 0.5, priority: 1 → 1',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
  {
    id: 'a6',
    timestamp: '2025-05-04T14:05:00Z',
    actorEmail: 'operator@autoecoops.io',
    actorRole: 'operator',
    actorIp: '203.0.113.55',
    action: 'edge.rollback',
    resourceType: 'edge_node',
    resourceName: 'eu-central-1-primary',
    changes: 'version: v2.4.1 → v2.4.0',
    governanceApproved: true,
    governanceApprovedBy: 'admin@autoecoops.io',
  },
  {
    id: 'a7',
    timestamp: '2025-05-04T10:30:00Z',
    actorEmail: 'admin@autoecoops.io',
    actorRole: 'super_admin',
    actorIp: '203.0.113.42',
    action: 'connector.create',
    resourceType: 'connector',
    resourceName: 'S3 Document Storage',
    changes: 'Created new connector',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
  {
    id: 'a8',
    timestamp: '2025-05-03T22:00:00Z',
    actorEmail: 'system',
    actorRole: 'operator',
    actorIp: '10.0.0.1',
    action: 'connector.health_check',
    resourceType: 'connector',
    resourceName: 'All Connectors',
    changes: 'Scheduled health check completed',
    governanceApproved: true,
    governanceApprovedBy: 'system',
  },
];

const roleColors: Record<Role, string> = {
  super_admin: 'bg-chart-3/20 text-chart-3',
  admin: 'bg-chart-1/20 text-chart-1',
  operator: 'bg-chart-4/20 text-chart-4',
  viewer: 'bg-chart-5/20 text-chart-5',
};

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLog = mockAuditLog.filter((entry) => {
    if (
      searchQuery &&
      !entry.action.includes(searchQuery) &&
      !entry.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !entry.actorEmail.includes(searchQuery)
    )
      return false;
    if (filterAction !== 'all' && !entry.action.startsWith(filterAction)) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Governance Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete audit log of all administrative actions with governance enforcement
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> Export Audit Log
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, resource, or actor..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="connector">Connector</SelectItem>
                <SelectItem value="edge">Edge Deploy</SelectItem>
                <SelectItem value="scenario">Scenario</SelectItem>
                <SelectItem value="inference">Inference</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Actor
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Resource
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Changes
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                    Governance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{entry.actorEmail}</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-4 ${roleColors[entry.actorRole]}`}
                        >
                          {entry.actorRole}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono h-5">
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-xs font-medium">{entry.resourceName}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.resourceType}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                      {entry.changes}
                    </td>
                    <td className="py-3 px-4">
                      {entry.governanceApproved ? (
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-status-healthy" />
                          <span className="text-[10px] text-status-healthy">Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-status-critical" />
                          <span className="text-[10px] text-status-critical">Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {filteredLog.length} of {mockAuditLog.length} entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">Page 1 of 1</span>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
