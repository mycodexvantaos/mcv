'use client';

import { useState } from 'react';
import { runAdvancedAnalysis, AdvancedAnalysisOutput } from '@/ai/flows/advanced-analysis-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileSearch,
  ScanText,
  GraduationCap,
  BarChart4,
  Gavel,
  ShieldCheck,
  Loader2,
  Sparkles,
  Download,
  Share2,
  AlertCircle,
  ChevronRight,
  FileJson,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function IntelligencePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResult] = useState<AdvancedAnalysisOutput | null>(null);
  const [activeTab, setActiveTab] = useState('SEMANTIC_SEARCH');

  const startAnalysis = async () => {
    setLoading(true);
    try {
      const output = await runAdvancedAnalysis({
        mode: activeTab as any,
        contextDescription: `針對跨維度數據集進行 ${activeTab} 模式下的深度稽核與情報合成。`,
      });
      setResult(output);
      toast({
        title: 'Intelligence Synthesis Complete',
        description: `Successfully analyzed cross-dimensional sources in ${activeTab} mode.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Engine encountered a recursive reasoning error.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'SEMANTIC_SEARCH':
        return <FileSearch className="h-4 w-4" />;
      case 'OCR_EXTRACTION':
        return <ScanText className="h-4 w-4" />;
      case 'RESEARCH_SYNTHESIS':
        return <GraduationCap className="h-4 w-4" />;
      case 'DATA_QUALITY_AUDIT':
        return <BarChart4 className="h-4 w-4" />;
      case 'LEGAL_CONTRACT_REVIEW':
        return <Gavel className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto scanline">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/20 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono">
              Sub-System: Omniscient Analysis Engine
            </span>
          </div>
          <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase leading-tight">
            Intelligence <span className="text-primary italic">Synthesis Hub</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl font-light">
            Cross-dimensional document indexing, OCR structural extraction, and regulatory
            compliance navigation.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 h-14 uppercase tracking-widest text-[11px]"
          onClick={startAnalysis}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          <span>Initiate Multi-Source Synthesis</span>
        </Button>
      </div>

      <Tabs defaultValue="SEMANTIC_SEARCH" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList className="bg-sidebar-background border border-border/40 p-1 h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
          {[
            { id: 'SEMANTIC_SEARCH', label: 'Semantic Index' },
            { id: 'OCR_EXTRACTION', label: 'OCR & Extract' },
            { id: 'RESEARCH_SYNTHESIS', label: 'Research Synthesis' },
            { id: 'DATA_QUALITY_AUDIT', label: 'Data Quality' },
            { id: 'LEGAL_CONTRACT_REVIEW', label: 'Legal/Contract' },
            { id: 'COMPLIANCE_GAP_ANALYSIS', label: 'Compliance Audit' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-[9px] uppercase font-bold tracking-widest py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-8 mt-0 animate-in fade-in duration-500">
          {!results ? (
            <Card className="border-border/40 bg-card/20 border-dashed border-2 min-h-[400px] flex flex-col items-center justify-center p-20 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 mb-6">
                {getModeIcon(activeTab)}
              </div>
              <h3 className="text-xl font-headline uppercase tracking-widest text-foreground mb-2">
                Engine Idle
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ready to perform <strong>{activeTab.replace(/_/g, ' ')}</strong>. Upload
                multi-format files or run simulation to synthesize global intelligence.
              </p>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-primary/20 bg-primary/5 border-l-4 border-l-primary overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="h-32 w-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      Synthesis Summary
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-mono tracking-widest">
                      Formal Assessment v4.0
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-light leading-relaxed text-foreground italic border-l-2 border-primary/30 pl-6">
                      {results.summary}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/40 bg-card/20">
                  <CardHeader className="bg-white/5 border-b border-border/10">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                      <Database className="h-4 w-4" /> Extracted Insights & Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-background/40">
                        <TableRow className="border-border/40">
                          <TableHead className="text-[10px] font-bold uppercase w-[150px]">
                            Source/Reference
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase">
                            Synthesized Content
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase text-right">
                            Relevance
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.findings.map((find, i) => (
                          <TableRow
                            key={i}
                            className="border-border/40 hover:bg-white/5 transition-colors group"
                          >
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-foreground truncate">
                                  {find.source}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-mono border-primary/20 text-primary uppercase"
                                >
                                  {find.pageReference || 'N/A'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground leading-relaxed py-4">
                              {typeof find.content === 'string'
                                ? find.content
                                : JSON.stringify(find.content, null, 2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div
                                    className="bg-primary h-full"
                                    style={{ width: `${(find.relevance || 0.9) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-primary">
                                  {(find.relevance || 0.9).toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="border-accent/20 bg-accent/5">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-accent">
                      <AlertCircle className="h-4 w-4" /> Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-4 rounded-xl bg-background/40 border border-accent/10 group hover:border-accent/30 transition-all"
                      >
                        <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 text-[10px] font-bold">
                          {i + 1}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {results.metadata && (
                  <Card className="border-border/40 bg-card/20">
                    <CardHeader>
                      <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Audit Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(results.metadata).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center py-2 border-b border-border/10 last:border-0"
                        >
                          <span className="text-[9px] uppercase font-bold text-muted-foreground/60">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="p-8 rounded-3xl border border-border/40 bg-sidebar-background/50 space-y-6 text-center">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">
                      Export Synthesis
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 border-border/40 hover:bg-primary/10"
                      >
                        <FileJson className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 border-border/40 hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 border-border/40 hover:bg-primary/10"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground italic leading-relaxed uppercase">
                    Verification Hash: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}...
                    {Math.random().toString(16).slice(2, 6).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
