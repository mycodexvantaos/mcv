'use client';

/**
 * @fileoverview Score Gauge Component
 *
 * Circular gauge visualization for AI/Human probability scores.
 */

interface ScoreGaugeProps {
  score: number;
  label: string;
  color?: string;
  size?: number;
}

export function ScoreGauge({ score, label, color = '#6366f1', size = 120 }: ScoreGaugeProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - score * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/30"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size, marginTop: -size }}
      >
        <span className="text-2xl font-bold" style={{ color }}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
