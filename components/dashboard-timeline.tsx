/* eslint-disable */
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, TrendingUp, TrendingDown, Flag, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardTimelineProps {
  targetExamYear?: string;
  strengths: string[];
  weaknesses: string[];
}

const CAT_DATES = {
  "2026": new Date("2026-11-29T00:00:00"),
  "2027": new Date("2027-11-28T00:00:00"),
  "2028": new Date("2028-11-26T00:00:00")
};

export function DashboardTimeline({ targetExamYear, strengths, weaknesses }: DashboardTimelineProps) {
  const { daysRemaining, examDate, monthsRemaining } = useMemo(() => {
    if (!targetExamYear || !CAT_DATES[targetExamYear as keyof typeof CAT_DATES]) {
      return { daysRemaining: 0, examDate: null, monthsRemaining: 0 };
    }
    const date = CAT_DATES[targetExamYear as keyof typeof CAT_DATES];
    const diff = date.getTime() - new Date().getTime();
    return {
      daysRemaining: Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))),
      examDate: date,
      monthsRemaining: Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)))
    };
  }, [targetExamYear]);

  if (!examDate) return null;

  // Clean strings (remove hierarchy if any)
  const cleanStrengths = strengths.map(s => s.split(' > ').pop() || '');
  const cleanWeaknesses = weaknesses.map(s => s.split(' > ').pop() || '');

  return (
    <Card className="border-primary/20 bg-card overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Preparation Timeline
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">
              {daysRemaining}
            </span>
            <span className="text-sm text-muted-foreground ml-2 font-medium">
              Days to CAT {targetExamYear}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Your strategic roadmap based on your current mastery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          
          {/* Phase 1: Immediate Focus (Weaknesses) */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-orange-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute -left-4 md:static">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-card border rounded-xl p-4 shadow-sm relative">
              <div className="absolute top-4 -left-2 w-4 h-4 rotate-45 bg-card border-l border-b border-border md:hidden" />
              <h3 className="font-bold text-lg text-orange-600 dark:text-orange-400 mb-1">Phase 1: Bridge the Gaps</h3>
              <p className="text-sm text-muted-foreground mb-3">Focus heavily on these topics to build a solid foundation.</p>
              <div className="flex flex-wrap gap-2">
                {cleanWeaknesses.length > 0 ? cleanWeaknesses.slice(0, 4).map(w => (
                  <Badge key={w} variant="secondary" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200">
                    {w}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">All caught up!</span>}
              </div>
            </div>
          </div>

          {/* Phase 2: Consolidation */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute -left-4 md:static">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-card border rounded-xl p-4 shadow-sm relative">
              <div className="absolute top-4 -left-2 w-4 h-4 rotate-45 bg-card border-l border-b border-border md:hidden" />
              <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-1">Phase 2: Consolidation</h3>
              <p className="text-sm text-muted-foreground mb-3">Mixed practice and sectional tests to build stamina.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Mixed PYQs</Badge>
                <Badge variant="outline">Sectional Mocks</Badge>
              </div>
            </div>
          </div>

          {/* Phase 3: Maximize Strengths */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-green-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute -left-4 md:static">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-card border rounded-xl p-4 shadow-sm relative">
              <div className="absolute top-4 -left-2 w-4 h-4 rotate-45 bg-card border-l border-b border-border md:hidden" />
              <h3 className="font-bold text-lg text-green-600 dark:text-green-400 mb-1">Phase 3: Maximize Percentile</h3>
              <p className="text-sm text-muted-foreground mb-3">Push your strengths to 99%ile accuracy under time pressure.</p>
              <div className="flex flex-wrap gap-2">
                {cleanStrengths.length > 0 ? cleanStrengths.slice(0, 4).map(s => (
                  <Badge key={s} variant="secondary" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200">
                    {s}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">Keep finding your strengths!</span>}
              </div>
            </div>
          </div>

          {/* Final: D-Day */}
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute -left-4 md:static">
              <Flag className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm relative">
              <div className="absolute top-4 -left-2 w-4 h-4 rotate-45 bg-primary/5 border-l border-b border-primary/20 md:hidden" />
              <h3 className="font-bold text-lg text-primary mb-1">D-Day: CAT {targetExamYear}</h3>
              <p className="text-sm text-muted-foreground font-medium">November {examDate.getDate()}, {targetExamYear}</p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
