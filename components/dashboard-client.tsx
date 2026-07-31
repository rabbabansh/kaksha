/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { DashboardTimeline } from './dashboard-timeline';
import { Loader2, TrendingUp, TrendingDown, Award, Star, Medal, Zap, PlayCircle, History, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-medium flex items-center gap-2 tracking-wider uppercase text-xs">
              <Award className="h-4 w-4" /> Overall Mastery Profile
            </CardDescription>
            <CardTitle className="text-6xl font-black flex items-baseline gap-2 tracking-tighter">
              {data.overallScore}
              <span className="text-2xl text-muted-foreground font-semibold">/ 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your Kaksha Score dynamically adjusts based on Item Response Theory and daily consistency.
            </p>
            <div className="flex gap-6 border-t pt-4 border-primary/10">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">XP Earned</p>
                <p className="text-xl font-black text-yellow-500 flex items-center gap-1"><Star className="h-5 w-5 fill-yellow-500"/> {data.xp}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Badges</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.badges?.length > 0 ? data.badges.map((b: string) => (
                    <Badge key={b} variant="secondary" className="text-xs font-bold shadow-sm border-primary/10"><Medal className="h-3 w-3 mr-1 text-primary"/>{b}</Badge>
                  )) : <span className="text-sm text-muted-foreground font-medium">Complete tasks to unlock!</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SWOT */}
        <Card className="col-span-1 md:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Competency Matrix</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-wider mb-3">
                <TrendingUp className="h-4 w-4" /> Top Strengths
              </div>
              <div className="flex flex-col gap-2">
                {data.strengths.length > 0 ? data.strengths.slice(0, 3).map((s: string) => (
                  <div key={s} className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 text-sm font-semibold flex items-center justify-between">
                    <span className="truncate">{s.split(' > ').pop()}</span>
                    <span className="text-xs text-green-600 opacity-60">Mastered</span>
                  </div>
                )) : <span className="text-sm text-muted-foreground">Keep practicing to find your strengths!</span>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider mb-3">
                <TrendingDown className="h-4 w-4" /> Key Weaknesses
              </div>
              <div className="flex flex-col gap-2">
                {data.weaknesses.length > 0 ? data.weaknesses.slice(0, 3).map((s: string) => (
                  <div key={s} className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 text-sm font-semibold flex items-center justify-between">
                    <span className="truncate">{s.split(' > ').pop()}</span>
                    <span className="text-xs text-red-600 opacity-60">Needs Work</span>
                  </div>
                )) : <span className="text-sm text-muted-foreground">No weaknesses detected yet.</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Task Engine */}
        <Card className="col-span-1 md:col-span-4 border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm mt-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Zap className="h-5 w-5 fill-indigo-500" /> Daily Kaksha Targets
            </CardTitle>
            <CardDescription className="text-indigo-900/70 dark:text-indigo-300/70 font-medium">Actionable practice modules dynamically generated to target your weakest subtopics today.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.weaknesses.length > 0 ? data.weaknesses.slice(0, 3).map((w: string, i: number) => {
               const subtopic = w.split(' > ').pop();
               const tasks = ["Solve 5 Rapid Questions", "Complete 1 Section Set", "Review Core Concepts"];
               const task = tasks[i % tasks.length];
               
               return (
                 <a key={w} href={`/practice/mixed?topic=${encodeURIComponent(subtopic || '')}`} className="block group">
                   <div className="p-5 rounded-xl border-2 border-indigo-100 dark:border-indigo-800/50 bg-background hover:border-indigo-400 hover:shadow-md transition-all duration-200">
                     <div className="flex justify-between items-start mb-3">
                       <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                         {subtopic}
                       </Badge>
                       <span className="text-xs font-black text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">+50 XP</span>
                     </div>
                     <h4 className="font-extrabold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{task}</h4>
                     <p className="text-xs text-muted-foreground flex items-center gap-1 font-semibold uppercase tracking-wider">
                       <PlayCircle className="h-4 w-4" /> Start Module
                     </p>
                   </div>
                 </a>
               );
            }) : (
               <div className="col-span-3 text-center py-6 text-muted-foreground font-medium">
                  Complete your Diagnostic test to unlock daily targets.
               </div>
            )}
          </CardContent>
        </Card>

        {/* History & Review Hub */}
        <Card className="col-span-1 md:col-span-4 mt-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> History & Review Hub
            </CardTitle>
            <CardDescription>Revisit your recent modules and learn from your mistakes using the AI Tutor.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/20">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-bold text-lg mb-1">Your review hub is ready</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                As you complete Diagnostic tests and Daily Kaksha modules, they will automatically appear here. Jump back in to review incorrectly answered questions.
              </p>
              <Button onClick={() => window.location.href='/practice/modules'} className="font-bold shadow-sm">
                 Browse All Modules
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preparation Timeline */}
      <div className="mt-8">
        <DashboardTimeline 
          targetExamYear={data.targetExamYear} 
          strengths={data.strengths} 
          weaknesses={data.weaknesses} 
        />
      </div>

      {/* Interactive Charts with Raw Stats */}
      <Card className="shadow-sm mt-8">
        <CardHeader>
           <CardTitle>Deep Dive Analytics</CardTitle>
           <CardDescription>Click on any bar to drill down into specific topic mastery.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
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
