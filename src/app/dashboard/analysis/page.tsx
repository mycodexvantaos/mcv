'use client';

import { useState } from 'react';
import {
  analyzeArchitectureForRisks,
  type AnalyzeArchitectureForRisksOutput,
} from '@/ai/client-stubs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchCheck, Loader2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeArchitectureForRisksOutput | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const output = await analyzeArchitectureForRisks({
        architectureDefinition:
          'Microservices architecture with Node.js services communicating via Kafka and a centralized Postgres database.',
        ciCdPipelineConfig:
          'build: stage: build script: - npm install deploy: stage: deploy script: - kubectl apply -f k8s/',
      });
      setResult(output);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold font-headline">Risk & Compliance</h1>
          <p className="text-muted-foreground">Deep system audit for single points of failure.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={runAnalysis} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SearchCheck className="mr-2 h-4 w-4" />
          )}
          <span>Run Meticulous Analysis</span>
        </Button>
      </div>

      {!result ? (
        <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl space-y-4">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            No active analysis. Start an audit to detect vulnerabilities.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="border-border/40 bg-accent/5 border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg">Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.overallAssessment}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">
                  Architectural Risks
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="space-y-4">
                {result.risks.map((risk, i) => (
                  <div
                    key={i}
                    className="space-y-1 pb-4 border-b border-border/20 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={risk.severity === 'Critical' ? 'destructive' : 'secondary'}
                        className="text-[10px] uppercase"
                      >
                        {risk.severity}
                      </Badge>
                      <span className="text-xs font-bold text-primary">{risk.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{risk.description}</p>
                    <p className="text-[10px] text-accent mt-1">Rec: {risk.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">
                  Vulnerabilities
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent className="space-y-4">
                {result.vulnerabilities.map((vuln, i) => (
                  <div
                    key={i}
                    className="space-y-1 pb-4 border-b border-border/20 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">Issue #{i + 1}</span>
                      <span className="text-[10px] text-muted-foreground">
                        CVSS: {vuln.cvssScore || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{vuln.description}</p>
                    <p className="text-[10px] text-primary mt-1">
                      Fix: {vuln.remediationSuggestion}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">
                  Compliance Drift
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent className="space-y-4">
                {result.complianceIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="space-y-1 pb-4 border-b border-border/20 last:border-0 last:pb-0"
                  >
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase border-accent/20 text-accent"
                    >
                      {issue.complianceStandard}
                    </Badge>
                    <p className="text-xs text-muted-foreground pt-1">{issue.description}</p>
                    <p className="text-[10px] text-destructive/80 mt-1 uppercase tracking-tighter">
                      Impact: {issue.impact}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
