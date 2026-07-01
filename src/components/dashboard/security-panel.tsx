'use client';

import { useState } from 'react';
import { ShieldAlert, Loader2, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { scanForVulnerabilities } from '@/ai/client-stubs';
import { packageJsonContent } from '@/lib/project-files';
import { useConnectivity } from '@/lib/connectivity-manager';

type Vulnerability = {
  id: string;
  packageName: string;
  version: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cve: string;
  description: string;
  remediation: string;
  engine?: string;
};

export function SecurityPanel() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [auditMode, setAuditMode] = useState<'connected' | 'native' | null>(null);

  const { mode } = useConnectivity();

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanCompleted(false);
    setVulnerabilities([]);

    try {
      const result = await scanForVulnerabilities({
        packageJsonContent,
        isOffline: mode === 'native',
      });
      setVulnerabilities(result.vulnerabilities);
      setAuditMode((result.auditMode as 'connected' | 'native') ?? null);
    } catch (error: any) {
      console.error('Error scanning for vulnerabilities:', error);
    } finally {
      setIsScanning(false);
      setScanCompleted(true);
    }
  };

  const getSeverityBadge = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'High':
        return (
          <Badge variant="destructive" className="bg-red-700">
            High
          </Badge>
        );
      case 'Medium':
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-black">
            Medium
          </Badge>
        );
      case 'Low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="flex h-full flex-col bg-background/50">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Security Audit (Layer C)
        </h2>
        {auditMode && (
          <Badge
            variant="outline"
            className={`text-[8px] h-4 ${auditMode === 'native' ? 'text-accent border-accent/20' : 'text-primary border-primary/20'}`}
          >
            {auditMode === 'native' ? 'SOVEREIGN NATIVE' : 'CLOUD ENHANCED'}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Button
          onClick={handleRunScan}
          disabled={isScanning}
          className="w-full h-11 gap-2 font-bold text-[10px] uppercase primary-glow"
        >
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {isScanning ? '正在執行全棧安全性掃描...' : '啟動 Era-3 深度弱點審計'}
        </Button>

        {scanCompleted && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            {auditMode === 'native' && (
              <div className="mb-4 p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3">
                <Zap className="h-5 w-5 text-accent animate-pulse" />
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest leading-relaxed">
                  [主權防護啟動] 雲端分析暫時不可用，已自動切換至「原生審計內核」。
                </p>
              </div>
            )}

            {vulnerabilities.length === 0 ? (
              <Alert className="bg-primary/5 border-primary/20">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-bold uppercase tracking-widest">
                  Audit Complete
                </AlertTitle>
                <AlertDescription className="text-[11px] text-muted-foreground">
                  未偵測到已知弱點。您的專案語義符合 Era-3 P3 穩定性基準。
                </AlertDescription>
              </Alert>
            ) : (
              <Card className="bg-card/30 border-border/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    偵測到 {vulnerabilities.length} 項安全性風險
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {vulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="p-3 border border-white/5 rounded-xl bg-black/20 group hover:border-accent/30 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-xs text-foreground/90">
                            {vuln.packageName}@{vuln.version}
                          </p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                            {vuln.cve}
                          </p>
                        </div>
                        {getSeverityBadge(vuln.severity)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                        {vuln.description}
                      </p>
                      <div className="p-2 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-[10px] text-accent font-bold uppercase tracking-widest">
                          建議修復方案:
                        </p>
                        <p className="text-[10px] text-accent/80 font-code">{vuln.remediation}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card/20">
        <div className="flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-white/5"></div>
          <span className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-widest">
            ERA-3 | C-LAYER SECURITY
          </span>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>
      </div>
    </div>
  );
}
