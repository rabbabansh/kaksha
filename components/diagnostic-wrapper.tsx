/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Dumbbell, ShieldAlert, Sparkles } from 'lucide-react';
import { TestPageClient } from '@/components/test-page-client';

interface DiagnosticWrapperProps {
  questions: any[];
  questionsBySection: Record<string, any[]>;
  sections: string[];
  initialProgress: any;
  year: string;
  slot: string;
}

const EASY_QUESTION_IDS = new Set([
  'ReadingComprehension-ReadingComprehension-P1-Set1-Q1',
  'ReadingComprehension-ReadingComprehension-P1-Set1-Q2',
  'ReadingComprehension-ReadingComprehension-P1-Set1-Q3',
  'ReadingComprehension-ReadingComprehension-P1-Set1-Q4',
  'ParaSummary-ParaSummary-Q1',
  'DI-Games&Tournaments--P1-Set1-Q1',
  'DI-Games&Tournaments--P1-Set1-Q2',
  'DI-Games&Tournaments--P1-Set1-Q3',
  'DI-Games&Tournaments--P1-Set1-Q4',
  'DI-Games&Tournaments--P1-Set1-Q5',
  'CAT2024S1-QA-A-A--1',
  'CAT2024S1-QA-A-QE--1',
  'CAT2024S1-QA-A-P&L--1',
  'CAT2024S1-QA-A-L--1',
  'CAT2024S1-QA-A-S&CI--1'
]);

export function DiagnosticWrapper({
  questions,
  questionsBySection,
  sections,
  initialProgress,
  year,
  slot,
}: DiagnosticWrapperProps) {
  const [started, setStarted] = useState(false);
  const [isUntimed, setIsUntimed] = useState(true);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');

  // Load configuration from localStorage if resuming an already-started test
  useEffect(() => {
    if (initialProgress) {
      // Only skip intro if test was actually started (has saved answers or question index)
      const hasStarted = initialProgress.answers && Object.keys(initialProgress.answers).length > 0;
      if (hasStarted) {
        setStarted(true);
        const savedConfig = localStorage.getItem('diagnostic_config');
        if (savedConfig) {
          try {
            const { untimed, diff } = JSON.parse(savedConfig);
            setIsUntimed(untimed);
            setDifficulty(diff);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [initialProgress]);

  const handleStart = () => {
    // Save configuration
    localStorage.setItem(
      'diagnostic_config',
      JSON.stringify({ untimed: isUntimed, diff: difficulty })
    );
    setStarted(true);
  };

  // If started, slice the questions based on easy vs hard mode
  // Easy: 5 questions per section
  // Hard: 10 questions per section (full set)
  const finalQuestionsBySection = { ...questionsBySection };
  let finalQuestions = [...questions];

  if (started) {
    if (difficulty === 'easy') {
      sections.forEach((sec) => {
        finalQuestionsBySection[sec] = (questionsBySection[sec] || []).filter(q => EASY_QUESTION_IDS.has(q.question_id));
      });
    } else {
      sections.forEach((sec) => {
        finalQuestionsBySection[sec] = (questionsBySection[sec] || []);
      });
    }
    finalQuestions = sections.flatMap((sec) => finalQuestionsBySection[sec]);
  }

  if (!started) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="border-primary/20 shadow-xl bg-card overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary" />
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary animate-pulse">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              CAT Diagnostic Test 🎯
            </CardTitle>
            <CardDescription className="text-base mt-2 max-w-xl mx-auto leading-relaxed">
              Welcome! Let&apos;s discover your starting baseline. This quick test helps Kaksha build a personalized prep timeline tailored directly to your strengths and weaknesses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-6 md:px-10">
            {/* Explanations */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-muted/30 flex gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Flexible Timing</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose to practice at your own pace (Untimed), or simulate the real CAT exam pressure (Timed).
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-muted/30 flex gap-3">
                <Dumbbell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Tailored Length</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a short 15-question test (Easy) to get a quick baseline, or a full 30-question test (Hard) for a thorough analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Config Options */}
            <div className="space-y-6 pt-4 border-t">
              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-tight">Select Test Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUntimed(true)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isUntimed
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <p className="font-bold text-sm">Untimed Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">Practice without timer pressure</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUntimed(false)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      !isUntimed
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <p className="font-bold text-sm">Timed Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">40 minutes per section (simulated)</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-tight">Select Difficulty & Length</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDifficulty('easy')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === 'easy'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <p className="font-bold text-sm">Easy Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">15 questions total (5 per section)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('hard')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      difficulty === 'hard'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <p className="font-bold text-sm">Hard Mode</p>
                    <p className="text-xs text-muted-foreground mt-1">30 questions total (10 per section)</p>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3 text-sm text-yellow-800 dark:text-yellow-200">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-xs">
                <strong>Important:</strong> You must submit the test to unlock your dashboard and generate your AI action plan. You can pause and resume the test at any time.
              </p>
            </div>
          </CardContent>
          <CardFooter className="px-6 md:px-10 pb-10 pt-4 text-center justify-center">
            <Button onClick={handleStart} size="lg" className="h-14 px-12 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-all">
              <Play className="h-5 w-5 mr-2 fill-primary-foreground" />
              Start Diagnostic Test
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <TestPageClient
      year={year}
      slot={slot}
      questions={finalQuestions}
      questionsBySection={finalQuestionsBySection}
      sections={sections}
      initialProgress={initialProgress}
      isUntimed={isUntimed}
    />
  );
}
