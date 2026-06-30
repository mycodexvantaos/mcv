"use client";

/**
 * @fileoverview Highlighted Text Component
 *
 * Renders text with AI-flagged sentences highlighted in red
 * and human-like sentences highlighted in green.
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HighlightedTextProps {
  sentences: Array<{
    text: string;
    index: number;
    label: string;
    confidence: number;
    aiScore: number;
    explanation: string;
  }>;
}

export function HighlightedText({ sentences }: HighlightedTextProps) {
  const getHighlightClass = (label: string) => {
    switch (label) {
      case "ai":
        return "bg-red-100 dark:bg-red-900/30 border-l-2 border-red-500";
      case "human":
        return "bg-green-100 dark:bg-green-900/30 border-l-2 border-green-500";
      case "mixed":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-l-2 border-yellow-500";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-l-2 border-gray-500";
    }
  };

  const getLabelBadge = (label: string, confidence: number) => {
    const variant = label === "ai" ? "destructive" : label === "human" ? "default" : "secondary";
    return (
      <Badge variant={variant} className="text-[10px] px-1.5 py-0">
        {label.toUpperCase()} {(confidence * 100).toFixed(0)}%
      </Badge>
    );
  };

  if (!sentences || sentences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No sentences to display. Run detection first.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {sentences.map((sentence) => (
        <Tooltip key={sentence.index}>
          <TooltipTrigger asChild>
            <div
              className={`px-3 py-2 rounded text-sm leading-relaxed cursor-default ${getHighlightClass(sentence.label)}`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-1">{sentence.text}</span>
                {getLabelBadge(sentence.label, sentence.confidence)}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <p className="text-xs">{sentence.explanation}</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI Score: {(sentence.aiScore * 100).toFixed(1)}%
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
