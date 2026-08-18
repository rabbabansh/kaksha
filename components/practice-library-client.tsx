'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, BookOpen, Search, Clock, Target, 
  ChevronRight, Award, BrainCircuit, ShieldAlert,
  Map as MapIcon
} from 'lucide-react';
import { MasterPathsClient } from './master-paths-client';
import { DailyTargetsWidget } from './daily-targets-widget';

interface ProgressRecord {
  section: string;
  topic: string;
  subtopic: string;
  correctCount: number;
  totalQuestions: number;
  masteryLevel: number;
}

interface PracticeLibraryClientProps {
  progressRecords: ProgressRecord[];
}

const SECTIONS_DATA = [
  {
    name: "Verbal Ability & Reading Comprehension",
    abbr: "VARC",
    topics: [
      {
        name: "Reading Comprehension",
        funName: "Comprehension Champion",
        subtopics: ["Reading Comprehension"]
      },
      {
        name: "Verbal Ability",
        funName: "Verbal Virtuoso",
        subtopics: [
          "Para Jumbles", "Para Completion", "Para Summary", "Odd one out", 
          "Sentence Correction", "Grammar, Usage & Correction", "Fill in the blanks", 
          "Analogy", "Arguments", "Fact, Inference & Judgement", "Usage", "Vocabulary"
        ]
      }
    ]
  },
  {
    name: "Data Interpretation & Logical Reasoning",
    abbr: "DILR",
    topics: [
      {
        name: "DI",
        displayName: "Data Interpretation",
        funName: "Data Detective",
        subtopics: ["Tables & Graphs", "Games & Tournaments", "Routes & Networks", "Venn Diagram"]
      },
      {
        name: "LR",
        displayName: "Logical Reasoning",
        funName: "Logic Lord",
        subtopics: [
          "Arrangements", "Puzzles", "Selection & Distribution", "Mathematical Reasoning", 
          "Syllogisms", "Binary Logic", "Logical Connectives", "Clocks", "Calendar", 
          "Cubes", "Board Games", "Coding Decoding", "Operator Based Questions", 
          "Rank & Ordering", "Blood Relation", "Directions"
        ]
      }
    ]
  },
  {
    name: "Quantitative Ability",
    abbr: "QA",
    topics: [
      {
        name: "Algebra",
        funName: "Algebraic Apocalypse",
        subtopics: ["Simple Equations", "Quadratic Equations", "Surds & Indices", "Logarithms", "Progressions", "Inequalities & Modulus", "Functions & Graphs"]
      },
      {
        name: "Arithmetic",
        funName: "Arithmetic Ascent",
        subtopics: ["Percentage", "Profit & Loss", "Simple & Compound Interest", "Ratio, Proportion & Variation", "Average", "Mixture, Alligation, Removal & Replacement", "Time & Work", "Time, Speed & Distance"]
      },
      {
        name: "Geometry",
        funName: "Geometric Gladiator",
        subtopics: ["Basics", "Triangles", "Quadrilaterals & Polygons", "Circles", "Mensuration", "Coordinate Geometry", "Trigonometry"]
      },
      {
        name: "Modern Math",
        funName: "Modern Math Multiverse",
        subtopics: ["Permutation & Combination", "Probability", "Sets"]
      },
      {
        name: "Number System",
        funName: "Number Ninja",
        subtopics: ["Number System", "Number Theory"]
      }
    ]
  }
];

const SECTIONALS_MOCKS = [
  {
    section: "VARC",
    mocks: [
      {
        name: "Verbal Voyage I: Passage Patrol",
        year: "2024-sectional",
        slot: "Slot 1-VARC",
        questions: 24,
        duration: 40,
        description: "Official CAT 2024 Slot 1 VARC section. Tests comprehension and verbal reasoning under exact CBT conditions."
      },
      {
        name: "Verbal Voyage II: Grammar Galleon",
        year: "2023-sectional",
        slot: "Slot 1-VARC",
        questions: 24,
        duration: 40,
        description: "Official CAT 2023 Slot 1 VARC sectional test. Perfect for timing verbal logic sprints."
      },
      {
        name: "Verbal Voyage III: Rhetorical Ridge",
        year: "2022-sectional",
        slot: "Slot 1-VARC",
        questions: 24,
        duration: 40,
        description: "Official CAT 2022 Slot 1 VARC sectional test. A classic set to benchmark reading speed."
      }
    ]
  },
  {
    section: "DILR",
    mocks: [
      {
        name: "Logical Labyrinth I: Caselet Crusader",
        year: "2024-sectional",
        slot: "Slot 1-DILR",
        questions: 20,
        duration: 40,
        description: "Official CAT 2024 Slot 1 DILR section. Four logic sets/caselets under strict 40-minute constraints."
      },
      {
        name: "Logical Labyrinth II: The Chart Chamber",
        year: "2023-sectional",
        slot: "Slot 1-DILR",
        questions: 20,
        duration: 40,
        description: "Official CAT 2023 Slot 1 DILR section. Test your matrix arrangement and graph sets."
      },
      {
        name: "Logical Labyrinth III: Analytical Abyss",
        year: "2022-sectional",
        slot: "Slot 1-DILR",
        questions: 20,
        duration: 40,
        description: "Official CAT 2022 Slot 1 DILR section. Deep dive arrangements and game matrices."
      }
    ]
  },
  {
    section: "QA",
    mocks: [
      {
        name: "Quant Quest I: The Numbers Game",
        year: "2024-sectional",
        slot: "Slot 1-QA",
        questions: 22,
        duration: 40,
        description: "Official CAT 2024 Slot 1 Quant section. Features 22 questions across Algebra, Arithmetic, and Geometry."
      },
      {
        name: "Quant Quest II: The Algebraic Arena",
        year: "2023-sectional",
        slot: "Slot 1-QA",
        questions: 22,
        duration: 40,
        description: "Official CAT 2023 Slot 1 Quant sectional. Drill equations and profit & loss."
      },
      {
        name: "Quant Quest III: The Math Marathon",
        year: "2022-sectional",
        slot: "Slot 1-QA",
        questions: 22,
        duration: 40,
        description: "Official CAT 2022 Slot 1 Quant sectional. A math marathon checking absolute concept clarity."
      }
    ]
  }
];

export function PracticeLibraryClient({ progressRecords }: PracticeLibraryClientProps) {
  const [activeTab, setActiveTab] = useState<'sprints' | 'mixed' | 'sectionals'>('sprints');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('All');

  // Create subtopic progress map
  const progressMap = useMemo(() => {
    const map = new Map<string, { accuracy: number; totalAttempts: number }>();
    progressRecords.forEach(r => {
      const key = `${r.section} > ${r.topic} > ${r.subtopic}`;
      const accuracy = r.totalQuestions > 0 
        ? Math.round((r.correctCount / r.totalQuestions) * 100)
        : 0;
      map.set(key, { accuracy, totalAttempts: r.totalQuestions });
    });
    return map;
  }, [progressRecords]);

  // Helper to determine Grade from accuracy and attempts
  const getSubtopicGrade = (section: string, topic: string, subtopic: string) => {
    const key = `${section} > ${topic} > ${subtopic}`;
    const record = progressMap.get(key);
    
    if (!record || record.totalAttempts === 0) {
      return { label: 'Not Started', variant: 'outline' as const, color: 'text-muted-foreground bg-muted/30 border-muted-foreground/20' };
    }
    
    const acc = record.accuracy;
    if (acc >= 85) return { label: 'A+', variant: 'default' as const, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' };
    if (acc >= 70) return { label: 'A', variant: 'default' as const, color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10' };
    if (acc >= 55) return { label: 'B', variant: 'default' as const, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10' };
    if (acc >= 40) return { label: 'C', variant: 'default' as const, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10' };
    if (acc >= 25) return { label: 'D', variant: 'default' as const, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10' };
    return { label: 'F', variant: 'destructive' as const, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10' };
  };

  // Build the list of all subtopics for search & rendering
  const allSubtopics = useMemo(() => {
    const list: Array<{ section: string; sectionAbbr: string; topic: string; subtopic: string }> = [];
    SECTIONS_DATA.forEach(sec => {
      sec.topics.forEach(t => {
        t.subtopics.forEach(sub => {
          list.push({
            section: sec.name,
            sectionAbbr: sec.abbr,
            topic: t.name,
            subtopic: sub
          });
        });
      });
    });
    return list;
  }, []);

  // Filtered subtopics based on query & section filter
  const filteredSubtopics = useMemo(() => {
    return allSubtopics.filter(s => {
      const matchesSearch = s.subtopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSection = sectionFilter === 'All' || s.sectionAbbr === sectionFilter;
      return matchesSearch && matchesSection;
    });
  }, [allSubtopics, searchQuery, sectionFilter]);

  // Topic mastery lookup (average of BKT mastery for subtopics)
  const getTopicMastery = (section: string, topic: string, subtopics: string[]) => {
    let sum = 0;
    let count = 0;
    subtopics.forEach(sub => {
      const key = `${section} > ${topic} > ${sub}`;
      const record = progressMap.get(key);
      if (record && record.totalAttempts > 0) {
        sum += record.accuracy;
        count++;
      }
    });
    return count > 0 ? Math.round(sum / count) : null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Kaksha Practice Arena 🐾
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          From targeted subtopic sprints to full section mock simulations, build your muscle memory for CAT.
        </p>

        {/* Daily Targets Injection */}
        <div className="py-4 text-left">
          <DailyTargetsWidget />
        </div>

        {/* Practice Bank Access Button / Search Bar */}
        <div className="max-w-xl mx-auto mb-6">
          <Link href="/practice/bank" className="block w-full">
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-primary/40 rounded-2xl text-left transition-all duration-200 cursor-pointer shadow-sm">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <span className="block font-bold text-sm text-foreground">Looking for a specific PYQ?</span>
                <span className="block text-[10px] text-muted-foreground">Search and filter all past CAT questions by year, section, topic, or content in the Practice Bank →</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-muted rounded-xl gap-1 overflow-x-auto max-w-full">
          <Button 
            variant={activeTab === 'sprints' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('sprints')}
            className="rounded-lg px-6"
          >
            <Target className="h-4 w-4 mr-2" /> Sprint Modules
          </Button>
          <Button 
            variant={activeTab === 'mixed' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('mixed')}
            className="rounded-lg px-6"
          >
            <BrainCircuit className="h-4 w-4 mr-2" /> Mixed Topic Sprints
          </Button>
          <Button 
            variant={activeTab === 'sectionals' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('sectionals')}
            className="rounded-lg px-6"
          >
            <Clock className="h-4 w-4 mr-2" /> Sectional Mocks
          </Button>
        </div>
      </div>

      {/* ---------------- Sprint Modules Tab ---------------- */}
      {activeTab === 'sprints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border p-4 rounded-xl shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subtopic or topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/30"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['All', 'VARC', 'DILR', 'QA'].map((abbr) => (
                <Button
                  key={abbr}
                  variant={sectionFilter === abbr ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSectionFilter(abbr)}
                >
                  {abbr === 'All' ? 'All Sections' : abbr}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubtopics.map((s, idx) => {
              const grade = getSubtopicGrade(s.section, s.topic, s.subtopic);
              const key = `${s.section} > ${s.topic} > ${s.subtopic}`;
              const record = progressMap.get(key);

              return (
                <Card key={idx} className="hover:shadow-md transition-shadow flex flex-col justify-between border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs bg-muted/50 border-muted">
                        {s.sectionAbbr} • {s.topic}
                      </Badge>
                      <Badge variant={grade.variant} className={`text-xs font-semibold ${grade.color}`}>
                        {grade.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors pr-8">
                      {s.subtopic}
                    </CardTitle>
                    {record && record.totalAttempts > 0 && (
                      <CardDescription className="text-xs">
                        Accuracy: {record.accuracy}% • {record.totalAttempts} Attempts
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Focus sprint containing 10 targeted adaptive questions.
                    </p>
                  </CardContent>
                  <CardContent className="pt-2">
                    <Button className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground" variant="outline" asChild>
                      <Link href={`/practice/modules/${encodeURIComponent(s.subtopic)}`}>
                        <span>Start Sprint</span>
                        <Play className="h-3 w-3 fill-current" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredSubtopics.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/10">
              <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No subtopics found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try modifying your search or filter options.</p>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Mixed Topic Arenas Tab ---------------- */}
      {activeTab === 'mixed' && (
        <div className="space-y-12">
          {SECTIONS_DATA.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-6">
              <div className="border-b pb-2">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Award className="h-5 w-5" /> {sec.name}
                </h2>
              </div>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sec.topics.map((t, tIdx) => {
                  const mastery = getTopicMastery(sec.name, t.name, t.subtopics);
                  return (
                    <Card key={tIdx} className="border-primary/10 relative overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary/50 to-primary" />
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {sec.abbr} Mixed Sprint
                          </span>
                          {mastery !== null && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Mastery: {mastery}%
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl font-extrabold group-hover:text-primary transition-colors">
                          {t.funName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Covers {t.subtopics.length} subtopics: {t.subtopics.slice(0, 3).join(', ')}...
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Rapid-fire 10-question sprint mixing questions dynamically across all subtopics under {t.name}.
                        </p>
                      </CardContent>
                      <CardContent className="pt-0">
                        <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline" asChild>
                          <Link href={`/practice/mixed?topic=${encodeURIComponent(t.name)}`}>
                            <span>Enter Arena</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Sectional Mocks Tab ---------------- */}
      {activeTab === 'sectionals' && (
        <div className="space-y-12">
          {SECTIONALS_MOCKS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-6">
              <div className="border-b pb-2">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> {group.section} Sectional Mocks
                </h2>
              </div>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {group.mocks.map((mock, mockIdx) => (
                  <Card key={mockIdx} className="border-primary/20 hover:border-primary transition-all flex flex-col justify-between shadow-sm hover:shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full translate-x-8 -translate-y-8" />
                    <CardHeader className="pb-3">
                      <div className="flex gap-2 mb-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {mock.duration} Mins
                        </Badge>
                        <Badge variant="outline">
                          {mock.questions} Questions
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                        {mock.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mock.description}
                      </p>
                    </CardContent>
                    <CardContent className="pt-2">
                      <Button className="w-full flex items-center justify-between group-hover:bg-primary group-hover:text-primary-foreground" variant="outline" asChild>
                        <Link href={`/mocks/${mock.year}/${mock.slot}`}>
                          <span>Start CBT Exam</span>
                          <Play className="h-3 w-3 fill-current" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
