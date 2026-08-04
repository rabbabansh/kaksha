/* eslint-disable */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardCharts } from './dashboard-charts';
import { DashboardTimeline } from './dashboard-timeline';
import { UserProfileModal } from './user-profile-modal';
import { Loader2, TrendingUp, TrendingDown, Award, Star, Medal, Zap, PlayCircle, History, BookOpen, Trophy, CheckCircle2, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis as RXAxis, YAxis as RYAxis, Tooltip as RTooltip, ResponsiveContainer as RContainer, ReferenceDot, CartesianGrid } from 'recharts';

export function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('All');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  async function loadData() {
    try {
      const [res, histRes] = await Promise.all([
        fetch('/api/progress/dashboard', { cache: 'no-store' }),
        fetch('/api/progress/history', { cache: 'no-store' })
      ]);
      const json = await res.json();
      console.log('Dashboard API Response:', json);
      if (json.success) {
        setData(json.data);
      } else {
        console.error('Dashboard API failed:', json.error);
        alert('Dashboard failed to load: ' + json.error);
      }
      
      const histJson = await histRes.json();
      console.log('History API Response:', histJson);
      if (histJson.success) {
         setHistoryData(histJson.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      alert('Dashboard request crashed: ' + error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasSeenWhatsNew = localStorage.getItem('kaksha_whats_new_v1.2');
    console.log('DashboardClient useEffect running', { hasSeenWhatsNew });
    if (!hasSeenWhatsNew) {
      console.log('Redirecting to whats-new');
      window.location.href = '/whats-new';
    } else {
      console.log('Calling loadData()');
      loadData();
    }
  }, []);

  if (loading) {
    console.log('DashboardClient: rendering skeleton loaders');
    return (
      <div className="space-y-6 mb-12 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="col-span-1 md:col-span-2 h-64 rounded-xl" />
          <Skeleton className="col-span-1 md:col-span-2 h-64 rounded-xl" />
          <Skeleton className="col-span-1 md:col-span-4 h-48 rounded-xl" />
          <Skeleton className="col-span-1 md:col-span-4 h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  console.log('DashboardClient: loading finished', { data: !!data });
  if (!data) return null;

  console.log('DashboardClient: rendering main content');

  const getEstimatedPercentile = (score: number) => {
    if (score >= 90) return '99.5+';
    if (score >= 80) return (95 + (score - 80) * 0.45).toFixed(1); // 80=95, 90=99.5
    if (score >= 70) return (90 + (score - 70) * 0.5).toFixed(1);  // 70=90, 80=95
    if (score >= 60) return (80 + (score - 60) * 1.0).toFixed(1);  // 60=80, 70=90
    if (score >= 50) return (70 + (score - 50) * 1.0).toFixed(1);  // 50=70, 60=80
    if (score >= 30) return (40 + (score - 30) * 1.5).toFixed(1);  // 30=40, 50=70
    return Math.max(0, score).toFixed(1);
  };

  const practiceHistory = useMemo(() => {
    if (!historyData?.attempts) return [];
    const grouped = historyData.attempts.reduce((acc: any, curr: any) => {
      const key = curr.question?.subtopic;
      if (!key) return acc;
      
      const localDateStr = new Date(curr.attemptedAt).toLocaleDateString();
      const groupKey = `${key}_${localDateStr}`;
      
      if (!acc[groupKey]) {
        acc[groupKey] = { subtopic: key, count: 0, date: localDateStr, topic: curr.question.topic, source: curr.source };
      }
      acc[groupKey].count++;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [historyData]);

  const filteredPracticeHistory = useMemo(() => {
    if (historyFilter !== 'All' && historyFilter !== 'Practice') return [];
    return practiceHistory.filter((g: any) => g.subtopic.toLowerCase().includes(historySearch.toLowerCase()));
  }, [practiceHistory, historyFilter, historySearch]);

  const filteredMockHistory = useMemo(() => {
    if (!historyData?.mockProgress) return [];
    if (historyFilter !== 'All' && historyFilter !== 'Mock Test') return [];
    return historyData.mockProgress.filter((mock: any) => `CAT ${mock.year}`.toLowerCase().includes(historySearch.toLowerCase()));
  }, [historyData, historyFilter, historySearch]);

  return (
    <div className="space-y-6 mb-12">
      {!data.diagnosticCompleted && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">Diagnostic Test Pending</h3>
              <p className="text-sm text-muted-foreground mt-1">You haven't taken your initial diagnostic test yet. Complete it to unlock personalized targets and accurate analytics.</p>
            </div>
            <Button onClick={() => window.location.href='/diagnostic'} className="bg-orange-600 hover:bg-orange-700 font-bold whitespace-nowrap">
              Start Diagnostic Test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3.2 Granular Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Attempted</span>
             <span className="text-3xl font-black mt-1 text-indigo-700 dark:text-indigo-400">{data.totalRawAttempts}</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accuracy Rate</span>
             <span className="text-3xl font-black mt-1 text-green-700 dark:text-green-400">{data.totalRawAttempts > 0 ? Math.round((data.totalRawCorrect / data.totalRawAttempts) * 100) : 0}%</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Correct</span>
             <span className="text-3xl font-black mt-1 text-yellow-700 dark:text-yellow-400">{data.totalRawCorrect}</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Incorrect</span>
             <span className="text-3xl font-black mt-1 text-red-700 dark:text-red-400">{data.totalRawWrong}</span>
          </CardContent>
        </Card>
      </div>

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
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex flex-wrap gap-2 mt-1 cursor-pointer">
                      {data.badges?.length > 0 ? data.badges.map((b: string) => (
                        <TooltipProvider key={b}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-xs font-bold shadow-sm border-primary/10 hover:bg-primary/20 transition-colors"><Medal className="h-3 w-3 mr-1 text-primary"/>{b}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>Earned for excellence in {b}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )) : <span className="text-sm text-muted-foreground font-medium hover:underline">Complete tasks to unlock!</span>}
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Kaksha Badges</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-6 py-8">
                       {data.badges?.map((b: string) => (
                         <div key={b} className="text-center flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3 border-2 border-yellow-500">
                               <Medal className="h-8 w-8 text-yellow-600 dark:text-yellow-400"/>
                            </div>
                            <span className="text-sm font-bold leading-tight">{b}</span>
                         </div>
                       ))}
                       <div className="text-center flex flex-col items-center opacity-40 grayscale">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3 border-2 border-muted-foreground">
                             <Medal className="h-8 w-8 text-muted-foreground"/>
                          </div>
                          <span className="text-sm font-bold leading-tight">QA Master</span>
                       </div>
                       <div className="text-center flex flex-col items-center opacity-40 grayscale">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3 border-2 border-muted-foreground">
                             <Medal className="h-8 w-8 text-muted-foreground"/>
                          </div>
                          <span className="text-sm font-bold leading-tight">Speed Demon</span>
                       </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <Link href={`/practice/modules/${encodeURIComponent(s.split(' > ').pop() || '')}`} key={s} className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 text-sm font-semibold flex items-center justify-between hover:border-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 transition-all cursor-pointer group">
                    <span className="truncate">{s.split(' > ').pop()}</span>
                    <span className="text-xs text-green-600 opacity-60 group-hover:opacity-100 flex items-center">Mastered <PlayCircle className="h-3 w-3 ml-1" /></span>
                  </Link>
                )) : <span className="text-sm text-muted-foreground">Keep practicing to find your strengths!</span>}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider mb-3">
                <TrendingDown className="h-4 w-4" /> Key Weaknesses
              </div>
              <div className="flex flex-col gap-2">
                {data.weaknesses.length > 0 ? data.weaknesses.slice(0, 3).map((s: string) => (
                  <Link href={`/practice/modules/${encodeURIComponent(s.split(' > ').pop() || '')}`} key={s} className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 text-sm font-semibold flex items-center justify-between hover:border-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all cursor-pointer group">
                    <span className="truncate">{s.split(' > ').pop()}</span>
                    <span className="text-xs text-red-600 opacity-60 group-hover:opacity-100 flex items-center">Needs Work <PlayCircle className="h-3 w-3 ml-1" /></span>
                  </Link>
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
          <CardContent>
            {data.weaknesses.length > 0 ? (() => {
              const reviewTopic = data.weaknesses[0]?.split(' > ').pop() || 'Percentage';
              const newTopic = data.weaknesses[1]?.split(' > ').pop() || 'Average';
              
              const tasks = [
                 { id: 'review', name: 'Review', desc: 'Strengthen weak areas', subtopic: reviewTopic, action: 'Solve 10 Questions' },
                 { id: 'new', name: 'Learn New', desc: 'Advance your Master Path', subtopic: newTopic, action: 'Complete Module' },
                 { id: 'challenge', name: 'Daily Challenge', desc: 'Mixed concepts sprint', subtopic: 'Mixed Arena', action: 'Enter Arena', link: '/practice/mixed' }
              ];
              
              const taskStatuses = tasks.map((t) => {
                 let attemptedToday = false;
                 if (t.id === 'challenge') {
                    attemptedToday = historyData?.attempts?.some((a: any) => {
                       return new Date(a.attemptedAt).toDateString() === new Date().toDateString() && a.source === 'mixed';
                    });
                 } else {
                    attemptedToday = historyData?.attempts?.some((a: any) => {
                       return a.question?.subtopic === t.subtopic && new Date(a.attemptedAt).toDateString() === new Date().toDateString();
                    });
                 }
                 return { ...t, attemptedToday };
              });

              const allCompleted = taskStatuses.every((t) => t.attemptedToday);

              if (allCompleted) {
                return (
                  <div className="rounded-xl border-2 border-dashed border-green-500/50 bg-green-500/10 p-8 text-center flex flex-col items-center">
                    <Trophy className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="font-bold text-2xl mb-2 text-green-700 dark:text-green-400">All Daily Targets Completed!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">You've successfully finished your personalized Kaksha tasks for today. Keep up the streak!</p>
                    <Button className="bg-green-600 hover:bg-green-700 font-bold shadow-md" onClick={() => window.location.href='/practice/modules'}>
                      Unlock Bonus Sprint
                    </Button>
                  </div>
                );
              }

              return (
                 <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full relative">
                    {/* Background connecting line (desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-indigo-500/20 -translate-y-1/2 z-0 rounded-full" />
                    
                    {taskStatuses.map((t, idx) => (
                       <div key={t.id} className={`w-full md:w-1/3 p-5 rounded-2xl border-2 flex flex-col justify-between transition-transform duration-300 z-10 ${t.attemptedToday ? 'bg-green-500/10 border-green-500/30' : idx === 0 || taskStatuses[idx-1].attemptedToday ? 'bg-background border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-105' : 'bg-muted/50 border-muted opacity-60 grayscale'}`}>
                          <div>
                             <div className="flex items-center justify-between mb-3">
                                {t.attemptedToday ? (
                                  <Badge className="bg-green-500 text-white border-0 font-bold px-2 py-1"><CheckCircle2 className="h-3 w-3 mr-1" /> DONE</Badge>
                                ) : idx === 0 || taskStatuses[idx-1].attemptedToday ? (
                                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-200 font-bold uppercase tracking-wider text-[10px] animate-pulse">Up Next</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-transparent border-muted-foreground/30 text-muted-foreground font-bold uppercase tracking-wider text-[10px]"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>
                                )}
                                <span className="text-xs font-black text-muted-foreground/50">STEP {idx + 1}</span>
                             </div>
                             <h4 className={`font-black text-lg leading-tight mb-1 ${t.attemptedToday ? 'text-green-700 dark:text-green-400' : ''}`}>{t.name}</h4>
                             <p className="text-sm font-semibold text-muted-foreground mb-4">{t.desc}</p>
                             
                             <div className="bg-muted/50 rounded-lg p-3 mb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Focus Area</p>
                                <p className="font-semibold text-sm leading-tight">{t.subtopic}</p>
                             </div>
                          </div>
                          
                          <Button 
                             variant={t.attemptedToday ? 'outline' : 'default'} 
                             size="sm" 
                             className={`mt-auto w-full font-bold h-10 ${!t.attemptedToday && (idx === 0 || taskStatuses[idx-1].attemptedToday) ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : ''}`}
                             disabled={!t.attemptedToday && idx > 0 && !taskStatuses[idx-1].attemptedToday}
                             onClick={() => {
                                if (t.attemptedToday) return;
                                window.location.href = t.link ? t.link : `/practice/modules/${encodeURIComponent(t.subtopic)}`;
                             }}
                          >
                             {t.attemptedToday ? 'Task Finished' : <><PlayCircle className="h-4 w-4 mr-2" /> {t.action}</>}
                          </Button>
                       </div>
                    ))}
                 </div>
              );
            })() : (
               <div className="text-center py-8 text-muted-foreground font-medium bg-muted/20 rounded-xl border border-dashed border-border">
                  <h3 className="font-bold text-lg mb-2 text-foreground">Diagnostic Required</h3>
                  <p className="max-w-md mx-auto mb-4 text-sm">Complete your Diagnostic test to unlock personalized daily targets.</p>
                  <Button onClick={() => window.location.href='/diagnostic'} variant="outline" className="font-bold">Take Diagnostic</Button>
               </div>
            )}
          </CardContent>
        </Card>

        {/* History & Review Hub */}
        <Card className="col-span-1 md:col-span-4 mt-2 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> History & Review Hub
                </CardTitle>
                <CardDescription>Revisit your recent modules and learn from your mistakes.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Search subtopics..." 
                  className="w-full sm:w-48 h-9" 
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
                <Select value={historyFilter} onValueChange={setHistoryFilter}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Mock Test">Mock Tests</SelectItem>
                    <SelectItem value="Practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyData && (historyData.mockProgress.length > 0 || historyData.attempts.length > 0) ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {/* Render filtered Mocks */}
                {filteredMockHistory.map((mock: any, idx: number) => (
                  <div key={`mock-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">Mock Test</Badge>
                        <span className="text-xs text-muted-foreground font-medium">{new Date(mock.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold">CAT {mock.year} - Slot {mock.slot}</h4>
                      <p className="text-sm text-muted-foreground">Score: {mock.score || 'In Progress'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href=`/mocks/${mock.year}/${mock.slot}/report`}>
                      Review
                    </Button>
                  </div>
                ))}
                
                {/* Render filtered Practice Modules */}
                {filteredPracticeHistory.map((group: any, idx: number) => (
                  <div key={`prac-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-secondary/10 border-secondary/20">Practice</Badge>
                        <span className="text-xs text-muted-foreground font-medium">{group.date}</span>
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

      {/* Global Leaderboard & Bell Curve */}
      <Card className="shadow-sm mt-8 border-indigo-200 dark:border-indigo-900 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-indigo-100 dark:border-indigo-900">
           <CardTitle className="text-2xl flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
             <Medal className="h-6 w-6" /> Kaksha Global Leaderboard
           </CardTitle>
           <CardDescription className="text-indigo-900/70 dark:text-indigo-300/70 font-medium mt-1">See where you stand against the competition on the bell curve.</CardDescription>
        </div>
        <CardContent className="p-0 flex flex-col lg:flex-row">
           <div className="w-full lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-border">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Percentile Distribution</h4>
              <div className="h-[300px] w-full relative">
                 <RContainer width="100%" height="100%">
                    <LineChart data={[
                      { p: 0, v: 2 }, { p: 10, v: 10 }, { p: 20, v: 35 }, { p: 30, v: 80 }, { p: 40, v: 150 }, 
                      { p: 50, v: 200 }, { p: 60, v: 150 }, { p: 70, v: 80 }, { p: 80, v: 35 }, { p: 90, v: 10 }, { p: 100, v: 2 }
                    ]} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                       <RXAxis dataKey="p" type="number" domain={[0, 100]} tick={{fontSize: 12}} stroke="rgba(0,0,0,0.2)" />
                       <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={3} dot={false} fill="url(#colorV)" />
                       {/* Plot all users from DB */}
                       {data.allUsersDistribution?.map((u: any, idx: number) => {
                          const p = parseFloat(getEstimatedPercentile(u.score));
                          // Calculate y on the bell curve (max height is 200 at p=50)
                          const y = 200 * Math.exp(-Math.pow(p - 50, 2) / 400);
                          return (
                            <ReferenceDot 
                              key={`dot-${idx}`}
                              x={p} 
                              y={y} 
                              r={u.isUser ? 6 : 4} 
                              fill={u.isUser ? "#10b981" : "#6366f1"} 
                              stroke={u.isUser ? "#fff" : "none"} 
                              strokeWidth={u.isUser ? 2 : 0} 
                            />
                          );
                       })}
                       
                       <RTooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             const p = payload[0].payload.p;
                             // Find users who are close to this percentile
                             const closeUsers = data.allUsersDistribution?.filter((u: any) => {
                                const up = parseFloat(getEstimatedPercentile(u.score));
                                return Math.abs(up - p) <= 5;
                             }).sort((a: any, b: any) => b.score - a.score);
                             
                             return (
                                <div className="bg-background border shadow-xl rounded-xl p-4 min-w-[200px]">
                                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 border-b pb-2">{p}th Percentile</div>
                                   {closeUsers && closeUsers.length > 0 ? closeUsers.slice(0, 4).map((u: any, idx: number) => (
                                      <div key={idx} className={`flex items-center gap-3 py-1 ${!u.isUser ? 'opacity-70' : ''}`}>
                                         <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${u.isUser ? 'bg-green-500 ring-2 ring-green-200' : 'bg-indigo-400'}`}>
                                            {u.isUser ? 'YOU' : u.name.substring(0, 2).toUpperCase()}
                                         </div>
                                         <div>
                                            <p className={`font-bold text-sm leading-tight ${u.isUser ? 'text-green-600' : ''}`}>{u.isUser ? 'You' : u.name}</p>
                                            <p className="text-xs text-muted-foreground leading-tight">Score: {u.score}</p>
                                         </div>
                                      </div>
                                   )) : (
                                      <p className="text-sm text-muted-foreground py-2 italic">No users in this bracket yet.</p>
                                   )}
                                </div>
                             )
                          }
                          return null;
                       }} cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                    </LineChart>
                 </RContainer>
              </div>
           </div>
           <div className="w-full lg:w-1/2 p-0">
              <div className="flex justify-between items-center p-6 pb-2">
                 <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Top Performers</h4>
              </div>
              <div className="px-6 pb-6">
                 <div className="space-y-1">
                     {data.leaderboard?.length > 0 ? data.leaderboard.map((u: any) => {
                        const rankStyle = u.rank === 1 ? "bg-yellow-500/10 text-yellow-600 border-yellow-200" 
                                       : u.rank === 2 ? "bg-slate-200 text-slate-600 border-slate-300" 
                                       : u.rank === 3 ? "bg-orange-500/10 text-orange-600 border-orange-200" 
                                       : u.isUser ? "bg-green-500 border-green-600 text-white shadow-md"
                                       : "bg-muted text-muted-foreground border-transparent";
                        return (
                        <div 
                          key={u.rank} 
                          onClick={() => { setSelectedProfileId(u.userId); setProfileModalOpen(true); }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md ${u.isUser ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 'bg-transparent border-transparent hover:bg-muted/50'} transition-all`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${rankStyle}`}>{u.avatar}</div>
                              <div>
                                 <p className={`font-bold text-sm flex items-center gap-2 ${u.isUser ? 'text-green-700 dark:text-green-400' : ''}`}>
                                   {u.name}
                                   {u.rank <= 3 && <Trophy className={`h-3 w-3 ${u.rank === 1 ? 'text-yellow-500' : u.rank === 2 ? 'text-slate-400' : 'text-orange-500'}`} />}
                                 </p>
                                 <p className="text-xs text-muted-foreground truncate max-w-[150px]">Mastery: {u.strength}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-sm">{u.score}</p>
                              <p className="text-xs text-muted-foreground">{u.acc} acc</p>
                           </div>
                        </div>
                        );
                     }) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">No one is on the leaderboard yet. Start practicing to claim the top spot!</p>
                     )}
                  </div>
               </div>
            </div>
        </CardContent>
      </Card>

      <UserProfileModal 
         userId={selectedProfileId || ''} 
         open={profileModalOpen} 
         onOpenChange={setProfileModalOpen} 
      />

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
