'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HeroCommandCenter } from './hero-command-center';
import { DynamicTimeline } from './dynamic-timeline';
import { DashboardCharts } from './dashboard-charts';
import { DailyTargetsWidget } from './daily-targets-widget';
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
  ArrowRight,
  Flame,
  Target,
  BarChart3
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

  // The logic for Daily Tasks is now encapsulated in DailyTargetsWidget.

  return (
    <div className="space-y-8 mb-12">
      
      {/* 1. Overall Profile */}
      <HeroCommandCenter
        totalAttempts={data.totalRawAttempts}
        totalCorrect={data.totalRawCorrect}
        targetExamYear={data.targetExamYear}
        targetExamSlot={data.targetExamSlot}
        heatmapData={data.heatmapData}
        heatmapMax={data.heatmapMax}
        streak={data.streak}
      />

      {/* 2. Diagnostic Alert Banner (if pending) */}
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

      {/* 3. The 4 Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/80 bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Attempted</span>
            <span className="text-2xl font-black text-foreground">{data.totalRawAttempts}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/80 bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Correct</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{data.totalRawCorrect}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/80 bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Incorrect</span>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">{data.totalRawWrong}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/80 bg-card">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Overall Accuracy</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {data.totalRawAttempts > 0 ? Math.round((data.totalRawCorrect / data.totalRawAttempts) * 100) : 0}%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 4. Quick Buttons Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-16 flex flex-col gap-1 items-center justify-center shadow-sm font-bold bg-muted/20" onClick={() => document.getElementById('daily-tasks')?.scrollIntoView({ behavior: 'smooth' })}>
          <Target className="h-5 w-5 text-indigo-500" />
          <span className="text-[11px] uppercase tracking-wider">Daily Tasks</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1 items-center justify-center shadow-sm font-bold bg-muted/20" onClick={() => document.getElementById('diagnostics-hub')?.scrollIntoView({ behavior: 'smooth' })}>
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          <span className="text-[11px] uppercase tracking-wider">Diagnostics</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1 items-center justify-center shadow-sm font-bold bg-muted/20" onClick={() => document.getElementById('master-paths')?.scrollIntoView({ behavior: 'smooth' })}>
          <BookOpen className="h-5 w-5 text-orange-500" />
          <span className="text-[11px] uppercase tracking-wider">Master Plans</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1 items-center justify-center shadow-sm font-bold bg-muted/20" onClick={() => document.getElementById('history-hub')?.scrollIntoView({ behavior: 'smooth' })}>
          <History className="h-5 w-5 text-blue-500" />
          <span className="text-[11px] uppercase tracking-wider">History</span>
        </Button>
      </div>

      {/* 5. Daily Targets */}
      <div id="daily-tasks">
        <DailyTargetsWidget />
      </div>

      {/* 6. Unified Diagnostics & Competency Hub */}
      <div id="diagnostics-hub">
        <DiagnosticsHub
          hierarchy={data.hierarchy}
          totalRawAttempts={data.totalRawAttempts}
          totalRawCorrect={data.totalRawCorrect}
          totalRawWrong={data.totalRawWrong}
        />
      </div>

      {/* 7. Adaptive Preparation Roadmap & Master Paths */}
      <div id="master-paths" className="space-y-4">
        <h3 className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight px-1">
          <BookOpen className="h-5 w-5 text-indigo-500 shrink-0" /> Interactive Roadmap & Master Paths
        </h3>
        <DynamicTimeline
          targetExamYear={data.targetExamYear || '2026'}
          overallScore={data.overallScore || 0}
          totalAttempts={data.totalRawAttempts || 0}
          strengths={data.strengths || []}
          weaknesses={data.weaknesses || []}
        />
        <MasterPathsProgression hierarchy={data.hierarchy} />
      </div>

      {/* 8. History & Review Hub */}
      <Card id="history-hub" className="shadow-sm border-border/80 bg-card overflow-hidden">
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
