'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubtopicsExplorerModal } from './subtopics-explorer-modal';
import { BadgeInfoModal } from './badge-info-modal';
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
  Calendar as CalendarIcon,
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Target, 
  FileText,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// --- Heatmap Logic & Types (from progress-calendar.tsx) ---

export interface DayDetail {
  dateStr: string;
  displayDate: string;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  topics: string[];
  mockTests: any[];
  practiceSprints: any[];
  mixedSessions: any[];
  dailyTasks: any[];
  allDailiesCompleted: boolean;
}

function formatLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

// ----------------------------------------------------

interface HeroCommandCenterProps {
  data: any;
  historyData: any;
}

export function HeroCommandCenter({ data, historyData }: HeroCommandCenterProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [streakDialogOpen, setStreakDialogOpen] = useState(false);
  const todayStr = useMemo(() => formatLocalDateKey(new Date()), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const getEstimatedPercentile = (score: number) => {
    if (score >= 90) return '99.5+';
    if (score >= 80) return (95 + (score - 80) * 0.45).toFixed(1);
    if (score >= 70) return (90 + (score - 70) * 0.5).toFixed(1);
    if (score >= 60) return (80 + (score - 60) * 1.0).toFixed(1);
    if (score >= 50) return (70 + (score - 50) * 1.0).toFixed(1);
    if (score >= 30) return (40 + (score - 30) * 1.5).toFixed(1);
    return Math.max(0, score).toFixed(1);
  };

  // Build day map for heatmap
  const weaknesses = data?.weaknesses || [];
  const reviewTopic = weaknesses[0]?.split(' > ').pop() || 'Percentage';

  const getEmptyDay = (dateStr: string): DayDetail => {
    const dateObj = parseLocalDateKey(dateStr);
    const displayDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const dailyTasks = [
      { id: 'daily_rc', name: 'Daily RC Passage', desc: 'CAT Reading Comprehension', subtopic: 'Reading Comprehension', action: 'Solve Passage', link: '/practice/daily/rc', completed: false },
      { id: 'daily_dilr', name: 'Daily DILR Set', desc: 'Logic & Data Caselet', subtopic: 'Logical Reasoning', action: 'Solve Set', link: '/practice/daily/dilr', completed: false },
      { id: 'review', name: 'Review Weakness', desc: 'Strengthen weak areas', subtopic: reviewTopic, action: 'Practice Sprint', link: `/practice/modules/${encodeURIComponent(reviewTopic)}`, completed: false },
      { id: 'challenge', name: 'Daily Challenge', desc: 'Mixed concepts sprint', subtopic: 'Mixed Arena', action: 'Enter Arena', link: '/practice/mixed', completed: false }
    ];

    return {
      dateStr, displayDate, totalAttempts: 0, totalCorrect: 0, accuracy: 0, topics: [], mockTests: [], practiceSprints: [], mixedSessions: [], dailyTasks, allDailiesCompleted: false
    };
  };

  const dayMap = useMemo(() => {
    const map: Record<string, DayDetail> = {};

    if (historyData?.attempts) {
      historyData.attempts.forEach((att: any) => {
        if (!att.attemptedAt) return;
        const attDate = new Date(att.attemptedAt);
        const dateStr = formatLocalDateKey(attDate);
        if (!map[dateStr]) map[dateStr] = getEmptyDay(dateStr);
        const day = map[dateStr];
        day.totalAttempts += 1;
        if (att.isCorrect) day.totalCorrect += 1;

        const topicName = att.question?.subtopic || att.question?.topic;
        if (topicName && !day.topics.includes(topicName)) day.topics.push(topicName);

        const subtopic = att.question?.subtopic;
        if (subtopic) {
          let sprint = day.practiceSprints.find(s => s.subtopic === subtopic);
          if (!sprint) {
            sprint = { subtopic, topic: att.question?.topic || 'Practice', count: 0, correctCount: 0, source: att.source || 'practice' };
            day.practiceSprints.push(sprint);
          }
          sprint.count += 1;
          if (att.isCorrect) sprint.correctCount += 1;
        }

        if (att.source === 'mixed') {
          if (day.mixedSessions.length === 0) day.mixedSessions.push({ count: 0, correctCount: 0 });
          day.mixedSessions[0].count += 1;
          if (att.isCorrect) day.mixedSessions[0].correctCount += 1;
        }
      });
    }

    if (historyData?.mockProgress) {
      historyData.mockProgress.forEach((sess: any) => {
        const sessDate = new Date(sess.updatedAt || sess.createdAt);
        const dateStr = formatLocalDateKey(sessDate);
        if (!map[dateStr]) map[dateStr] = getEmptyDay(dateStr);
        const day = map[dateStr];

        if (sess.type === 'MOCK') {
          if (!day.mockTests.some(m => m.id === sess.id)) {
            day.mockTests.push({ id: sess.id, year: sess.year || 'Unknown', slot: sess.slot || '1', score: sess.score, completed: sess.completed, date: sessDate.toLocaleDateString() });
            if (sess.topic && !day.topics.includes(`CAT ${sess.year}`)) day.topics.push(`CAT ${sess.year}`);
          }
        } else if (sess.type === 'MIXED_SESSION') {
          if (day.mixedSessions.length === 0) {
            let count = 0;
            try { count = Object.keys(JSON.parse(sess.answers || '{}')).length; } catch (e) {}
            day.mixedSessions.push({ count: count || sess.totalQuestions || 1, correctCount: sess.correct || 0 });
          }
        }
      });
    }

    Object.values(map).forEach(day => {
      day.accuracy = day.totalAttempts > 0 ? Math.round((day.totalCorrect / day.totalAttempts) * 100) : 0;
      day.dailyTasks.forEach(task => {
        if (task.id === 'daily_rc') {
          task.completed = day.practiceSprints.some(s => s.source === 'daily_rc' || s.subtopic.toLowerCase().includes('reading comprehension')) || day.topics.some(t => t.toLowerCase().includes('reading comprehension'));
        } else if (task.id === 'daily_dilr') {
          task.completed = day.practiceSprints.some(s => s.source === 'daily_dilr' || s.topic.toLowerCase().includes('lr') || s.topic.toLowerCase().includes('di') || s.subtopic.toLowerCase().includes('puzzle') || s.subtopic.toLowerCase().includes('arrangement')) || day.topics.some(t => t.toLowerCase().includes('data interpretation') || t.toLowerCase().includes('logical reasoning') || t.toLowerCase().includes('puzzle'));
        } else if (task.id === 'challenge') {
          task.completed = day.mixedSessions.length > 0 || day.practiceSprints.some(s => s.source === 'mixed');
        } else {
          task.completed = day.practiceSprints.some(s => s.subtopic.toLowerCase() === task.subtopic.toLowerCase()) || day.topics.some(t => t.toLowerCase() === task.subtopic.toLowerCase());
        }
      });
      day.allDailiesCompleted = day.dailyTasks.every(t => t.completed);
    });

    return map;
  }, [historyData, weaknesses]);

  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const days: { dateObj: Date; dateStr: string }[] = [];
    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ dateObj: d, dateStr: formatLocalDateKey(d) });
    }
    const weeks: { dateObj: Date; dateStr: string }[][] = [];
    let currentWeek: { dateObj: Date; dateStr: string }[] = [];
    const firstDayOfWeek = days[0].dateObj.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ dateObj: new Date(0), dateStr: '' });
    }
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) { currentWeek.push({ dateObj: new Date(0), dateStr: '' }); }
      weeks.push(currentWeek);
    }
    return weeks;
  }, []);

  const currentDayDetail = useMemo((): DayDetail => {
    if (dayMap[selectedDateStr]) return dayMap[selectedDateStr];
    return getEmptyDay(selectedDateStr);
  }, [dayMap, selectedDateStr]);

  const getHeatmapColor = (totalAttempts: number, allDailies: boolean) => {
    if (totalAttempts === 0) return 'bg-muted/40 dark:bg-muted/20 border-border/50';
    if (allDailies) return 'bg-emerald-500 border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
    if (totalAttempts < 5) return 'bg-indigo-300 dark:bg-indigo-900/60 border-indigo-400 dark:border-indigo-800';
    if (totalAttempts < 15) return 'bg-indigo-400 dark:bg-indigo-700/80 border-indigo-500 dark:border-indigo-600';
    if (totalAttempts < 35) return 'bg-indigo-500 dark:bg-indigo-600 border-indigo-600 dark:border-indigo-500';
    return 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-400';
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    if (!drawerOpen) setDrawerOpen(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-card shadow-sm overflow-hidden transition-all duration-300">
      <CardContent className="p-0">
        
        {/* Main Banner Flex Row */}
        <div className="flex flex-col lg:flex-row">
          
          {/* Left: Mastery Profile */}
          <div className="flex-1 p-6 lg:border-r border-border/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] bg-primary/5">
                    <Award className="h-3 w-3 mr-1" /> Global Mastery Profile
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <CardTitle className="text-6xl font-black flex items-baseline gap-2 tracking-tighter text-foreground">
                    {data.overallScore}
                    <span className="text-xl text-muted-foreground font-semibold">/ 100</span>
                  </CardTitle>
                  <Badge variant="secondary" className="font-extrabold text-sm px-3 py-1 self-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Grade {data.overallScore >= 90 ? 'A+' : data.overallScore >= 75 ? 'A' : data.overallScore >= 60 ? 'B' : data.overallScore >= 40 ? 'C' : 'D'}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary" aria-label="Scoring Info">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>How Kaksha Scoring Works</DialogTitle></DialogHeader>
                      <div className="space-y-4 text-sm mt-4">
                        <p><strong>Overall Kaksha Score (0-100):</strong> Your global mastery level using Item Response Theory.</p>
                        <p><strong>Sectional Score:</strong> Aggregates your performance across QA, VARC, and DILR.</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-start gap-2 sm:gap-1 mt-2 sm:mt-0">
                <Badge className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white border-0 font-black text-sm px-3.5 py-1 shadow-md">
                  {getEstimatedPercentile(data.overallScore)} %ile
                </Badge>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  Est. Percentile
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                Your mastery adjusts dynamically. Explore your full skill breakdown or keep up your daily streak!
              </p>
              <SubtopicsExplorerModal hierarchy={data.hierarchy}>
                <Button variant="secondary" size="sm" className="font-bold text-xs shrink-0 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800">
                  <Layers className="w-4 h-4 mr-1.5" /> Full Skill Hierarchy
                </Button>
              </SubtopicsExplorerModal>
            </div>

            <div className="flex gap-4 sm:gap-6 pt-4 border-t border-border/40 flex-wrap items-center">
              {/* XP - Clickable */}
              <button
                onClick={() => setXpDialogOpen(true)}
                className="group text-left hover:bg-muted/40 rounded-xl px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                  XP <Info className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-lg font-black text-yellow-500 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500" /> {data.xp}
                </p>
              </button>
              <div className="h-8 w-px bg-border/60 hidden sm:block" />
              {/* Streak - Clickable */}
              <button
                onClick={() => setStreakDialogOpen(true)}
                className="group text-left hover:bg-muted/40 rounded-xl px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                  Streak <Info className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-lg font-black text-orange-500 flex items-center gap-1">
                  🔥 {data.currentStreak || 0}
                </p>
              </button>
              <div className="h-8 w-px bg-border/60 hidden sm:block" />
              {/* Best - Clickable */}
              <button
                onClick={() => setStreakDialogOpen(true)}
                className="group text-left hover:bg-muted/40 rounded-xl px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                  Best <Info className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-lg font-black text-foreground flex items-center gap-1">
                  🏆 {data.longestStreak || 0}
                </p>
              </button>
              <div className="h-8 w-px bg-border/60 hidden sm:block" />
              {/* Badges - Clickable */}
              <button
                onClick={() => setBadgeModalOpen(true)}
                className="group flex-1 min-w-[100px] text-left hover:bg-muted/40 rounded-xl px-2 py-1 -mx-2 -my-1 transition-colors"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1">
                  Badges <Info className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {data.badges?.length > 0 ? (
                    data.badges.slice(0, 3).map((b: string) => (
                      <Badge key={b} variant="secondary" className="text-[10px] font-bold py-0 h-5">
                        {b}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">None yet — keep going!</span>
                  )}
                  {data.badges?.length > 3 && (
                    <Badge variant="outline" className="text-[10px] font-bold py-0 h-5 text-primary">
                      +{data.badges.length - 3} more
                    </Badge>
                  )}
                </div>
              </button>
            </div>

          {/* XP Info Dialog */}
          <Dialog open={xpDialogOpen} onOpenChange={setXpDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> How XP Works</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">XP (Experience Points) track your total effort on Kaksha.</p>
                <div className="space-y-2">
                  {[['✅ Correct Answer', '+10 XP'], ['❌ Wrong Answer', '+2 XP'], ['🎯 Perfect Session', '+20 XP Bonus']].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                      <span className="font-medium">{k}</span>
                      <span className="font-black text-yellow-500">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Your current XP: <span className="font-black text-yellow-500">{data.xp}</span></p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Streak Info Dialog */}
          <Dialog open={streakDialogOpen} onOpenChange={setStreakDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="flex items-center gap-2">🔥 Streak Guide</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Current Streak</p>
                    <p className="text-3xl font-black text-orange-500">🔥 {data.currentStreak || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">days</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-1">Best Streak</p>
                    <p className="text-3xl font-black text-yellow-500">🏆 {data.longestStreak || 0}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">days</p>
                  </div>
                </div>
                <p className="text-muted-foreground">Practice <strong>at least 1 question</strong> every day to keep your streak alive. Missing a day resets it to 0!</p>
              </div>
            </DialogContent>
          </Dialog>

          {/* Badge Catalog Modal */}
          <BadgeInfoModal
            earnedBadges={data.badges || []}
            open={badgeModalOpen}
            onClose={() => setBadgeModalOpen(false)}
          />
          </div>

          {/* Right: Consistency Heatmap (Directly inside the row) */}
          <div className="p-6 lg:w-[45%] flex flex-col justify-center bg-muted/5 dark:bg-muted/10 relative">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" /> Consistency Heatmap
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
              >
                {drawerOpen ? 'Close Stats' : 'View Stats'} {drawerOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </div>
            
            <div className="overflow-x-auto pb-2 touch-pan-x no-scrollbar">
              <div className="flex gap-1.5 min-w-max justify-end">
                {calendarWeeks.map((week, wIdx) => (
                  <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      if (!day.dateStr) return <div key={`pad-${dIdx}`} className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px]" />;
                      const dayData = dayMap[day.dateStr];
                      const total = dayData?.totalAttempts || 0;
                      const allDailies = dayData?.allDailiesCompleted || false;
                      const isSelected = selectedDateStr === day.dateStr && drawerOpen;

                      return (
                        <TooltipProvider key={day.dateStr}>
                          <Tooltip delayDuration={50}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleDateClick(day.dateStr)}
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border transition-all duration-150 relative ${getHeatmapColor(total, allDailies)} ${
                                  isSelected 
                                    ? 'ring-2 ring-primary ring-offset-1 scale-125 z-10' 
                                    : 'hover:scale-110 hover:ring-1 hover:ring-primary/60'
                                }`}
                              >
                                {allDailies && <span className="absolute -top-1 -right-1 text-[6px] leading-none">✨</span>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-semibold p-2">
                              <p className="font-bold">{day.dateObj.toLocaleDateString()}</p>
                              <p className="text-muted-foreground">{total} Questions Attempted</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-muted-foreground font-medium">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/40" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-600" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Expandable Drawer for Heatmap Stats */}
        {drawerOpen && (
          <div className="border-t border-border/40 bg-muted/5 p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col lg:flex-row gap-8">
              
              <div className="lg:w-1/3 space-y-4">
                <div>
                  <h3 className="font-extrabold text-xl text-foreground tracking-tight flex items-center gap-2">
                    {currentDayDetail.displayDate}
                    {selectedDateStr === todayStr && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">TODAY</Badge>}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentDayDetail.totalAttempts > 0 
                      ? `${currentDayDetail.totalAttempts} questions attempted`
                      : 'No practice sessions logged on this day'}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background p-3 rounded-xl border border-border/50 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Attempts</span>
                    <span className="text-lg font-black text-foreground">{currentDayDetail.totalAttempts}</span>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border/50 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Correct</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{currentDayDetail.totalCorrect}</span>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border/50 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Accuracy</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{currentDayDetail.accuracy}%</span>
                  </div>
                </div>

                {currentDayDetail.topics.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Topics Practiced</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentDayDetail.topics.map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Sessions & Tests
                  </span>
                  
                  {currentDayDetail.mockTests.length === 0 && currentDayDetail.practiceSprints.length === 0 && currentDayDetail.mixedSessions.length === 0 ? (
                    <div className="text-center py-6 bg-background rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground">
                      No tests attempted.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {currentDayDetail.mockTests.map(mock => (
                        <div key={`mock-${mock.id}`} className="p-3 bg-background rounded-xl border border-border/70 flex items-center justify-between text-xs shadow-sm">
                          <div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-extrabold px-1.5 py-0 mb-1">MOCK</Badge>
                            <p className="font-bold text-foreground">CAT {mock.year} - Slot {mock.slot}</p>
                          </div>
                          <Link href={`/mocks/${mock.year}/${mock.slot}/report`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] font-bold">Review</Button>
                          </Link>
                        </div>
                      ))}
                      {currentDayDetail.practiceSprints.map((sprint, idx) => (
                        <div key={`sprint-${idx}`} className="p-3 bg-background rounded-xl border border-border/70 flex items-center justify-between text-xs shadow-sm">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-foreground truncate">{sprint.subtopic}</p>
                            <p className="text-[10px] text-muted-foreground">{sprint.count} Qs • {Math.round((sprint.correctCount / sprint.count) * 100)}% Acc</p>
                          </div>
                          <Link href={`/practice/review/${encodeURIComponent(sprint.subtopic)}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] font-bold shrink-0">Review</Button>
                          </Link>
                        </div>
                      ))}
                      {currentDayDetail.mixedSessions.map((mixed, idx) => (
                        <div key={`mixed-${idx}`} className="p-3 bg-background rounded-xl border border-border/70 flex items-center justify-between text-xs shadow-sm">
                          <div>
                            <p className="font-bold text-foreground">Mixed Challenge</p>
                            <p className="text-[10px] text-muted-foreground">{mixed.count} Qs • {mixed.count > 0 ? Math.round((mixed.correctCount / mixed.count) * 100) : 0}% Acc</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-500" /> Daily Targets
                  </span>
                  
                  <div className="space-y-2">
                    {currentDayDetail.dailyTasks?.map(task => (
                      <div key={task.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
                        task.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background border-border/60'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <p className={`font-bold truncate ${task.completed ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>{task.name}</p>
                          </div>
                        </div>
                        {!task.completed && currentDayDetail.dateStr === todayStr && (
                          <Link href={task.link} className="shrink-0">
                            <Button size="sm" className="h-6 px-2 text-[10px] font-bold bg-primary hover:bg-primary/90">Start</Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
