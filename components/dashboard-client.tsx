'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeroCommandCenter } from './hero-command-center';
import { DynamicTimeline } from './dynamic-timeline';
import { DiagnosticsHub } from './diagnostics-hub';
import { MasterPathsProgression } from './master-paths-progression';
import { UserProfileModal } from './user-profile-modal';
import { 
  Loader2, 
  Zap, 
  PlayCircle, 
  History, 
  BookOpen, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      if (json.success) {
        setData(json.data);
      } else {
        console.error('Dashboard API failed:', json.error);
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

  // Filter and format history
  const combinedHistory = useMemo(() => {
    if (!historyData) return [];
    const mocks = (historyData.mockProgress || []).map((m: any) => ({
      type: 'mock',
      date: new Date(m.updatedAt || m.createdAt),
      data: m,
    }));
    
    // Group attempts by subtopic and date
    const attemptsBySession: Record<string, any> = {};
    (historyData.attempts || []).forEach((a: any) => {
      const dateStr = new Date(a.attemptedAt).toLocaleDateString();
      const subtopic = a.question?.subtopic || a.source || 'General Practice';
      const key = `${dateStr}_${subtopic}_${a.source}`;
      
      if (!attemptsBySession[key]) {
        attemptsBySession[key] = {
          type: 'practice',
          date: new Date(a.attemptedAt),
          subtopic,
          source: a.source,
          total: 0,
          correct: 0,
          questionId: a.questionId
        };
      }
      attemptsBySession[key].total += 1;
      if (a.isCorrect) attemptsBySession[key].correct += 1;
    });

    const practice = Object.values(attemptsBySession);

    return [...mocks, ...practice]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter(item => {
        if (historyFilter === 'Mock Test' && item.type !== 'mock') return false;
        if (historyFilter === 'Practice' && item.type !== 'practice') return false;
        
        if (historySearch) {
          const query = historySearch.toLowerCase();
          if (item.type === 'mock') {
            return `cat ${item.data.year} slot ${item.data.slot}`.toLowerCase().includes(query);
          } else {
            return item.subtopic.toLowerCase().includes(query) || (item.source && item.source.toLowerCase().includes(query));
          }
        }
        return true;
      });
  }, [historyData, historyFilter, historySearch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data. Please refresh.</p>
        <Button onClick={loadData} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Check today's 4 daily tasks status
  const todayStr = new Date().toDateString();
  const reviewTopic = data.weaknesses?.[0]?.split(' > ').pop() || 'Arithmetic';

  const dailyTasks = [
    {
      id: 'daily_rc',
      name: 'Daily RC Passage',
      badge: 'VARC',
      desc: 'CAT Reading Comprehension Set',
      subtopic: 'Reading Comprehension',
      action: 'Solve Passage',
      link: '/practice/daily/rc',
      attemptedToday: historyData?.attempts?.some((a: any) => {
        return new Date(a.attemptedAt).toDateString() === todayStr && 
          (a.source === 'daily_rc' || a.question?.subtopic?.toLowerCase().includes('reading comprehension'));
      })
    },
    {
      id: 'daily_dilr',
      name: 'Daily DILR Caselet',
      badge: 'DILR',
      desc: 'CAT Logic & Data Puzzle Set',
      subtopic: 'Logical Reasoning',
      action: 'Solve Caselet',
      link: '/practice/daily/dilr',
      attemptedToday: historyData?.attempts?.some((a: any) => {
        return new Date(a.attemptedAt).toDateString() === todayStr && 
          (a.source === 'daily_dilr' || a.question?.topic?.toLowerCase().includes('lr') || a.question?.topic?.toLowerCase().includes('di'));
      })
    },
    {
      id: 'review',
      name: 'Priority Concept Review',
      badge: 'QA / FOCUS',
      desc: `Target weak spot: ${reviewTopic}`,
      subtopic: reviewTopic,
      action: 'Start 10Q Sprint',
      link: `/practice/modules/${encodeURIComponent(reviewTopic)}`,
      attemptedToday: historyData?.attempts?.some((a: any) => {
        return a.question?.subtopic?.toLowerCase() === reviewTopic.toLowerCase() && new Date(a.attemptedAt).toDateString() === todayStr;
      })
    },
    {
      id: 'challenge',
      name: 'Daily Mixed Arena',
      badge: 'SPEED DRILL',
      desc: 'Mixed cross-topic speed sprint',
      subtopic: 'Mixed Arena',
      action: 'Enter Arena',
      link: '/practice/mixed',
      attemptedToday: historyData?.attempts?.some((a: any) => {
        return new Date(a.attemptedAt).toDateString() === todayStr && a.source === 'mixed';
      }) || historyData?.mockProgress?.some((s: any) => {
        return s.type === 'MIXED_SESSION' && new Date(s.updatedAt).toDateString() === todayStr;
      })
    }
  ];

  const allDailiesCompleted = dailyTasks.every(t => t.attemptedToday);

  return (
    <div className="space-y-8 mb-12">
      
      {/* 1. Diagnostic Alert Banner (if pending) */}
      {!data.diagnosticCompleted && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">Diagnostic Test Pending</h3>
              <p className="text-sm text-muted-foreground mt-1">You haven't taken your initial diagnostic test yet. Complete it to unlock personalized targets and accurate analytics.</p>
            </div>
            <Button onClick={() => window.location.href = '/diagnostic'} className="bg-orange-600 hover:bg-orange-700 font-bold whitespace-nowrap">
              Start Diagnostic Test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. Granular Quick Stats Row */}
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

      {/* 3. Hero Command Center (Mastery Profile + Consistency Calendar Heatmap) */}
      <HeroCommandCenter data={data} historyData={historyData} />

      {/* 4. Daily Kaksha Targets (4 Pillars: Daily RC, Daily DILR, QA Review, Mixed Challenge) */}
      <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/15 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/15 border-b border-border/40 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2 text-indigo-700 dark:text-indigo-400 tracking-tight">
                <Zap className="h-5 w-5 fill-indigo-500 text-indigo-500" /> Daily Kaksha Targets
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Complete all 4 daily pillars (RC passage, DILR caselet, QA review, and Mixed arena) to build unstoppable consistency.
              </CardDescription>
            </div>
            {allDailiesCompleted && (
              <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-1 self-start sm:self-auto shadow-sm">
                ✨ ALL DAILIES COMPLETED
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {allDailiesCompleted ? (
            <div className="rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 p-8 text-center flex flex-col items-center">
              <Trophy className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="font-extrabold text-2xl mb-1 text-emerald-800 dark:text-emerald-300">
                All 4 Daily Targets Conquered!
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6 text-xs sm:text-sm">
                You've completed today's RC passage, DILR caselet, Concept sprint, and Mixed challenge. Your streak is glowing!
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs h-10 shadow-md text-white" onClick={() => window.location.href = '/practice/modules'}>
                Unlock Bonus Module Sprint
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dailyTasks.map((t, idx) => (
                <div 
                  key={t.id} 
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all duration-200 ${
                    t.attemptedToday 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300' 
                      : 'bg-card border-border/80 hover:border-primary/50 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <Badge variant="outline" className="text-[10px] font-black tracking-wider uppercase">
                        {t.badge}
                      </Badge>
                      {t.attemptedToday ? (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> DONE
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          TARGET {idx + 1}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-base text-foreground leading-snug">{t.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">{t.desc}</p>
                  </div>

                  <Link href={t.link} className="w-full mt-2">
                    <Button
                      variant={t.attemptedToday ? 'outline' : 'default'}
                      size="sm"
                      className={`w-full font-bold text-xs h-9 ${
                        t.attemptedToday 
                          ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10' 
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                      }`}
                    >
                      {t.attemptedToday ? 'Reattempt Target' : <><PlayCircle className="h-3.5 w-3.5 mr-1.5" /> {t.action}</>}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Adaptive Preparation Roadmap & Velocity Gauge */}
      <DynamicTimeline
        targetExamYear={data.targetExamYear || '2026'}
        overallScore={data.overallScore || 0}
        totalAttempts={data.totalRawAttempts || 0}
        strengths={data.strengths || []}
        weaknesses={data.weaknesses || []}
      />

      {/* 6. Unified Diagnostics & Competency Hub (Topic Hierarchy + Deep Dive Charts) */}
      <DiagnosticsHub
        hierarchy={data.hierarchy}
        totalRawAttempts={data.totalRawAttempts}
        totalRawCorrect={data.totalRawCorrect}
        totalRawWrong={data.totalRawWrong}
      />

      {/* 7. Dynamic Master Paths Progression */}
      <MasterPathsProgression hierarchy={data.hierarchy} />

      {/* 8. History & Review Hub */}
      <Card className="shadow-sm border-border/80 bg-card overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
                <History className="h-5 w-5 text-primary shrink-0" /> History & Review Hub
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Revisit past sessions, inspect detailed performance reports, and learn from mistakes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search history..."
                className="w-full sm:w-48 h-8 text-xs rounded-lg"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
              <Select value={historyFilter} onValueChange={setHistoryFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
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
        <CardContent className="p-6">
          {historyData && (historyData.mockProgress?.length > 0 || historyData.attempts?.length > 0) ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {combinedHistory.map((item, idx) => {
                if (item.type === 'mock') {
                  const mock = item.data;
                  return (
                    <div key={`hist-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors bg-background">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-bold">Mock Test</Badge>
                          <span className="text-xs text-muted-foreground font-medium">{new Date(mock.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-sm">CAT {mock.year} - Slot {mock.slot}</h4>
                        <p className="text-xs text-muted-foreground">Score: {mock.score || 'In Progress'}</p>
                      </div>
                      <Link href={`/mocks/${mock.year}/${mock.slot}/report`}>
                        <Button variant="outline" size="sm" className="font-bold text-xs h-8">
                          Review
                        </Button>
                      </Link>
                    </div>
                  );
                }

                return (
                  <div key={`hist-${idx}`} className="p-4 border rounded-xl flex items-center justify-between hover:bg-muted/30 transition-colors bg-background">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {item.source === 'daily_rc' ? 'Daily RC' : item.source === 'daily_dilr' ? 'Daily DILR' : item.source === 'mixed' ? 'Mixed Arena' : 'Practice Sprint'}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">{item.date.toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm">{item.subtopic}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.correct} / {item.total} Correct ({Math.round((item.correct / item.total) * 100)}% Accuracy)
                      </p>
                    </div>
                    <Link href={`/practice/modules/${encodeURIComponent(item.subtopic)}`}>
                      <Button variant="outline" size="sm" className="font-bold text-xs h-8">
                        Re-practice
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs font-medium">
              No practice attempts recorded yet. Start your first sprint above!
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Modal */}
      {selectedProfileId && (
        <UserProfileModal
          userId={selectedProfileId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
      )}

    </div>
  );
}
