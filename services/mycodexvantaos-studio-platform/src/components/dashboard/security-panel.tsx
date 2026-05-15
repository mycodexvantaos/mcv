'use client';

import { useState } from 'react';
import { ShieldAlert, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { scanForVulnerabilities } from '@/ai/flows/vulnerability-scanner-flow';
import { packageJsonContent } from '@/lib/project-files';

type Vulnerability = {
  id: string;
  packageName: string;
  version: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cve: string;
  description: string;
  remediation: string;
};

export function SecurityPanel() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanCompleted(false);
    setVulnerabilities([]);

    try {
      const result = await scanForVulnerabilities({ packageJsonContent });
      setVulnerabilities(result.vulnerabilities);
    } catch (error) {
      console.error('Error scanning for vulnerabilities:', error);
      // In a real app, you'd show a toast or error message
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
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
          Security
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Button onClick={handleRunScan} disabled={isScanning} className="w-full">
          {isScanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="mr-2 h-4 w-4" />
          )}
          {isScanning ? 'Scanning for vulnerabilities...' : 'Run Deep Vulnerability Scan'}
        </Button>

        {scanCompleted && vulnerabilities.length === 0 && !isScanning && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Scan Complete</AlertTitle>
            <AlertDescription>
              No vulnerabilities found. Your project looks secure.
            </AlertDescription>
          </Alert>
        )}

        {scanCompleted && vulnerabilities.length > 0 && !isScanning && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                {vulnerabilities.length}{' '}
                {vulnerabilities.length === 1 ? 'vulnerability' : 'vulnerabilities'} found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="p-3 border rounded-lg bg-card/50">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-sm">
                      {vuln.packageName}@{vuln.version}
                    </p>
                    {getSeverityBadge(vuln.severity)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{vuln.cve}</p>
                  <p className="text-sm mb-2">{vuln.description}</p>
                  <p className="text-sm text-accent">{vuln.remediation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
