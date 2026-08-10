'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Target, 
  Sparkles, 
  Flag, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface DynamicTimelineProps {
  targetExamYear?: string;
  overallScore: number;
  totalAttempts: number;
  strengths: string[];
  weaknesses: string[];
}

const CAT_DATES: Record<string, Date> = {
  "2025": new Date("2025-11-30T00:00:00"),
  "2026": new Date("2026-11-29T00:00:00"),
  "2027": new Date("2027-11-28T00:00:00"),
  "2028": new Date("2028-11-26T00:00:00")
};

export function DynamicTimeline({ 
  targetExamYear = '2026', 
  overallScore, 
  totalAttempts, 
  strengths = [], 
  weaknesses = [] 
}: DynamicTimelineProps) {
  const { daysRemaining, examDate, monthsRemaining, phaseNumber, phaseTitle, phaseDesc } = useMemo(() => {
    const examYear = targetExamYear || '2026';
    const date = CAT_DATES[examYear] || new Date(`${examYear}-11-29T00:00:00`);
    const diff = date.getTime() - new Date().getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const months = Math.max(0, Math.ceil(days / 30));

    // Dynamic phase calculation based on actual mastery and attempts
    let pNum = 1;
    let pTitle = 'Phase 1: Foundation & Core Concepts';
    let pDesc = 'Focus on eliminating high-frequency errors in basic subtopics.';

    if (overallScore >= 75 || totalAttempts >= 300) {
      pNum = 3;
      pTitle = 'Phase 3: High-Yield Mocks & Speed Calibration';
      pDesc = 'Simulate full CAT CBT environments and fine-tune question selection strategies.';
    } else if (overallScore >= 45 || totalAttempts >= 100) {
      pNum = 2;
      pTitle = 'Phase 2: Sectional Stamina & Advanced Sprints';
      pDesc = 'Master tricky permutations, DILR multi-variable sets, and speed up RC comprehension.';
    }

    return {
      daysRemaining: days,
      examDate: date,
      monthsRemaining: months,
      phaseNumber: pNum,
      phaseTitle: pTitle,
      phaseDesc: pDesc
    };
  }, [targetExamYear, overallScore, totalAttempts]);

  // Weekly question target calculation (e.g. 50 questions/week)
  const weeklyTarget = 50;
  const weeklyCompleted = Math.min(weeklyTarget, totalAttempts % 100);
  const weeklyPercent = Math.round((weeklyCompleted / weeklyTarget) * 100);

  const cleanWeakness = weaknesses[0]?.split(' > ').pop() || 'Arithmetic Concepts';

  return (
    <Card className="col-span-1 md:col-span-4 shadow-sm border-border/80 overflow-hidden bg-card">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Clock className="h-5 w-5 text-primary shrink-0" />
              <CardTitle className="text-xl font-extrabold tracking-tight">
                Adaptive Preparation Roadmap
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Live milestones and weekly pacing calibrated for CAT {targetExamYear}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto bg-background/80 border px-4 py-2 rounded-2xl shadow-sm">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tighter block leading-none">
                {daysRemaining}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Days to CAT {targetExamYear}
              </span>
            </div>
            <div className="h-8 w-px bg-border/80" />
            <div className="text-left">
              <span className="text-xs font-bold text-foreground block">
                {monthsRemaining} Months
              </span>
              <span className="text-[10px] text-muted-foreground">
                Exam: Nov {examDate.getDate()}, {targetExamYear}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Phase Indicator & Progress Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Active Phase Card */}
          <div className="md:col-span-7 space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/60">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                ACTIVE STAGE: {phaseNumber} of 3
              </Badge>
              <span className="text-xs font-bold text-muted-foreground">
                Readiness Score: {overallScore}/100
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-base text-foreground">{phaseTitle}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{phaseDesc}</p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40 text-xs">
              <span className="text-muted-foreground truncate">
                Priority Action: <strong className="text-foreground">{cleanWeakness}</strong>
              </span>
              <Link href={`/practice/modules/${encodeURIComponent(cleanWeakness)}`}>
                <Button size="sm" variant="outline" className="h-7 text-[11px] font-bold shrink-0">
                  Target Sprint <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Weekly Pacing Velocity Gauge */}
          <div className="md:col-span-5 space-y-3 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Weekly Question Velocity
              </span>
              <span className="text-foreground">{weeklyPercent}%</span>
            </div>

            <Progress value={weeklyPercent} className="h-2 rounded-full" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{weeklyCompleted} / {weeklyTarget} Solved this week</span>
              <span className="font-bold text-primary">{Math.max(0, weeklyTarget - weeklyCompleted)} to goal</span>
            </div>
          </div>

        </div>

        {/* 3 Step Stage Progression Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Phase 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            phaseNumber === 1 
              ? 'bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20' 
              : phaseNumber > 1 
                ? 'bg-emerald-500/5 border-emerald-500/30' 
                : 'bg-muted/20 border-border/60 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phase 1</span>
              {phaseNumber > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : phaseNumber === 1 ? (
                <Badge variant="outline" className="text-[9px] font-extrabold text-primary border-primary/30">CURRENT</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Locked</span>
              )}
            </div>
            <h5 className="font-bold text-sm text-foreground">Foundation Mastery</h5>
            <p className="text-xs text-muted-foreground mt-1">Arithmetic, Algebra basics, Reading & Logic drills.</p>
          </div>

          {/* Phase 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            phaseNumber === 2 
              ? 'bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20' 
              : phaseNumber > 2 
                ? 'bg-emerald-500/5 border-emerald-500/30' 
                : 'bg-muted/20 border-border/60 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phase 2</span>
              {phaseNumber > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : phaseNumber === 2 ? (
                <Badge variant="outline" className="text-[9px] font-extrabold text-primary border-primary/30">CURRENT</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Upcoming</span>
              )}
            </div>
            <h5 className="font-bold text-sm text-foreground">Sectional Stamina</h5>
            <p className="text-xs text-muted-foreground mt-1">Timed sectionals, 40-min sprints & mixed arena.</p>
          </div>

          {/* Phase 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            phaseNumber === 3 
              ? 'bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20' 
              : 'bg-muted/20 border-border/60 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phase 3</span>
              {phaseNumber === 3 ? (
                <Badge variant="outline" className="text-[9px] font-extrabold text-primary border-primary/30">CURRENT</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Upcoming</span>
              )}
            </div>
            <h5 className="font-bold text-sm text-foreground">PYQ Mocks & Calibrations</h5>
            <p className="text-xs text-muted-foreground mt-1">Full CBT simulations, percentile optimization & strategy.</p>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}
