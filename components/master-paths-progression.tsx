'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Map as MapIcon, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Play, 
  Zap, 
  Target,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface FocusSubtopic {
  name: string;
  score: number;
  topic: string;
}

interface StageInfo {
  name: string;
  score: number;
  completed: boolean;
  subCount: number;
}

interface SectionRoadmapItem {
  key: string;
  code: string;
  gradient: string;
  accentBg: string;
  accentText: string;
  name: string;
  score: number;
  percent: number;
  tier: string;
  tierBadge: string;
  totalSubtopics: number;
  masteredSubtopics: number;
  inProgressSubtopics: number;
  totalAttempts: number;
  nextFocusSubtopic: FocusSubtopic | null;
  stages: StageInfo[];
}

interface MasterPathsProgressionProps {
  hierarchy: Record<string, any>;
  onOpenExplorer?: (section?: string) => void;
}

export function MasterPathsProgression({ hierarchy, onOpenExplorer }: MasterPathsProgressionProps) {
  const sections = useMemo<SectionRoadmapItem[]>(() => {
    const list = [
      { 
        key: 'Quantitative Ability', 
        code: 'QA', 
        gradient: 'from-blue-600 to-indigo-700',
        accentBg: 'bg-indigo-500/10 dark:bg-indigo-950/30',
        accentText: 'text-indigo-600 dark:text-indigo-400'
      },
      { 
        key: 'Verbal Ability & Reading Comprehension', 
        code: 'VARC', 
        gradient: 'from-emerald-600 to-teal-700',
        accentBg: 'bg-emerald-500/10 dark:bg-emerald-950/30',
        accentText: 'text-emerald-600 dark:text-emerald-400'
      },
      { 
        key: 'Data Interpretation & Logical Reasoning', 
        code: 'DILR', 
        gradient: 'from-orange-500 to-rose-600',
        accentBg: 'bg-orange-500/10 dark:bg-orange-950/30',
        accentText: 'text-orange-600 dark:text-orange-400'
      }
    ];

    return list.map((item): SectionRoadmapItem => {
      const secData = hierarchy?.[item.key] || hierarchy?.[item.code] || null;
      const topics = secData?.topics ? Object.values(secData.topics) : [];

      let totalSubtopics = 0;
      let masteredSubtopics = 0;
      let inProgressSubtopics = 0;
      let totalAttempts = 0;
      let nextFocusSubtopic: FocusSubtopic | null = null;

      const stageList: StageInfo[] = [];

      topics.forEach((t: any) => {
        const subs = t.subtopics ? Object.values(t.subtopics) : [];
        let stageMastered = 0;

        subs.forEach((s: any) => {
          totalSubtopics += 1;
          totalAttempts += (s.rawAttempts || 0);

          if ((s.score || 0) >= 70) {
            masteredSubtopics += 1;
            stageMastered += 1;
          } else if ((s.rawAttempts || 0) > 0) {
            inProgressSubtopics += 1;
          }

          // Pick the lowest scoring or unattempted subtopic as next focus
          if (!nextFocusSubtopic || (s.score || 0) < nextFocusSubtopic.score) {
            nextFocusSubtopic = {
              name: s.name,
              score: s.score || 0,
              topic: t.name
            };
          }
        });

        stageList.push({
          name: t.name,
          score: t.score || 0,
          completed: subs.length > 0 && stageMastered === subs.length,
          subCount: subs.length
        });
      });

      const percent = totalSubtopics > 0 
        ? Math.round((masteredSubtopics / totalSubtopics) * 100) 
        : 0;

      let tier = 'Novice Explorer';
      let tierBadge = '🌱 Tier 1';
      if (percent >= 80) {
        tier = 'CAT Master';
        tierBadge = '💎 Tier 4';
      } else if (percent >= 50) {
        tier = 'Advanced Strategist';
        tierBadge = '🥇 Tier 3';
      } else if (percent >= 20) {
        tier = 'Competence Achiever';
        tierBadge = '🥈 Tier 2';
      }

      return {
        ...item,
        name: secData?.name || item.key,
        score: secData?.score || 0,
        percent,
        tier,
        tierBadge,
        totalSubtopics,
        masteredSubtopics,
        inProgressSubtopics,
        totalAttempts,
        nextFocusSubtopic,
        stages: stageList.slice(0, 4) // Show top 4 stages
      };
    });
  }, [hierarchy]);

  return (
    <section aria-labelledby="master-paths-heading" className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 id="master-paths-heading" className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
            <MapIcon className="h-5 w-5 text-indigo-500 shrink-0" aria-hidden="true" /> 
            Master Paths Progression
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Dynamic milestone skill trees for QA, VARC, and DILR. Level up each section to reach CAT readiness.
          </p>
        </div>

        {onOpenExplorer && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenExplorer()}
            className="font-bold text-xs self-start sm:self-auto h-8 px-3"
          >
            Explore Skill Hierarchy <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* 3 Section Journey Cards Grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {sections.map(sec => (
          <Card 
            key={sec.code} 
            className="w-[85vw] sm:w-auto shrink-0 snap-center shadow-sm border-border/80 overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all duration-200 group bg-card"
          >
            <div>
              {/* Card Banner Header */}
              <div className={`p-5 bg-gradient-to-br ${sec.gradient} text-white flex flex-col justify-between min-h-[110px] relative overflow-hidden`}>
                {/* Decorative Background Code Watermark */}
                <span 
                  className="absolute -bottom-4 -right-1 text-7xl font-black text-white/10 select-none pointer-events-none tracking-tighter"
                  aria-hidden="true"
                >
                  {sec.code}
                </span>

                <div className="flex items-start justify-between gap-3 relative z-10 w-full">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm shadow-sm shrink-0 border border-white/25 text-white">
                      {sec.code}
                    </div>
                    <div className="min-w-0 flex-1 pr-1">
                      <h4 className="font-extrabold text-base leading-snug tracking-tight text-white line-clamp-2">
                        {sec.name}
                      </h4>
                      <p className="text-xs text-white/90 font-medium mt-0.5 truncate">
                        {sec.tier}
                      </p>
                    </div>
                  </div>

                  <Badge className="bg-black/25 hover:bg-black/35 text-white border border-white/25 font-black text-xs px-2.5 py-1 backdrop-blur-md shrink-0 whitespace-nowrap shadow-sm">
                    {sec.tierBadge}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar & Key Stats */}
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Mastery Roadmap</span>
                    <span className="text-foreground font-black">{sec.percent}% Complete</span>
                  </div>
                  <Progress value={sec.percent} className="h-2.5 rounded-full bg-muted" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
                    <span>{sec.masteredSubtopics} of {sec.totalSubtopics} Subtopics Mastered</span>
                    <span className="font-semibold text-foreground">{sec.totalAttempts} Solved</span>
                  </div>
                </div>

                {/* Milestone Stages Mini-Roadmap */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Milestone Stages
                  </span>
                  <div className="space-y-1.5">
                    {sec.stages.map((st, idx) => (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                          st.completed 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : (st.score > 0)
                              ? `${sec.accentBg} border-border text-foreground`
                              : 'bg-muted/30 border-border/50 text-muted-foreground opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {st.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : st.score > 0 ? (
                            <Zap className={`h-4 w-4 shrink-0 ${sec.accentText}`} />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                          )}
                          <span className="font-semibold truncate">{st.name}</span>
                        </div>
                        <span className="text-[11px] font-bold shrink-0">
                          {st.score > 0 ? `${st.score}%` : 'Locked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Next Sprint Target */}
                {sec.nextFocusSubtopic && (
                  <div className="bg-muted/40 p-3.5 rounded-xl border border-border/70 text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" /> Next Target Sprint
                    </span>
                    <p className="font-bold text-foreground truncate text-sm">{sec.nextFocusSubtopic.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sec.nextFocusSubtopic.topic}</p>
                  </div>
                )}

              </div>
            </div>

            {/* Action Footer Button */}
            <div className="p-5 pt-0">
              {sec.nextFocusSubtopic ? (
                <Link href={`/practice/modules/${encodeURIComponent(sec.nextFocusSubtopic.name)}`} className="block w-full">
                  <Button className="w-full font-bold text-xs h-10 shadow-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Play className="h-3.5 w-3.5 fill-current" /> Resume {sec.code} Sprint
                  </Button>
                </Link>
              ) : (
                <Link href="/practice/modules" className="block w-full">
                  <Button variant="outline" className="w-full font-bold text-xs h-10">
                    Explore Modules
                  </Button>
                </Link>
              )}
            </div>

          </Card>
        ))}
      </div>
    </section>
  );
}
