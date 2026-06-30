"use client";

/**
 * @fileoverview Rewrite Comparison Component
 *
 * Displays side-by-side comparison of original and humanised text
 * with diff highlights, change summary, and copy actions.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, ArrowRight, TrendingDown } from "lucide-react";

interface RewriteComparisonProps {
  originalText: string;
  humanisedText: string;
  comparison: {
    originalHighlighted: Array<{
      text: string;
      label: string;
      confidence: number;
      index: number;
    }>;
    humanisedHighlighted: Array<{
      text: string;
      label: string;
      confidence: number;
      index: number;
    }>;
    diffs: Array<{
      type: string;
      original?: string;
      humanised?: string;
      index: number;
    }>;
  };
  changeSummary: {
    sentencesRewritten: number;
    sentencesUnchanged: number;
    avgScoreImprovement: number;
    overallScoreChange: { before: number; after: number };
    changeCategories: Array<{ category: string; count: number; examples: string[] }>;
  };
  onCopyOriginal?: () => void;
  onCopyHumanised?: () => void;
}

export function RewriteComparison({
  originalText,
  humanisedText,
  comparison,
  changeSummary,
  onCopyOriginal,
  onCopyHumanised,
}: RewriteComparisonProps) {
  const highlightClass = (label: string) => {
    switch (label) {
      case "ai":
        return "bg-red-50 dark:bg-red-950/40 border-l-2 border-red-400";
      case "human":
        return "bg-green-50 dark:bg-green-950/40 border-l-2 border-green-400";
      default:
        return "border-l-2 border-gray-300";
    }
  };

  const diffClass = (type: string) => {
    switch (type) {
      case "removed":
        return "bg-red-50 dark:bg-red-950/30 line-through text-red-700 dark:text-red-400";
      case "added":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400";
      default:
        return "";
    }
  };

  const improvementPct = (
    (changeSummary.overallScoreChange.before - changeSummary.overallScoreChange.after) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Change Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-green-500" />
            Change Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">{changeSummary.sentencesRewritten}</p>
              <p className="text-xs text-muted-foreground">Sentences Rewritten</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{changeSummary.sentencesUnchanged}</p>
              <p className="text-xs text-muted-foreground">Unchanged</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-500">{improvementPct}%</p>
              <p className="text-xs text-muted-foreground">AI Score Reduction</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">
                {(changeSummary.overallScoreChange.before * 100).toFixed(0)}%
                <ArrowRight className="h-3 w-3 inline mx-1" />
                {(changeSummary.overallScoreChange.after * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">AI Score Change</p>
            </div>
          </div>

          {changeSummary.changeCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {changeSummary.changeCategories.map((cat) => (
                <Badge key={cat.category} variant="outline" className="text-xs">
                  {cat.category}: {cat.count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Original</CardTitle>
              <Button variant="ghost" size="sm" onClick={onCopyOriginal}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <CardDescription>
              AI Score: {(changeSummary.overallScoreChange.before * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {comparison.originalHighlighted.map((seg) => (
                <div
                  key={`orig-${seg.index}`}
                  className={`px-2 py-1 rounded text-sm ${highlightClass(seg.label)}`}
                >
                  {seg.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Humanised */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Humanised</CardTitle>
              <Button variant="ghost" size="sm" onClick={onCopyHumanised}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <CardDescription>
              AI Score: {(changeSummary.overallScoreChange.after * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {comparison.humanisedHighlighted.map((seg) => (
                <div
                  key={`human-${seg.index}`}
                  className={`px-2 py-1 rounded text-sm ${highlightClass(seg.label)}`}
                >
                  {seg.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diff View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Diff View</CardTitle>
          <CardDescription>Changes between original and humanised text</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-sm">
            {comparison.diffs.map((diff, i) => (
              <div key={`diff-${i}`} className={`px-3 py-1.5 rounded ${diffClass(diff.type)}`}>
                <span className="text-muted-foreground mr-2">
                  {diff.type === "removed" ? "-" : diff.type === "added" ? "+" : " "}
                </span>
                {diff.type === "removed" && diff.original}
                {diff.type === "added" && diff.humanised}
                {diff.type === "unchanged" && (diff.original || diff.humanised)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
