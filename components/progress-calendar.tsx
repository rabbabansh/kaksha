'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Trophy, 
  Target, 
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface ProgressCalendarProps {
  historyData?: {
    attempts?: any[];
    mockProgress?: any[];
  };
  weaknesses?: string[];
}

export interface DayDetail {
  dateStr: string;
  displayDate: string;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  topics: string[];
  mockTests: {
    id: string;
    year: string;
    slot: string;
    score: number | null;
    completed: boolean;
    date: string;
  }[];
  practiceSprints: {
    subtopic: string;
    topic: string;
    count: number;
    correctCount: number;
    source: string;
  }[];
  mixedSessions: {
    count: number;
    correctCount: number;
  }[];
  dailyTasks: {
    id: string;
    name: string;
    desc: string;
    subtopic: string;
    action: string;
    link: string;
    completed: boolean;
  }[];
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

export function ProgressCalendar({ historyData, weaknesses = [] }: ProgressCalendarProps) {
  const todayStr = useMemo(() => formatLocalDateKey(new Date()), []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Fallback state if historyData is not passed as props
  const [fallbackHistory, setFallbackHistory] = useState<any>(null);
  const [loading, setLoading] = useState(!historyData);

  useEffect(() => {
    if (!historyData) {
      async function fetchHistory() {
        try {
          const res = await fetch('/api/progress/history', { cache: 'no-store' });
          const json = await res.json();
          if (json.success) {
            setFallbackHistory(json.data);
          }
        } catch (e) {
          console.error('Failed to load history for calendar', e);
        } finally {
          setLoading(false);
        }
      }
      fetchHistory();
    }
  }, [historyData]);

  const activeHistory = historyData || fallbackHistory;

  // Aggregate all history data by local date string ("YYYY-MM-DD")
  const dayMap = useMemo(() => {
    const map: Record<string, DayDetail> = {};

    const reviewTopic = weaknesses[0]?.split(' > ').pop() || 'Percentage';
    const newTopic = weaknesses[1]?.split(' > ').pop() || 'Average';

    const getEmptyDay = (dateStr: string): DayDetail => {
      const dateObj = parseLocalDateKey(dateStr);
      const displayDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const dailyTasks = [
        {
          id: 'daily_rc',
          name: 'Daily RC Passage',
          desc: 'CAT Reading Comprehension',
          subtopic: 'Reading Comprehension',
          action: 'Solve Passage',
          link: '/practice/daily/rc',
          completed: false
        },
        {
          id: 'daily_dilr',
          name: 'Daily DILR Set',
          desc: 'Logic & Data Caselet',
          subtopic: 'Logical Reasoning',
          action: 'Solve Set',
          link: '/practice/daily/dilr',
          completed: false
        },
        {
          id: 'review',
          name: 'Review Weakness',
          desc: 'Strengthen weak areas',
          subtopic: reviewTopic,
          action: 'Practice Sprint',
          link: `/practice/modules/${encodeURIComponent(reviewTopic)}`,
          completed: false
        },
        {
          id: 'challenge',
          name: 'Daily Challenge',
          desc: 'Mixed concepts sprint',
          subtopic: 'Mixed Arena',
          action: 'Enter Arena',
          link: '/practice/mixed',
          completed: false
        }
      ];

      return {
        dateStr,
        displayDate,
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        topics: [],
        mockTests: [],
        practiceSprints: [],
        mixedSessions: [],
        dailyTasks,
        allDailiesCompleted: false
      };
    };

    // 1. Process Question Attempts
    if (activeHistory?.attempts) {
      activeHistory.attempts.forEach((att: any) => {
        if (!att.attemptedAt) return;
        const attDate = new Date(att.attemptedAt);
        const dateStr = formatLocalDateKey(attDate);

        if (!map[dateStr]) {
          map[dateStr] = getEmptyDay(dateStr);
        }

        const day = map[dateStr];
        day.totalAttempts += 1;
        if (att.isCorrect) day.totalCorrect += 1;

        const topicName = att.question?.subtopic || att.question?.topic;
        if (topicName && !day.topics.includes(topicName)) {
          day.topics.push(topicName);
        }

        // Group into practice sprints
        const subtopic = att.question?.subtopic;
        if (subtopic) {
          let sprint = day.practiceSprints.find(s => s.subtopic === subtopic);
          if (!sprint) {
            sprint = {
              subtopic,
              topic: att.question?.topic || 'Practice',
              count: 0,
              correctCount: 0,
              source: att.source || 'practice'
            };
            day.practiceSprints.push(sprint);
          }
          sprint.count += 1;
          if (att.isCorrect) sprint.correctCount += 1;
        }

        // Mixed session attempts
        if (att.source === 'mixed') {
          if (day.mixedSessions.length === 0) {
            day.mixedSessions.push({ count: 0, correctCount: 0 });
          }
          day.mixedSessions[0].count += 1;
          if (att.isCorrect) day.mixedSessions[0].correctCount += 1;
        }
      });
    }

    // 2. Process Sessions (Mock Tests & Practice Modules)
    if (activeHistory?.mockProgress) {
      activeHistory.mockProgress.forEach((sess: any) => {
        const sessDate = new Date(sess.updatedAt || sess.createdAt);
        const dateStr = formatLocalDateKey(sessDate);

        if (!map[dateStr]) {
          map[dateStr] = getEmptyDay(dateStr);
        }

        const day = map[dateStr];

        if (sess.type === 'MOCK') {
          // Add to mock tests if not already present
          if (!day.mockTests.some(m => m.id === sess.id)) {
            day.mockTests.push({
              id: sess.id,
              year: sess.year || 'Unknown',
              slot: sess.slot || '1',
              score: sess.score,
              completed: sess.completed,
              date: sessDate.toLocaleDateString()
            });
            if (sess.topic && !day.topics.includes(`CAT ${sess.year}`)) {
              day.topics.push(`CAT ${sess.year}`);
            }
          }
        } else if (sess.type === 'MIXED_SESSION') {
          if (day.mixedSessions.length === 0) {
            let count = 0;
            try {
              const ans = JSON.parse(sess.answers || '{}');
              count = Object.keys(ans).length;
            } catch (e) {}
            day.mixedSessions.push({
              count: count || sess.totalQuestions || 1,
              correctCount: sess.correct || 0
            });
          }
        }
      });
    }

    // 3. Compute accuracy and daily task completion for each recorded date
    Object.values(map).forEach(day => {
      day.accuracy = day.totalAttempts > 0 
        ? Math.round((day.totalCorrect / day.totalAttempts) * 100) 
        : 0;

      // Check daily task statuses
      day.dailyTasks.forEach(task => {
        if (task.id === 'daily_rc') {
          task.completed = day.practiceSprints.some(s => s.source === 'daily_rc' || s.subtopic.toLowerCase().includes('reading comprehension')) ||
                           day.topics.some(t => t.toLowerCase().includes('reading comprehension'));
        } else if (task.id === 'daily_dilr') {
          task.completed = day.practiceSprints.some(s => s.source === 'daily_dilr' || s.topic.toLowerCase().includes('lr') || s.topic.toLowerCase().includes('di') || s.subtopic.toLowerCase().includes('puzzle') || s.subtopic.toLowerCase().includes('arrangement')) ||
                           day.topics.some(t => t.toLowerCase().includes('data interpretation') || t.toLowerCase().includes('logical reasoning') || t.toLowerCase().includes('puzzle'));
        } else if (task.id === 'challenge') {
          task.completed = day.mixedSessions.length > 0 || day.practiceSprints.some(s => s.source === 'mixed');
        } else {
          task.completed = day.practiceSprints.some(s => s.subtopic.toLowerCase() === task.subtopic.toLowerCase()) ||
                           day.topics.some(t => t.toLowerCase() === task.subtopic.toLowerCase());
        }
      });

      day.allDailiesCompleted = day.dailyTasks.every(t => t.completed);
    });

    return map;
  }, [activeHistory, weaknesses]);

  // Generate 140 days (~20 weeks) of dates leading up to today
  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const days: { dateObj: Date; dateStr: string }[] = [];

    for (let i = 139; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        dateObj: d,
        dateStr: formatLocalDateKey(d)
      });
    }

    const weeks: { dateObj: Date; dateStr: string }[][] = [];
    let currentWeek: { dateObj: Date; dateStr: string }[] = [];

    // Pad beginning of first week so Sunday is at index 0
    const firstDayOfWeek = days[0].dateObj.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ dateObj: new Date(0), dateStr: '' });
    }

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dateObj: new Date(0), dateStr: '' });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, []);

  // Selected Day Detail (fallback to today if selected day has no history)
  const currentDayDetail = useMemo((): DayDetail => {
    if (dayMap[selectedDateStr]) {
      return dayMap[selectedDateStr];
    }

    const dateObj = parseLocalDateKey(selectedDateStr);
    const displayDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const reviewTopic = weaknesses[0]?.split(' > ').pop() || 'Percentage';
    const newTopic = weaknesses[1]?.split(' > ').pop() || 'Average';

    return {
      dateStr: selectedDateStr,
      displayDate,
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
      topics: [],
      mockTests: [],
      practiceSprints: [],
      mixedSessions: [],
      dailyTasks: [
        {
          id: 'daily_rc',
          name: 'Daily RC Passage',
          desc: 'CAT Reading Comprehension',
          subtopic: 'Reading Comprehension',
          action: 'Solve Passage',
          link: '/practice/daily/rc',
          completed: false
        },
        {
          id: 'daily_dilr',
          name: 'Daily DILR Set',
          desc: 'Logic & Data Caselet',
          subtopic: 'Logical Reasoning',
          action: 'Solve Set',
          link: '/practice/daily/dilr',
          completed: false
        },
        {
          id: 'review',
          name: 'Review Weakness',
          desc: 'Strengthen weak areas',
          subtopic: reviewTopic,
          action: 'Practice Sprint',
          link: `/practice/modules/${encodeURIComponent(reviewTopic)}`,
          completed: false
        },
        {
          id: 'challenge',
          name: 'Daily Challenge',
          desc: 'Mixed concepts sprint',
          subtopic: 'Mixed Arena',
          action: 'Enter Arena',
          link: '/practice/mixed',
          completed: false
        }
      ],
      allDailiesCompleted: false
    };
  }, [dayMap, selectedDateStr, weaknesses]);

  const isTodaySelected = selectedDateStr === todayStr;

  const getHeatmapColor = (totalAttempts: number, allDailies: boolean) => {
    if (totalAttempts === 0) return 'bg-muted/60 dark:bg-muted/40 border-transparent';
    if (allDailies) return 'bg-emerald-500 border-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
    if (totalAttempts < 5) return 'bg-indigo-300 dark:bg-indigo-900/60 border-indigo-400 dark:border-indigo-800';
    if (totalAttempts < 15) return 'bg-indigo-400 dark:bg-indigo-700/80 border-indigo-500 dark:border-indigo-600';
    if (totalAttempts < 35) return 'bg-indigo-500 dark:bg-indigo-600 border-indigo-600 dark:border-indigo-500';
    return 'bg-indigo-600 dark:bg-indigo-500 border-indigo-700 dark:border-indigo-400';
  };

  return (
    <Card className="shadow-sm border-border/80 overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" /> Consistency & Daily Tasks Heatmap
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Click on any day to see tests attempted, topics covered, and retry completed or pending daily tasks.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isTodaySelected ? 'default' : 'outline'}
              size="sm"
              className="text-xs font-bold h-8"
              onClick={() => setSelectedDateStr(todayStr)}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Heatmap Grid */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="overflow-x-auto pb-3 touch-pan-x">
              <div className="flex gap-1.5 min-w-max">
                {calendarWeeks.map((week, wIdx) => (
                  <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      if (!day.dateStr) {
                        return <div key={`pad-${dIdx}`} className="w-4 h-4 rounded-sm" />;
                      }

                      const dayData = dayMap[day.dateStr];
                      const total = dayData?.totalAttempts || 0;
                      const allDailies = dayData?.allDailiesCompleted || false;
                      const isSelected = selectedDateStr === day.dateStr;
                      const isCurrentToday = day.dateStr === todayStr;

                      const formattedTooltipDate = day.dateObj.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <TooltipProvider key={day.dateStr}>
                          <Tooltip delayDuration={50}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedDateStr(day.dateStr)}
                                className={`w-4 h-4 rounded-sm border transition-all duration-150 relative ${getHeatmapColor(total, allDailies)} ${
                                  isSelected 
                                    ? 'ring-2 ring-primary ring-offset-2 scale-125 z-10' 
                                    : 'hover:scale-110 hover:ring-1 hover:ring-primary/60'
                                } ${isCurrentToday ? 'border-primary' : ''}`}
                                aria-label={`Select ${formattedTooltipDate}`}
                              >
                                {allDailies && (
                                  <span className="absolute -top-1 -right-1 text-[8px] leading-none">✨</span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-semibold p-2">
                              <p className="font-bold text-foreground">{formattedTooltipDate} {isCurrentToday ? '(Today)' : ''}</p>
                              <p className="text-muted-foreground">{total} Questions Attempted</p>
                              {allDailies && <p className="text-emerald-500 font-bold">✨ All Dailies Completed</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px]"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Dailies Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-muted/60" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-900/60" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-700/80" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-600" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
                  </div>
                  <span className="text-[11px]">More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Day Detail Panel */}
          <div className="lg:col-span-5 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-5">
            
            {/* Header: Date and Highlights */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                    {currentDayDetail.displayDate}
                  </h3>
                  {isTodaySelected && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
                      TODAY
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentDayDetail.totalAttempts > 0 
                    ? `${currentDayDetail.totalAttempts} questions attempted with ${currentDayDetail.accuracy}% accuracy`
                    : 'No practice sessions logged on this day'}
                </p>
              </div>

              {currentDayDetail.allDailiesCompleted && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Dailies Done
                </Badge>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Attempts</span>
                <span className="text-lg font-black text-foreground">{currentDayDetail.totalAttempts}</span>
              </div>
              <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Correct</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{currentDayDetail.totalCorrect}</span>
              </div>
              <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Accuracy</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{currentDayDetail.accuracy}%</span>
              </div>
            </div>

            {/* Section 1: Daily Tasks Status on That Day */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500" /> Daily Kaksha Targets
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {currentDayDetail.dailyTasks.filter(t => t.completed).length} / {currentDayDetail.dailyTasks.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {currentDayDetail.dailyTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      task.completed 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : 'bg-muted/20 border-border/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`font-bold truncate ${task.completed ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
                          {task.name}: {task.subtopic}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{task.desc}</p>
                      </div>
                    </div>

                    <Link href={task.link} className="shrink-0">
                      <Button 
                        size="sm" 
                        variant={task.completed ? 'outline' : 'default'} 
                        className={`h-7 px-2.5 text-[11px] font-bold ${
                          task.completed 
                            ? 'hover:bg-emerald-500/10 hover:text-emerald-600' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {task.completed ? (
                          <>Reattempt <RotateCcw className="w-3 h-3 ml-1" /></>
                        ) : (
                          <>Start <ArrowRight className="w-3 h-3 ml-1" /></>
                        )}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Tests & Practice Sprints Attempted on That Day */}
            <div className="space-y-2.5 pt-2 border-t border-border/40">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" /> Tests & Sprints Attempted
              </span>

              {currentDayDetail.mockTests.length === 0 && 
               currentDayDetail.practiceSprints.length === 0 && 
               currentDayDetail.mixedSessions.length === 0 ? (
                <div className="text-center py-5 bg-muted/20 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  <p className="font-semibold">No tests attempted on this date.</p>
                  <Link href="/practice/mixed">
                    <Button size="sm" variant="link" className="text-xs text-primary font-bold mt-1 h-auto p-0">
                      Start Mixed Sprint <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  
                  {/* Mock Tests */}
                  {currentDayDetail.mockTests.map(mock => (
                    <div 
                      key={`mock-${mock.id}`} 
                      className="p-3 bg-muted/30 rounded-xl border border-border/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-extrabold px-1.5 py-0">
                            MOCK
                          </Badge>
                          <span className="font-bold text-foreground">CAT {mock.year} - Slot {mock.slot}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Score: <span className="font-bold text-foreground">{mock.score ?? 'In Progress'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/mocks/${mock.year}/${mock.slot}/report`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] font-bold">
                            Review
                          </Button>
                        </Link>
                        <Link href={`/mocks/${mock.year}/${mock.slot}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] font-bold text-primary">
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Practice Sprints */}
                  {currentDayDetail.practiceSprints.map((sprint, idx) => (
                    <div 
                      key={`sprint-${idx}`} 
                      className="p-3 bg-muted/30 rounded-xl border border-border/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                            PRACTICE
                          </Badge>
                          <span className="font-bold text-foreground truncate">{sprint.subtopic}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {sprint.count} questions • {Math.round((sprint.correctCount / sprint.count) * 100)}% accuracy
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link href={`/practice/review/${encodeURIComponent(sprint.subtopic)}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] font-bold">
                            Review
                          </Button>
                        </Link>
                        <Link href={`/practice/modules/${encodeURIComponent(sprint.subtopic)}`}>
                          <Button size="sm" variant="default" className="h-7 px-2 text-[11px] font-bold bg-primary">
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Mixed Arena Sessions */}
                  {currentDayDetail.mixedSessions.map((mixed, idx) => (
                    <div 
                      key={`mixed-${idx}`} 
                      className="p-3 bg-muted/30 rounded-xl border border-border/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 border-indigo-300 text-[9px] font-bold px-1.5 py-0">
                            MIXED ARENA
                          </Badge>
                          <span className="font-bold text-foreground">Mixed Challenge</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {mixed.count} questions • {mixed.count > 0 ? Math.round((mixed.correctCount / mixed.count) * 100) : 0}% accuracy
                        </p>
                      </div>

                      <Link href="/practice/mixed">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] font-bold">
                          Reattempt <RotateCcw className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* Topics Covered Pill Badges */}
            {currentDayDetail.topics.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Topics Practiced
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentDayDetail.topics.map((t, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </CardContent>
    </Card>
  );
}
