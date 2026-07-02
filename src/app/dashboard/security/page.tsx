'use client';

import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const complianceItems = [
  { name: 'GDPR', status: 'compliant' as const, score: 98 },
  { name: 'HIPAA', status: 'compliant' as const, score: 95 },
  { name: 'SOC2 Type II', status: 'partial' as const, score: 82 },
  { name: 'ISO 27001', status: 'partial' as const, score: 76 },
  { name: 'PCI DSS', status: 'non-compliant' as const, score: 45 },
];

const secrets = [
  {
    name: 'PostgreSQL Connection String',
    lastRotated: '15 days ago',
    rotationSchedule: '30 days',
    status: 'healthy',
  },
  {
    name: 'Redis Auth Token',
    lastRotated: '8 days ago',
    rotationSchedule: '30 days',
    status: 'healthy',
  },
  {
    name: 'GitHub PAT',
    lastRotated: '45 days ago',
    rotationSchedule: '30 days',
    status: 'overdue',
  },
  {
    name: 'Gemini API Key',
    lastRotated: '22 days ago',
    rotationSchedule: '90 days',
    status: 'healthy',
  },
  {
    name: 'Cloudflare API Token',
    lastRotated: '5 days ago',
    rotationSchedule: '90 days',
    status: 'healthy',
  },
];

const complianceStatusColors = {
  compliant: 'text-status-healthy',
  partial: 'text-status-warning',
  'non-compliant': 'text-status-critical',
};

const complianceStatusBg = {
  compliant: 'bg-status-healthy/10',
  partial: 'bg-status-warning/10',
  'non-compliant': 'bg-status-critical/10',
};

export default function SecurityPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  const overallScore = Math.round(
    complianceItems.reduce((s, c) => s + c.score, 0) / complianceItems.length
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Security & Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vulnerability scanning, compliance tracking, and credential management
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleScan} disabled={isScanning}>
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="h-4 w-4" />
          )}
          {isScanning ? 'Scanning...' : 'Run Vulnerability Scan'}
        </Button>
      </div>

      {/* Security Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth="8"
                  strokeDasharray={`${overallScore * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold font-headline">{overallScore}</span>
              </div>
            </div>
            <p className="text-sm font-medium mt-2">Security Score</p>
            <p className="text-xs text-muted-foreground">Overall compliance posture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === 'compliant' ? (
                    <CheckCircle2 className="h-4 w-4 text-status-healthy" />
                  ) : item.status === 'partial' ? (
                    <AlertTriangle className="h-4 w-4 text-status-warning" />
                  ) : (
                    <XCircle className="h-4 w-4 text-status-critical" />
                  )}
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={item.score} className="h-1.5 w-16" />
                  <span className={`text-xs font-mono ${complianceStatusColors[item.status]}`}>
                    {item.score}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <RefreshCw className="h-4 w-4" /> Rotate All Overdue Secrets
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Shield className="h-4 w-4" /> Update Access Policies
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Lock className="h-4 w-4" /> Review Active Sessions
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
              <Key className="h-4 w-4" /> Manage API Keys
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secret Rotation Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Secret Rotation Tracker</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {secrets.filter((s) => s.status === 'overdue').length} overdue
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Secret
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Last Rotated
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Schedule
                  </th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {secrets.map((secret) => (
                  <tr key={secret.name} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-2.5 px-3 text-xs font-mono">{secret.name}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {secret.lastRotated}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {secret.rotationSchedule}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={secret.status === 'overdue' ? 'destructive' : 'outline'}
                        className="text-[10px] h-5"
                      >
                        {secret.status === 'overdue' ? '⚠ Overdue' : '✓ Healthy'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {scanComplete && (
        <Card className="bg-status-healthy/5 border-status-healthy/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-status-healthy" />
              <div>
                <p className="text-sm font-medium">Scan Complete — No New Vulnerabilities Found</p>
                <p className="text-xs text-muted-foreground">
                  Last scan completed just now. All connector configurations and deployment
                  manifests are secure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
