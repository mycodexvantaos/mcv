'use client';

import { useState } from 'react';
import {
  generateCiCdPipeline,
  GenerateCiCdPipelineOutput,
} from '@/ai/flows/generate-ci-cd-pipeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileCode, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PipelineGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [arch, setArch] = useState('');
  const [strategy, setStrategy] = useState('Kubernetes Blue/Green Deployment');
  const [result, setResult] = useState<GenerateCiCdPipelineOutput | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const output = await generateCiCdPipeline({
        architectureDescription: arch,
        deploymentStrategy: strategy,
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
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold font-headline">CI/CD Generator</h1>
        <p className="text-muted-foreground">Zero-failure GitLab pipeline translation engine.</p>
      </div>

      {!result ? (
        <Card className="border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Project Configuration</CardTitle>
            <CardDescription>
              Specify architecture and strategy for the meticulous generator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Target Architecture
              </label>
              <Textarea
                placeholder="Describe your components (e.g. Next.js frontend, PostgreSQL DB, Redis cache)..."
                className="bg-background/50 border-border/40"
                value={arch}
                onChange={(e) => setArch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Deployment Strategy
              </label>
              <Input
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="bg-background/50 border-border/40"
              />
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              onClick={handleGenerate}
              disabled={loading || !arch}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              <span>Generate Zero-Failure Pipeline</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  .gitlab-ci.yml
                </CardTitle>
                <CardDescription>Validated for perfect pass scenario.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                Reset
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-background text-xs font-mono overflow-auto max-h-[500px] border border-border/40">
                {result.gitlabCiCdYaml}
              </pre>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Validation Report
              </CardTitle>
              <CardDescription>Meticulous review of generated logic.</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none text-sm text-muted-foreground">
              {result.validationReport.split('\n').map((line, i) => (
                <p key={i} className="mb-2 leading-relaxed">
                  {line}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
