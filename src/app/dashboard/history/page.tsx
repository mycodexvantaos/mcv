import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitCommit, History, ArrowRight } from 'lucide-react';

export default function HistoryPage() {
  const auditLogs = [
    {
      type: 'Architecture Sync',
      commit: 'a8f2c1d',
      message: 'Updated database topology to multi-region read replicas',
      time: '2 hours ago',
      status: 'Synced',
    },
    {
      type: 'Pipeline Gen',
      commit: '3e4b9f2',
      message: 'Generated CI/CD for staging environment with auto-rollback',
      time: '5 hours ago',
      status: 'Validated',
    },
    {
      type: 'Risk Audit',
      commit: '9c1d2e3',
      message: 'Meticulous analysis detected potential deadlock in Orders Service',
      time: '1 day ago',
      status: 'Reported',
    },
    {
      type: 'Policy Change',
      commit: 'b2a5f6c',
      message: 'Enforced mandatory code coverage > 95% policy',
      time: '2 days ago',
      status: 'Active',
    },
    {
      type: 'Refinement',
      commit: 'f4d7b1a',
      message: 'Applied suggestion: API Gateway rate-limiting pattern',
      time: '3 days ago',
      status: 'Applied',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold font-headline">Audit Trail</h1>
        <p className="text-muted-foreground">
          Complete history of system changes and AI interventions.
        </p>
      </div>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">GitLab History Integration</CardTitle>
            <CardDescription>Live feed from repository master branch.</CardDescription>
          </div>
          <History className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="relative border-l-2 border-border/40 ml-4 space-y-8 pb-4">
            {auditLogs.map((log, i) => (
              <div key={i} className="relative pl-8">
                <div className="absolute left-[-9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {log.type}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-border/60">
                      <GitCommit className="mr-1 h-3 w-3" /> {log.commit}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">{log.time}</span>
                  </div>
                  <h3 className="text-sm font-medium">{log.message}</h3>
                  <div className="flex items-center gap-2 pt-1">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${log.status === 'Synced' || log.status === 'Validated' ? 'bg-accent' : 'bg-primary'}`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                      {log.status}
                    </span>
                    <button className="text-[10px] text-primary hover:underline flex items-center gap-1 ml-4">
                      View Diff <ArrowRight className="h-2 w-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
