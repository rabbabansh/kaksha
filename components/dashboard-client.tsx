/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { DashboardTimeline } from './dashboard-timeline';
import { Loader2, TrendingUp, TrendingDown, Award, Star, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mb-12">
      {/* Overview Metric & Gamification */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-medium flex items-center gap-2">
              <Award className="h-4 w-4" /> Kaksha Score
            </CardDescription>
            <CardTitle className="text-5xl flex items-baseline gap-2">
              {data.overallScore}
              <span className="text-xl text-muted-foreground font-normal">/ 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your overall mastery based on Bayesian Knowledge Tracing.
            </p>
            <div className="flex gap-4 border-t pt-4 border-primary/10">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">XP Earned</p>
                <p className="text-lg font-bold text-primary flex items-center gap-1"><Star className="h-4 w-4 fill-primary"/> {data.xp}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Badges</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.badges?.length > 0 ? data.badges.map((b: string) => (
                    <Badge key={b} variant="secondary" className="text-xs"><Medal className="h-3 w-3 mr-1"/>{b}</Badge>
                  )) : <span className="text-sm text-muted-foreground">Keep practicing!</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SWOT */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Strengths & Weaknesses</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium mb-2">
                <TrendingUp className="h-4 w-4" /> Top Strengths
              </div>
              <div className="flex flex-wrap gap-2">
                {data.strengths.length > 0 ? data.strengths.slice(0, 3).map((s: string) => (
                  <Badge key={s} variant="outline" className="bg-green-50 dark:bg-green-900/10 border-green-200">
                    {s.split(' > ').pop()}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">Keep practicing to find your strengths!</span>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
                <TrendingDown className="h-4 w-4" /> Key Weaknesses
              </div>
              <div className="flex flex-wrap gap-2">
                {data.weaknesses.length > 0 ? data.weaknesses.slice(0, 3).map((s: string) => (
                  <Badge key={s} variant="outline" className="bg-red-50 dark:bg-red-900/10 border-red-200">
                    {s.split(' > ').pop()}
                  </Badge>
                )) : <span className="text-sm text-muted-foreground">No weaknesses detected yet.</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preparation Timeline */}
      <DashboardTimeline 
        targetExamYear={data.targetExamYear} 
        strengths={data.strengths} 
        weaknesses={data.weaknesses} 
      />

      {/* Interactive Charts with Raw Stats */}
      <Card>
        <CardContent className="pt-6">
          <DashboardCharts 
            hierarchy={data.hierarchy} 
            totalRawAttempts={data.totalRawAttempts}
            totalRawCorrect={data.totalRawCorrect}
            totalRawWrong={data.totalRawWrong}
          />
        </CardContent>
      </Card>
    </div>
  );
}
