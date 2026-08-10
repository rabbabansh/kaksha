'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Search, Clock, FileText, Eye } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface TestSelectionClientProps {
  byYearSlot: Record<string, Record<string, Question[]>>;
  progressMap: Map<string, { completed: boolean; score?: number | null }>;
}

export function TestSelectionClient({ byYearSlot, progressMap }: TestSelectionClientProps) {
  const years = Object.keys(byYearSlot).sort((a, b) => Number(b) - Number(a));
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || '');

  const slots = selectedYear ? Object.keys(byYearSlot[selectedYear]).sort() : [];
  const [selectedSlot, setSelectedSlot] = useState<string>(slots[0] || '');

  const currentQuestions = selectedYear && selectedSlot 
    ? byYearSlot[selectedYear][selectedSlot] 
    : [];
  const progress = selectedYear && selectedSlot 
    ? progressMap.get(`${selectedYear}-${selectedSlot}`)
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Practice Tests</h1>
        <p className="text-muted-foreground text-lg">
          Select a previous year question paper to start practicing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Test</CardTitle>
            <CardDescription>Choose the year and slot you want to practice</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={(value) => {
                setSelectedYear(value);
                const newSlots = Object.keys(byYearSlot[value]).sort();
                setSelectedSlot(newSlots[0] || '');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      CAT {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slot</label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select slot" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      Slot {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedYear && selectedSlot && currentQuestions.length > 0 && (
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    CAT {selectedYear}
                    {selectedSlot !== 'NA' && selectedSlot !== 'Unknown' && ` - Slot ${selectedSlot}`}
                  </h3>
                  {progress?.completed && (
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full mt-1 inline-block">
                      Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{currentQuestions.length} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>120 min</span>
                </div>
              </div>

              {progress?.score !== null && progress?.score !== undefined && (
                <div className="text-sm">
                  <span className="font-medium">Score: </span>
                  <span>{progress.score}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Link href={`/mocks/${selectedYear}/${selectedSlot}`} className="flex-1">
                  <Button className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Mock Test
                  </Button>
                </Link>
                
                <Link href={`/mocks/${selectedYear}/${selectedSlot}?mode=explore`} className="flex-1">
                  <Button className="w-full" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Explore Questions
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <CardTitle className="text-2xl text-indigo-700 dark:text-indigo-400">Weekly Mock Test</CardTitle>
          <CardDescription>
            Take a full-length mock test this week to build your endurance and evaluate your overall standing.
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

      {/* Quick access to all tests */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Available Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.map((year) => {
            const yearSlots = Object.keys(byYearSlot[year]).sort();
            return (
              <Card key={year} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">CAT {year}</CardTitle>
                  <CardDescription>
                    {yearSlots.length} slot{yearSlots.length !== 1 ? 's' : ''} available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {yearSlots.map((slot) => {
                      const slotQuestions = byYearSlot[year][slot];
                      const showSlotLabel = slot !== 'NA' && slot !== 'Unknown';
                      return (
                        <div key={slot} className="flex flex-col gap-2 p-2 rounded border">
                          <div className="flex items-center justify-between">
                            {showSlotLabel ? (
                              <span className="font-medium">Slot {slot}</span>
                            ) : (
                              <span className="font-medium">All Questions</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">
                              {slotQuestions.length} questions
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Link href={`/mocks/${year}/${slot}?mode=explore`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Search className="mr-2 h-4 w-4" /> Explore
                              </Button>
                            </Link>
                            <Link href={`/mocks/${year}/${slot}`}>
                              <Button size="sm" className="w-full">
                                <Play className="mr-2 h-4 w-4" /> Start
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
    </div>
  );
}

