'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function DailyTargetsWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/progress/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load daily targets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/80 shadow-sm animate-pulse">
        <CardContent className="h-48 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const historyData = data;
  const todayStr = new Date().toDateString();
  
  // Logic from dashboard to find weak spot
  const maxWeaknesses = 3;
  let reviewTopicIndex = 0;
  while (reviewTopicIndex < maxWeaknesses) {
    const candidateTopic = data.weaknesses?.[reviewTopicIndex]?.split(' > ').pop();
    if (!candidateTopic) break;
    const isAttempted = historyData?.attempts?.some((a: any) => {
      return a.question?.subtopic?.toLowerCase() === candidateTopic.toLowerCase() && new Date(a.attemptedAt).toDateString() === todayStr;
    });
    if (!isAttempted) break;
    reviewTopicIndex++;
  }
  
  const allWeaknessesAttempted = reviewTopicIndex >= maxWeaknesses;
  const reviewTopic = data.weaknesses?.[Math.min(reviewTopicIndex, maxWeaknesses - 1)]?.split(' > ').pop() || 'Arithmetic';
  const isBonusReview = reviewTopicIndex > 0;

  const lastMockDate = historyData?.mockProgress?.length > 0 
    ? new Date(Math.max(...historyData.mockProgress.map((m: any) => new Date(m.updatedAt || m.createdAt).getTime())))
    : null;
    
  const daysSinceLastMock = lastMockDate ? (new Date().getTime() - lastMockDate.getTime()) / (1000 * 3600 * 24) : Infinity;
  const mockAttemptedThisWeek = daysSinceLastMock <= 7;

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
      name: isBonusReview && !allWeaknessesAttempted ? 'Bonus Weakness Sprint' : 'Priority Concept Review',
      badge: 'FOCUS / +XP',
      desc: `Target weak spot: ${reviewTopic}`,
      subtopic: reviewTopic,
      action: isBonusReview ? 'Bonus Sprint' : 'Start 10Q Sprint',
      link: `/practice/modules/${encodeURIComponent(reviewTopic)}`,
      attemptedToday: allWeaknessesAttempted,
      isBonus: isBonusReview && !allWeaknessesAttempted
    },
    {
      id: 'weekly_mock',
      name: 'Weekly Full Mock',
      badge: 'ENDURANCE',
      desc: mockAttemptedThisWeek ? 'Mock completed this week!' : 'Due: Take a full length test',
      subtopic: 'Mocks',
      action: 'Enter Arena',
      link: '/mocks',
      attemptedToday: mockAttemptedThisWeek
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

  const coreDailiesCompleted = dailyTasks.filter(t => !t.isBonus && t.id !== 'weekly_mock').every(t => t.attemptedToday);

  return (
    <Card id="daily-tasks" className="shadow-sm border-border/80 bg-card overflow-hidden">
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
              <Target className="h-5 w-5 text-primary shrink-0" /> Daily Targets
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              Complete these tasks every day to maximize your CAT percentile.
            </CardDescription>
          </div>
          {coreDailiesCompleted && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold px-3 py-1 text-[10px] uppercase hidden sm:flex tracking-widest border border-emerald-500/30">
              ✨ DAILIES COMPLETED
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {dailyTasks.map((t, idx) => (
            <div 
              key={t.id} 
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all duration-200 ${
                t.attemptedToday 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300' 
                  : t.isBonus
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-sm'
                    : 'bg-card border-border/80 hover:border-primary/50 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <Badge variant={t.isBonus ? "default" : "outline"} className={`text-[10px] font-black tracking-wider uppercase ${t.isBonus ? 'bg-orange-500 hover:bg-orange-600' : ''}`}>
                    {t.badge}
                  </Badge>
                  {t.attemptedToday ? (
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> DONE
                    </Badge>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {t.isBonus ? 'BONUS' : `TARGET ${idx + 1}`}
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
                      : t.isBonus
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                  }`}
                >
                  {t.attemptedToday ? 'Reattempt Target' : <><PlayCircle className="h-3.5 w-3.5 mr-1.5" /> {t.action}</>}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
