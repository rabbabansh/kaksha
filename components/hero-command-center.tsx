'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressCalendar } from './progress-calendar';
import { SubtopicsExplorerModal } from './subtopics-explorer-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Award, 
  Star, 
  Medal, 
  Info, 
  Layers, 
  Flame, 
  Trophy, 
  TrendingUp, 
  Sparkles,
  Calendar as CalendarIcon
} from 'lucide-react';

interface HeroCommandCenterProps {
  data: any;
  historyData: any;
}

export function HeroCommandCenter({ data, historyData }: HeroCommandCenterProps) {
  const getEstimatedPercentile = (score: number) => {
    if (score >= 90) return '99.5+';
    if (score >= 80) return (95 + (score - 80) * 0.45).toFixed(1);
    if (score >= 70) return (90 + (score - 70) * 0.5).toFixed(1);
    if (score >= 60) return (80 + (score - 60) * 1.0).toFixed(1);
    if (score >= 50) return (70 + (score - 50) * 1.0).toFixed(1);
    if (score >= 30) return (40 + (score - 30) * 1.5).toFixed(1);
    return Math.max(0, score).toFixed(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Master Overview Profile & Highlights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-card shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardDescription className="text-primary font-bold flex items-center gap-1.5 tracking-wider uppercase text-xs">
                  <Award className="h-4 w-4" /> Global Readiness & Mastery Profile
                </CardDescription>
              </div>
              <div className="flex items-baseline gap-3">
                <CardTitle className="text-5xl sm:text-6xl font-black flex items-baseline gap-2 tracking-tighter text-foreground">
                  {data.overallScore}
                  <span className="text-xl text-muted-foreground font-semibold">/ 100</span>
                </CardTitle>
                <Badge variant="secondary" className="font-extrabold text-xs px-2.5 py-0.5 self-center">
                  Grade {data.overallScore >= 90 ? 'A+' : data.overallScore >= 75 ? 'A' : data.overallScore >= 60 ? 'B' : data.overallScore >= 40 ? 'C' : 'D'}
                </Badge>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary" aria-label="Scoring Info">
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>How Kaksha Scoring Works</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm mt-4">
                      <p><strong>Overall Kaksha Score (0-100):</strong> Your global mastery level using Item Response Theory. Accounts for question difficulty, freshness, and topic coverage. 80+ indicates high readiness!</p>
                      <p><strong>Sectional Score:</strong> Aggregates your performance across QA, VARC, and DILR.</p>
                      <p><strong>Subtopic Grades (A-F):</strong> Granular accuracy and volume rating.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 bg-background/70 border sm:border-0 p-3 sm:p-0 rounded-xl">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 font-black text-sm px-3.5 py-1 shadow-md">
                {getEstimatedPercentile(data.overallScore)} %ile
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                Est. CAT Percentile
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Your mastery adjusts dynamically with every question solved. Explore your full skill breakdown or keep up your daily streak!
            </p>
            <SubtopicsExplorerModal hierarchy={data.hierarchy}>
              <Button variant="secondary" size="sm" className="font-bold text-xs shrink-0 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800">
                <Layers className="w-4 h-4 mr-1.5" /> Full Skill Hierarchy
              </Button>
            </SubtopicsExplorerModal>
          </div>

          {/* Gamification & Streaks Pill Row */}
          <div className="flex gap-4 sm:gap-8 pt-4 border-t border-border/40 flex-wrap items-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Total XP</p>
              <p className="text-lg font-black text-yellow-500 flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-500" /> {data.xp}
              </p>
            </div>
            
            <div className="h-8 w-px bg-border/60 hidden sm:block" />

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Active Streak</p>
              <p className="text-lg font-black text-orange-500 flex items-center gap-1">
                🔥 {data.currentStreak || 0} Days
              </p>
            </div>

            <div className="h-8 w-px bg-border/60 hidden sm:block" />

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Best Streak</p>
              <p className="text-lg font-black text-foreground flex items-center gap-1">
                🏆 {data.longestStreak || 0} Days
              </p>
            </div>

            <div className="h-8 w-px bg-border/60 hidden sm:block" />

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Badges</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {data.badges?.length > 0 ? (
                  data.badges.map((b: string) => (
                    <Badge key={b} variant="secondary" className="text-[10px] font-bold">
                      <Medal className="h-3 w-3 mr-1 text-primary" /> {b}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground font-medium">Solve dailies to unlock!</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Consistency & Daily Tasks Heatmap */}
      <ProgressCalendar historyData={historyData} weaknesses={data?.weaknesses || []} />

    </div>
  );
}
