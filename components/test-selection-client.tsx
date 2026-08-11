'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Search, Clock, FileText, Eye, CheckCircle2, Trophy, History, BookOpen } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface TestSelectionClientProps {
  byYearSlot: Record<string, Record<string, Question[]>>;
  progressMap: Map<string, { completed: boolean; score?: number | null }>;
}

export function TestSelectionClient({ byYearSlot, progressMap }: TestSelectionClientProps) {
  const years = Object.keys(byYearSlot).sort((a, b) => Number(b) - Number(a));
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || '');
  const [activeTab, setActiveTab] = useState<string>('available');

  const slots = selectedYear ? Object.keys(byYearSlot[selectedYear]).sort() : [];
  const [selectedSlot, setSelectedSlot] = useState<string>(slots[0] || '');

  const currentQuestions = selectedYear && selectedSlot
    ? byYearSlot[selectedYear][selectedSlot]
    : [];
  const progress = selectedYear && selectedSlot
    ? progressMap.get(`${selectedYear}-${selectedSlot}`)
    : undefined;

  // Build history: all completed tests
  const completedTests = Array.from(progressMap.entries())
    .filter(([, p]) => p.completed)
    .map(([key, p]) => {
      const [year, ...slotParts] = key.split('-');
      const slot = slotParts.join('-');
      const qCount = byYearSlot[year]?.[slot]?.length || 0;
      return { year, slot, score: p.score, qCount };
    })
    .sort((a, b) => Number(b.year) - Number(a.year));

  const totalTests = years.reduce((acc, y) => acc + Object.keys(byYearSlot[y]).length, 0);
  const doneCount = completedTests.length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl pb-24">
      {/* Header stats */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight mb-1">PYQ Mock Tests</h1>
        <p className="text-muted-foreground text-sm">
          {doneCount} of {totalTests} tests completed · Practice with real CAT papers
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 bg-muted/40 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${totalTests > 0 ? (doneCount / totalTests) * 100 : 0}%` }}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xs grid-cols-2 mb-6 h-10">
          <TabsTrigger value="available" className="gap-1.5 text-sm font-bold">
            <BookOpen className="h-4 w-4" /> Available
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-sm font-bold">
            <History className="h-4 w-4" /> History
            {doneCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                {doneCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ---- AVAILABLE TESTS TAB ---- */}
        <TabsContent value="available" className="space-y-6">
          {/* Top cards: selector + weekly mock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selector Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Select a Test</CardTitle>
                <CardDescription>Choose the year and slot you want to attempt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Year</label>
                    <Select value={selectedYear} onValueChange={(value) => {
                      setSelectedYear(value);
                      const newSlots = Object.keys(byYearSlot[value]).sort();
                      setSelectedSlot(newSlots[0] || '');
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>CAT {year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Slot</label>
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((slot) => (
                          <SelectItem key={slot} value={slot}>Slot {slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedYear && selectedSlot && currentQuestions.length > 0 && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">
                          CAT {selectedYear}
                          {selectedSlot !== 'NA' && selectedSlot !== 'Unknown' && ` · Slot ${selectedSlot}`}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {currentQuestions.length} questions</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 120 min</span>
                        </div>
                      </div>
                      {progress?.completed && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </Badge>
                      )}
                    </div>

                    {progress?.score != null && (
                      <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Previous Score</p>
                          <p className="font-black text-lg">{progress.score}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/mocks/${selectedYear}/${selectedSlot}`} className="flex-1">
                        <Button className="w-full h-11 font-bold shadow-sm">
                          <Play className="mr-2 h-5 w-5" />
                          {progress?.completed ? 'Retry Test' : 'Start Mock Test'}
                        </Button>
                      </Link>
                      <Link href={`/mocks/${selectedYear}/${selectedSlot}?mode=explore`} className="flex-1">
                        <Button className="w-full h-11" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          Explore
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Mock Recommendation */}
            <Card className="bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <CardTitle className="text-2xl text-indigo-700 dark:text-indigo-400">Weekly Mock Test</CardTitle>
                <CardDescription>
                  Full-length mock to evaluate your overall CAT readiness.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-card p-4 rounded-xl border border-border/60 mb-4">
                  <h4 className="font-bold text-lg mb-1">CAT {years[0]} - Slot {Object.keys(byYearSlot[years[0]] || {})[0]}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><FileText className="h-3 w-3" /> 66 Qs</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> 120 min</div>
                  </div>
                </div>
                <Link href={`/mocks/${years[0]}/${Object.keys(byYearSlot[years[0]] || {})[0]}`} className="block w-full">
                  <Button className="w-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-sm">
                    <Play className="mr-2 h-5 w-5" /> Enter Arena
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* All tests grid */}
          <div>
            <h2 className="text-xl font-black mb-4">All Available Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {years.map((year) => {
                const yearSlots = Object.keys(byYearSlot[year]).sort();
                const yearDone = yearSlots.filter(s => progressMap.get(`${year}-${s}`)?.completed).length;
                return (
                  <Card key={year} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">CAT {year}</CardTitle>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {yearDone}/{yearSlots.length} done
                        </Badge>
                      </div>
                      <CardDescription>{yearSlots.length} slot{yearSlots.length !== 1 ? 's' : ''} available</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {yearSlots.map((slot) => {
                          const slotQuestions = byYearSlot[year][slot];
                          const slotProgress = progressMap.get(`${year}-${slot}`);
                          const showSlotLabel = slot !== 'NA' && slot !== 'Unknown';
                          return (
                            <div key={slot} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{showSlotLabel ? `Slot ${slot}` : 'Full Paper'}</span>
                                  {slotProgress?.completed && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                                </div>
                                <span className="text-xs text-muted-foreground">{slotQuestions.length} questions</span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <Link href={`/mocks/${year}/${slot}?mode=explore`}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Search className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                                <Link href={`/mocks/${year}/${slot}`}>
                                  <Button size="sm" className="h-8 px-3 text-xs font-bold">
                                    <Play className="mr-1 h-3.5 w-3.5" />
                                    {slotProgress?.completed ? 'Retry' : 'Start'}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ---- HISTORY TAB ---- */}
        <TabsContent value="history">
          {completedTests.length === 0 ? (
            <Card className="py-16 text-center border-dashed">
              <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-bold text-lg text-foreground mb-1">No attempts yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Complete a mock test to see your history here.</p>
              <Button onClick={() => setActiveTab('available')}>
                <Play className="mr-2 h-4 w-4" /> Start Your First Mock
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{doneCount} completed test{doneCount !== 1 ? 's' : ''}</p>
              <div className="grid gap-3">
                {completedTests.map(({ year, slot, score, qCount }) => (
                  <Card key={`${year}-${slot}`} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-base">
                            CAT {year}{slot !== 'NA' && slot !== 'Unknown' ? ` · Slot ${slot}` : ''}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{qCount} questions</span>
                            {score != null && (
                              <span className="flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-yellow-500" />
                                Score: <strong className="text-foreground">{score}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/mocks/${year}/${slot}?mode=explore`}>
                          <Button variant="outline" size="sm" className="h-9 gap-1.5">
                            <Eye className="h-3.5 w-3.5" /> Review
                          </Button>
                        </Link>
                        <Link href={`/mocks/${year}/${slot}`}>
                          <Button size="sm" className="h-9 gap-1.5">
                            <Play className="h-3.5 w-3.5" /> Retry
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
