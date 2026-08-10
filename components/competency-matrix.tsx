'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  PlayCircle, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Layers,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface SubtopicInfo {
  name: string;
  topic: string;
  section: string;
  score: number;
  rawAttempts: number;
  rawCorrect: number;
  rawWrong: number;
  totalQuestions: number;
  accuracy: number;
}

interface TopicInfo {
  name: string;
  section: string;
  score: number;
  rawAttempts: number;
  rawCorrect: number;
  rawWrong: number;
  subtopics: SubtopicInfo[];
}

interface SectionData {
  name: string;
  score: number;
  rawAttempts: number;
  rawCorrect: number;
  rawWrong: number;
  topics: Record<string, any>;
}

interface CompetencyMatrixProps {
  hierarchy: Record<string, SectionData>;
}

export function CompetencyMatrix({ hierarchy }: CompetencyMatrixProps) {
  // Normalize section names to standard tabs
  const sectionKeys = useMemo(() => {
    return Object.keys(hierarchy || {});
  }, [hierarchy]);

  const [activeSectionKey, setActiveSectionKey] = useState<string>(() => {
    return sectionKeys[0] || 'Quantitative Ability';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [showAllRankings, setShowAllRankings] = useState<boolean>(false);

  const toggleTopic = (topicName: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  // Process and sort all topics and subtopics for the active section
  const sectionData = useMemo(() => {
    if (!hierarchy || !hierarchy[activeSectionKey]) {
      return {
        topStrengths: [],
        topWeaknesses: [],
        rankedTopics: [],
        allSubtopics: []
      };
    }

    const sec = hierarchy[activeSectionKey];
    const topicsObj = sec.topics || {};

    const rankedTopics: TopicInfo[] = [];
    const allSubtopics: SubtopicInfo[] = [];

    Object.values(topicsObj).forEach((t: any) => {
      const topicSubtopics: SubtopicInfo[] = [];

      Object.values(t.subtopics || {}).forEach((sub: any) => {
        const accuracy = sub.rawAttempts > 0 
          ? Math.round((sub.rawCorrect / sub.rawAttempts) * 100) 
          : 0;

        const subInfo: SubtopicInfo = {
          name: sub.name,
          topic: t.name,
          section: activeSectionKey,
          score: sub.score || 0,
          rawAttempts: sub.rawAttempts || 0,
          rawCorrect: sub.rawCorrect || 0,
          rawWrong: sub.rawWrong || 0,
          totalQuestions: sub.totalQuestions || 0,
          accuracy
        };

        topicSubtopics.push(subInfo);
        allSubtopics.push(subInfo);
      });

      // Sort subtopics inside topic descending by score
      topicSubtopics.sort((a, b) => b.score - a.score || b.rawAttempts - a.rawAttempts);

      rankedTopics.push({
        name: t.name,
        section: activeSectionKey,
        score: t.score || 0,
        rawAttempts: t.rawAttempts || 0,
        rawCorrect: t.rawCorrect || 0,
        rawWrong: t.rawWrong || 0,
        subtopics: topicSubtopics
      });
    });

    // Rank topics descending by score
    rankedTopics.sort((a, b) => b.score - a.score || b.rawAttempts - a.rawAttempts);

    // Rank subtopics for Strengths (Attempted with highest score) & Weaknesses (Lowest score or most wrong)
    const attemptedSubtopics = allSubtopics.filter(s => s.rawAttempts > 0);
    const unattemptedSubtopics = allSubtopics.filter(s => s.rawAttempts === 0);

    // Strengths: Top 3 by score
    const topStrengths = [...attemptedSubtopics]
      .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy)
      .slice(0, 3);

    // Weaknesses: Subtopics with lowest score / highest wrong attempts, or unattempted
    const topWeaknesses = [...attemptedSubtopics]
      .sort((a, b) => a.score - b.score || b.rawWrong - a.rawWrong)
      .slice(0, 3);

    // If less than 3 attempted weaknesses, pad with unattempted
    if (topWeaknesses.length < 3) {
      unattemptedSubtopics.slice(0, 3 - topWeaknesses.length).forEach(un => {
        topWeaknesses.push(un);
      });
    }

    return {
      topStrengths,
      topWeaknesses,
      rankedTopics,
      allSubtopics
    };
  }, [hierarchy, activeSectionKey]);

  // Filtered topics based on search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return sectionData.rankedTopics;
    const query = searchQuery.toLowerCase();

    return sectionData.rankedTopics.filter(topic => {
      const matchTopic = topic.name.toLowerCase().includes(query);
      const matchSub = topic.subtopics.some(s => s.name.toLowerCase().includes(query));
      return matchTopic || matchSub;
    });
  }, [sectionData.rankedTopics, searchQuery]);

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    if (score >= 60) return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    if (score >= 40) return 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/30';
    return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30';
  };

  const getShortSectionLabel = (sec: string) => {
    if (sec.toLowerCase().includes('quantitative')) return 'QA';
    if (sec.toLowerCase().includes('verbal')) return 'VARC';
    if (sec.toLowerCase().includes('data') || sec.toLowerCase().includes('logical')) return 'DILR';
    return sec;
  };

  return (
    <Card className="col-span-1 md:col-span-4 shadow-sm border-border/80 overflow-hidden bg-card">
      <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-extrabold flex items-center gap-2 text-foreground tracking-tight">
              <Layers className="h-5 w-5 text-indigo-500 shrink-0" aria-hidden="true" /> 
              Sectional Competency Matrix
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-0.5">
              Section-by-section mastery ranking across all topics and subtopics.
            </CardDescription>
          </div>

          {/* Section Tabs Switcher */}
          <Tabs 
            value={activeSectionKey} 
            onValueChange={setActiveSectionKey}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-auto h-9 p-1">
              {sectionKeys.map(key => (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="text-xs font-bold px-3 py-1"
                >
                  {getShortSectionLabel(key)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        
        {/* Top Strengths & Weaknesses for this Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top 3 Strengths in Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" /> 
                Top Strengths ({getShortSectionLabel(activeSectionKey)})
              </span>
              <span className="text-[11px] text-muted-foreground font-semibold">Ranked by Mastery</span>
            </div>

            <div className="space-y-2">
              {sectionData.topStrengths.length > 0 ? (
                sectionData.topStrengths.map((sub, idx) => (
                  <div 
                    key={`strength-${idx}`}
                    className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between gap-3 group hover:border-emerald-400 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                          #{idx + 1}
                        </span>
                        <p className="font-bold text-sm text-foreground truncate">{sub.name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 ml-7 truncate">
                        {sub.topic} • <span className="font-semibold text-emerald-700 dark:text-emerald-400">{sub.accuracy}% accuracy</span> ({sub.rawAttempts} solved)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`font-black text-xs shrink-0 whitespace-nowrap ${getScoreBadgeClass(sub.score)}`}>
                        {sub.score}/100
                      </Badge>
                      <Link href={`/practice/modules/${encodeURIComponent(sub.name)}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/15" aria-label={`Practice ${sub.name}`}>
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  Solve questions in {getShortSectionLabel(activeSectionKey)} to detect top strengths!
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Weaknesses in Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                <TrendingDown className="h-4 w-4 shrink-0" aria-hidden="true" /> 
                Key Weaknesses ({getShortSectionLabel(activeSectionKey)})
              </span>
              <span className="text-[11px] text-muted-foreground font-semibold">Priority Fixes</span>
            </div>

            <div className="space-y-2">
              {sectionData.topWeaknesses.length > 0 ? (
                sectionData.topWeaknesses.map((sub, idx) => (
                  <div 
                    key={`weakness-${idx}`}
                    className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/50 flex items-center justify-between gap-3 group hover:border-red-400 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-800 dark:text-red-300 text-[10px] font-black">
                          #{idx + 1}
                        </span>
                        <p className="font-bold text-sm text-foreground truncate">{sub.name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 ml-7 truncate">
                        {sub.topic} • <span className="font-semibold text-red-700 dark:text-red-400">{sub.rawAttempts > 0 ? `${sub.accuracy}% accuracy` : 'Not Attempted'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`font-black text-xs shrink-0 whitespace-nowrap ${getScoreBadgeClass(sub.score)}`}>
                        {sub.score}/100
                      </Badge>
                      <Link href={`/practice/modules/${encodeURIComponent(sub.name)}`}>
                        <Button size="sm" variant="default" className="h-8 px-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shrink-0">
                          Practice <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  No critical weaknesses detected in this section.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Section Full Topic & Subtopic Hierarchy Breakdown */}
        <div className="pt-4 border-t border-border/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-base text-foreground flex items-center gap-2">
                All {getShortSectionLabel(activeSectionKey)} Topics & Subtopics Hierarchy
              </h4>
              <p className="text-xs text-muted-foreground">
                Expand any module to see granular subtopic marks, accuracy, and practice links.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search topics or subtopics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-lg w-full"
                aria-label="Search topics or subtopics"
              />
            </div>
          </div>

          <div className={`relative ${showAllRankings || searchQuery.trim() ? '' : 'max-h-[300px] overflow-hidden'}`}>
            <div className="space-y-3">
              {filteredTopics.map(topic => {
                const isExpanded = expandedTopics[topic.name] || Boolean(searchQuery.trim());

                return (
                  <div 
                    key={topic.name}
                    className="rounded-xl border border-border/80 overflow-hidden bg-card transition-shadow hover:shadow-sm"
                  >
                    {/* Topic Header Row */}
                    <div 
                      onClick={() => toggleTopic(topic.name)}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors select-none"
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleTopic(topic.name);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1 rounded-md text-muted-foreground shrink-0">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm text-foreground truncate">{topic.name}</h5>
                          <p className="text-xs text-muted-foreground truncate">
                            {topic.subtopics.length} Subtopics • {topic.rawAttempts} questions attempted
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Module Score</span>
                        <Badge variant="outline" className={`font-extrabold text-xs px-2.5 py-1 shrink-0 whitespace-nowrap ${getScoreBadgeClass(topic.score)}`}>
                          {topic.score} / 100
                        </Badge>
                      </div>
                    </div>

                    {/* Expandable Subtopics List */}
                    {isExpanded && (
                      <div className="p-2 sm:p-3 bg-muted/10 border-t border-border/50 space-y-2">
                        {topic.subtopics.map(sub => (
                          <div 
                            key={sub.name}
                            className="p-2.5 sm:p-3 rounded-lg bg-background border border-border/60 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground truncate">{sub.name}</span>
                                {sub.rawAttempts > 0 ? (
                                  <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 shrink-0">
                                    {sub.accuracy}% Acc
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0 shrink-0">
                                    Unattempted
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                {sub.rawAttempts} attempted • {sub.rawCorrect} correct
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-xs shrink-0">
                                {sub.score} <span className="text-[10px] text-muted-foreground font-normal">pts</span>
                              </span>

                              <Link href={`/practice/modules/${encodeURIComponent(sub.name)}`}>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground shrink-0">
                                  Practice <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
            {!(showAllRankings || searchQuery.trim()) && (
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />
            )}
          </div>
          
          {!searchQuery.trim() && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAllRankings(!showAllRankings)} 
                className="font-bold text-xs bg-background"
              >
                {showAllRankings ? 'Hide Detailed Rankings' : 'Show All Detailed Rankings'} 
                {showAllRankings ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
