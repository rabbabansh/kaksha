'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CompetencyMatrix } from './competency-matrix';
import { DashboardCharts } from './dashboard-charts';
import { Layers, BarChart3, TrendingUp, Sparkles } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'charts'>('hierarchy');

  return (
    <div className="space-y-4">
      {/* Top Level Diagnostic Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
            <TrendingUp className="h-5 w-5 text-indigo-500 shrink-0" />
            Diagnostics & Competency Hub
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Switch between granular topic rankings and visual drill-down analytics charts.
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(val) => setActiveTab(val as 'hierarchy' | 'charts')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-2 w-full sm:w-auto h-9 p-1">
            <TabsTrigger value="hierarchy" className="text-xs font-bold px-3 py-1 gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Topic Hierarchy
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs font-bold px-3 py-1 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics Charts
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      {activeTab === 'hierarchy' ? (
        <CompetencyMatrix hierarchy={hierarchy} />
      ) : (
        <Card className="col-span-1 md:col-span-4 shadow-sm border-border/80 p-6 bg-card">
          <DashboardCharts
            hierarchy={hierarchy}
            totalRawAttempts={totalRawAttempts}
            totalRawCorrect={totalRawCorrect}
            totalRawWrong={totalRawWrong}
          />
        </Card>
      )}
    </div>
  );
}
