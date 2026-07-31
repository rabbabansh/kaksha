/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { DashboardTimeline } from './dashboard-timeline';
import { Loader2, TrendingUp, TrendingDown, Award, Star, Medal, Zap, PlayCircle, History, BookOpen, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [res, histRes] = await Promise.all([
        fetch('/api/progress/dashboard'),
        fetch('/api/progress/history')
      ]);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
      
      const histJson = await histRes.json();
      if (histJson.success) {
         setHistoryData(histJson.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const getEstimatedPercentile = (score: number) => {
    if (score >= 90) return '99.5+';
    if (score >= 80) return (95 + (score - 80) * 0.45).toFixed(1); // 80=95, 90=99.5
    if (score >= 70) return (90 + (score - 70) * 0.5).toFixed(1);  // 70=90, 80=95
    if (score >= 60) return (80 + (score - 60) * 1.0).toFixed(1);  // 60=80, 70=90
    if (score >= 50) return (70 + (score - 50) * 1.0).toFixed(1);  // 50=70, 60=80
    if (score >= 30) return (40 + (score - 30) * 1.5).toFixed(1);  // 30=40, 50=70
    return Math.max(0, score).toFixed(1);
  };

  return (
    <div className="space-y-6 mb-12">
      {/* Overview Metric & Gamification */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:col-span-2 border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription className="text-primary font-medium flex items-center gap-2 tracking-wider uppercase text-xs">
                  <Award className="h-4 w-4" /> Overall Mastery Profile
                </CardDescription>
                <CardTitle className="text-6xl font-black flex items-baseline gap-2 tracking-tighter mt-1">
                  {data.overallScore}
                  <span className="text-2xl text-muted-foreground font-semibold">/ 100</span>
                </CardTitle>
              </div>
              <div className="text-right flex flex-col items-end">
                <Badge className="bg-indigo-600 text-white border-0 font-black text-sm px-3 py-1 shadow-md">
                  {getEstimatedPercentile(data.overallScore)} %ile
                </Badge>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">Est. CAT Percentile</span>
              </div>
            </div>
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
            {data.weaknesses.length > 0 ? (() => {
              const targets = data.weaknesses.slice(0, 3);
              const taskStatuses = targets.map((w: string, i: number) => {
                 const subtopic = w.split(' > ').pop();
                 const tasks = ["Solve 10 Rapid Questions", "Complete 1 Practice Sprint", "Review Core Concepts"];
                 const taskName = tasks[i % tasks.length];
                 const attemptedToday = historyData?.attempts?.some((a: any) => {
                   if (a.question?.subtopic !== subtopic) return false;
                   const attemptDate = new Date(a.attemptedAt);
                   const today = new Date();
                   return attemptDate.getDate() === today.getDate() && 
                          attemptDate.getMonth() === today.getMonth() && 
                          attemptDate.getFullYear() === today.getFullYear();
                 });
                 return { subtopic, taskName, attemptedToday, w };
              });

              const allCompleted = taskStatuses.every((t: any) => t.attemptedToday);

              if (allCompleted) {
                return (
                  <div className="col-span-1 md:col-span-3 rounded-xl border-2 border-dashed border-green-500/50 bg-green-500/10 p-8 text-center flex flex-col items-center">
                    <Trophy className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="font-bold text-2xl mb-2 text-green-700 dark:text-green-400">All Daily Targets Completed!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">You've successfully finished your personalized Kaksha tasks for today. Keep up the streak!</p>
                    <Button className="bg-green-600 hover:bg-green-700 font-bold shadow-md" onClick={() => window.location.href='/practice/modules'}>
                      Unlock Bonus Sprint
                    </Button>
                  </div>
                );
              }

              return taskStatuses.map((t: any) => (
                  <div key={t.w} className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${t.attemptedToday ? 'bg-green-500/10 border-green-500/30' : 'bg-background hover:border-indigo-500 hover:shadow-md'}`}>
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           {t.attemptedToday ? (
                             <Badge className="bg-green-500 text-white border-0 font-bold">COMPLETED</Badge>
                           ) : (
                             <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-200 font-bold uppercase tracking-wider text-[10px]">Priority Task</Badge>
                           )}
                        </div>
                        <h4 className={`font-bold text-base leading-tight mb-1 ${t.attemptedToday ? 'line-through text-muted-foreground' : ''}`}>{t.taskName}</h4>
                        <p className={`text-sm ${t.attemptedToday ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>Focus: {t.subtopic}</p>
                     </div>
                     {!t.attemptedToday && (
                       <Button variant="default" size="sm" className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm font-bold" onClick={() => window.location.href=`/practice/modules/${encodeURIComponent(t.subtopic || '')}`}>
                          <PlayCircle className="h-4 w-4 mr-2" /> Start Now
                       </Button>
                     )}
                     {t.attemptedToday && (
                       <Button variant="outline" size="sm" className="mt-4 w-full border-green-500/30 text-green-700 bg-transparent cursor-default font-bold hover:bg-transparent">
                          Task Finished
                       </Button>
                     )}
                  </div>
              ));
            })() : (
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
            {historyData && (historyData.mockProgress.length > 0 || historyData.attempts.length > 0) ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {/* Render Mocks first */}
                {historyData.mockProgress.map((mock: any, idx: number) => (
                  <div key={`mock-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/5">Mock Test</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(mock.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold">CAT {mock.year} - Slot {mock.slot}</h4>
                      <p className="text-sm text-muted-foreground">Score: {mock.score || 'In Progress'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href=`/mocks/${mock.year}/${mock.slot}/report`}>
                      Review
                    </Button>
                  </div>
                ))}
                
                {/* Render Practice Module attempts by grouping recent subtopics */}
                {Object.entries(
                  historyData.attempts.reduce((acc: any, curr: any) => {
                    const key = curr.question?.subtopic;
                    if (!key) return acc;
                    if (!acc[key]) {
                      acc[key] = { subtopic: key, count: 0, date: curr.attemptedAt, topic: curr.question.topic, source: curr.source };
                    }
                    acc[key].count++;
                    return acc;
                  }, {})
                ).map(([key, group]: any, idx: number) => (
                  <div key={`prac-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-secondary/10">Practice</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(group.date).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold">{group.subtopic}</h4>
                      <p className="text-sm text-muted-foreground">{group.count} questions attempted in {group.topic}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href=`/practice/review/${encodeURIComponent(group.subtopic)}`}>
                      Review Sprint
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/20">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="font-bold text-lg mb-1">Your review hub is empty</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  As you complete Diagnostic tests and Daily Kaksha modules, they will automatically appear here. Jump back in to review incorrectly answered questions.
                </p>
                <Button onClick={() => window.location.href='/practice/modules'} className="font-bold shadow-sm">
                   Browse All Modules
                </Button>
              </div>
            )}
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
