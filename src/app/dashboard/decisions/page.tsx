"use client";

import { useState } from "react";
import {
  Compass,
  Wand2,
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Clock,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Recommendation {
  rank: number;
  solutionName: string;
  provider: string;
  overallScore: number;
  confidence: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  risks: string[];
  estimatedCost: string;
  implementationEffort: "low" | "medium" | "high";
}

const mockRecommendations: Recommendation[] = [
  {
    rank: 1,
    solutionName: "Gemini 2.5 Flash + Vertex AI",
    provider: "Google Cloud",
    overallScore: 92,
    confidence: 0.89,
    reasoning:
      "Best overall fit for the Healthcare AI scenario with sub-100ms latency, HIPAA compliance, and cost-effective scaling. Vertex AI provides managed ML infrastructure with built-in monitoring.",
    pros: ["Sub-50ms P99 latency", "HIPAA compliant", "Auto-scaling", "Cost-effective at scale"],
    cons: ["Vendor lock-in risk", "Limited model customization"],
    risks: ["API availability dependency", "Data residency requirements"],
    estimatedCost: "$12K-18K/month",
    implementationEffort: "low",
  },
  {
    rank: 2,
    solutionName: "Azure OpenAI + AKS",
    provider: "Microsoft Azure",
    overallScore: 85,
    confidence: 0.82,
    reasoning:
      "Strong enterprise integration with existing Microsoft ecosystem. GPT-4o provides excellent multi-modal capabilities but at higher cost and slightly elevated latency.",
    pros: ["Enterprise integration", "Multi-modal support", "Comprehensive compliance"],
    cons: ["Higher latency (80-120ms)", "Premium pricing", "Complex setup"],
    risks: ["Rate limit concerns at peak", "Cost escalation with usage"],
    estimatedCost: "$22K-35K/month",
    implementationEffort: "medium",
  },
  {
    rank: 3,
    solutionName: "Self-hosted Llama 3.1 + Kubernetes",
    provider: "Local / On-premises",
    overallScore: 78,
    confidence: 0.71,
    reasoning:
      "Maximum control and data sovereignty, but requires significant operational overhead. Best for organizations with strict data residency requirements.",
    pros: ["Full data control", "No vendor lock-in", "Customizable", "Predictable costs"],
    cons: ["High operational overhead", "Limited model quality", "GPU hardware costs"],
    risks: ["Operational complexity", "Talent requirements", "Hardware failure risk"],
    estimatedCost: "$45K-60K/month (including infra)",
    implementationEffort: "high",
  },
];

const tradeOffs = [
  {
    dimension: "Cost vs Performance",
    description:
      "Gemini offers best cost/performance ratio but with vendor dependency. Self-hosted provides control at 3-4x cost.",
    recommendation: "Choose Gemini for cost-efficiency; self-host for sovereignty.",
  },
  {
    dimension: "Latency vs Flexibility",
    description:
      "Cloud APIs deliver lowest latency but limit model customization. Self-hosted allows fine-tuning but adds latency.",
    recommendation: "Use cloud APIs for real-time inference; self-host for batch processing.",
  },
  {
    dimension: "Compliance vs Innovation",
    description:
      "HIPAA compliance is faster with cloud providers. Custom solutions require additional audit overhead.",
    recommendation: "Leverage cloud compliance certifications to accelerate time-to-market.",
  },
];

const effortColors = {
  low: "text-status-healthy",
  medium: "text-status-warning",
  high: "text-status-critical",
};
const effortBg = {
  low: "bg-status-healthy/10",
  medium: "bg-status-warning/10",
  high: "bg-status-critical/10",
};

export default function DecisionsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Decision Guide Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered selection decision guides with ranked recommendations and trade-off analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate Guide"}
          </Button>
        </div>
      </div>

      {isGenerating && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div>
                <p className="font-medium">Generating Decision Guide...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyzing scenario requirements against solution capabilities using Genkit AI
                  flow.
                </p>
                <Progress value={65} className="h-1.5 mt-3 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasGenerated && !isGenerating && (
        <>
          {/* Recommendations */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold font-headline">Ranked Recommendations</h2>
            {mockRecommendations.map((rec) => (
              <Card
                key={rec.rank}
                className={rec.rank === 1 ? "border-accent/30 shadow-md shadow-accent/5" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rec.rank === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        #{rec.rank}
                      </div>
                      <div>
                        <CardTitle className="text-base">{rec.solutionName}</CardTitle>
                        <p className="text-xs text-muted-foreground">{rec.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold font-headline">{rec.overallScore}</p>
                        <p className="text-[10px] text-muted-foreground">Overall Score</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold font-headline">
                          {(rec.confidence * 100).toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Confidence</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-status-healthy flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> Pros
                      </p>
                      {rec.pros.map((pro, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-status-healthy mt-0.5 shrink-0" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-status-critical flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" /> Cons
                      </p>
                      {rec.cons.map((con, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="h-3 w-3 text-status-warning mt-0.5 shrink-0" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{rec.estimatedCost}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded ${effortBg[rec.implementationEffort]}`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span className={effortColors[rec.implementationEffort]}>
                        {rec.implementationEffort} effort
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="h-3.5 w-3.5 text-status-warning" />
                      <span>{rec.risks.length} risks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trade-offs */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold font-headline">Trade-off Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tradeOffs.map((tradeoff) => (
                <Card key={tradeoff.dimension}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-chart-4" />
                      {tradeoff.dimension}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">{tradeoff.description}</p>
                    <div className="p-2 rounded bg-accent/5 border border-accent/20">
                      <p className="text-xs font-medium text-accent">
                        💡 {tradeoff.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "Validate Gemini 2.5 Flash latency with a proof-of-concept on Vertex AI",
                  "Schedule HIPAA compliance review with the security team",
                  "Request cost estimates for projected 10K RPS workload",
                  "Set up monitoring dashboards for inference metrics",
                  "Create rollback plan for migration from current setup",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-secondary/30">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                      {i + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
