'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompetencyMatrix } from './competency-matrix';
import { DashboardCharts } from './dashboard-charts';
import { Layers, BarChart3, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface DiagnosticsHubProps {
  hierarchy: any;
  totalRawAttempts: number;
  totalRawCorrect: number;
  totalRawWrong: number;
}

export function DiagnosticsHub({
  hierarchy,
  totalRawAttempts,
  totalRawCorrect,
  totalRawWrong
}: DiagnosticsHubProps) {
  const [matrixExpanded, setMatrixExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-1">
        <h3 className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
          <TrendingUp className="h-5 w-5 text-indigo-500 shrink-0" />
          Diagnostics & Competency Hub
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Visual drill-down analytics and granular topic rankings.
        </p>
      </div>

      {/* Visual Charts (Always Visible) */}
      <Card className="shadow-sm border-border/80 p-6 bg-card">
        <DashboardCharts
          hierarchy={hierarchy}
          totalRawAttempts={totalRawAttempts}
          totalRawCorrect={totalRawCorrect}
          totalRawWrong={totalRawWrong}
        />
      </Card>

      {/* Competency Matrix (Top 3 Always Visible) */}
      <div>
        <CompetencyMatrix hierarchy={hierarchy} />
      </div>
    </div>
  );
}
