/* eslint-disable */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Calculator, HelpCircle, User, Award } from 'lucide-react';
import { QuestionDisplay } from './question-display';
import { DiagnosticReport } from './diagnostic-report';
import { useSession } from 'next-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface TestPageClientProps {
  year: string;
  slot: string;
  questions: Question[];
  questionsBySection: Record<string, Question[]>;
  sections: string[];
  initialProgress: {
    answers: Record<string, string>;
    flagged: string[];
    timeRemaining: number | null;
    currentSection: string | null;
    completed: boolean;
    score: number | null;
  } | null;
  isUntimed?: boolean;
}

const SECTION_TIME = 40 * 60; // 40 minutes in seconds

export function TestPageClient({
  year,
  slot,
  questions,
  questionsBySection,
  sections,
  initialProgress,
  isUntimed = false,
}: TestPageClientProps) {
  const { data: session } = useSession();

  // Initialize section index from saved progress
  const getInitialSectionIndex = () => {
    if (initialProgress?.currentSection) {
      const idx = sections.indexOf(initialProgress.currentSection);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const [currentSectionIndex, setCurrentSectionIndex] = useState(getInitialSectionIndex());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialProgress?.answers || {});
  const [flagged, setFlagged] = useState<string[]>(initialProgress?.flagged || []);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    initialProgress?.timeRemaining ?? SECTION_TIME
  );
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('0');
  const [completed, setCompleted] = useState(initialProgress?.completed || false);
  const [showReport, setShowReport] = useState(initialProgress?.completed || false);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [showEndSectionDialog, setShowEndSectionDialog] = useState(false);
  const [showEndExamDialog, setShowEndExamDialog] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeTakenMap, setTimeTakenMap] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const calculatorInputRef = useRef<HTMLDivElement>(null);

  const currentSection = sections[currentSectionIndex] || sections[0];
  const currentQuestions = useMemo(() => questionsBySection[currentSection] || [], [questionsBySection, currentSection]);

  // Order questions by ID
  const allQuestionsInSection = useMemo(() => {
    return currentQuestions.sort((a, b) => {
      const aId = parseInt(a.question_id) || 0;
      const bId = parseInt(b.question_id) || 0;
      return aId - bId;
    });
  }, [currentQuestions]);

  const currentQuestion = allQuestionsInSection[currentQuestionIndex] || null;
  const currentQuestionRef = useRef<string | null>(null);

  // Track visited questions and time taken
  useEffect(() => {
    if (currentQuestion) {
      setVisitedQuestions((prev) => {
        const next = new Set(prev);
        next.add(currentQuestion.question_id);
        return next;
      });

      // If we switched questions, record time for the previous one
      if (currentQuestionRef.current && currentQuestionRef.current !== currentQuestion.question_id) {
        const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
        setTimeTakenMap(prev => ({
          ...prev,
          [currentQuestionRef.current!]: (prev[currentQuestionRef.current!] || 0) + elapsed
        }));
      }

      currentQuestionRef.current = currentQuestion.question_id;
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestion, questionStartTime]);

  // Auto-save progress
  const saveProgress = useCallback(async () => {
    try {
      await fetch('/api/test-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          slot,
          answers,
          flagged,
          timeRemaining,
          currentSection,
          completed,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [year, slot, answers, flagged, timeRemaining, currentSection, completed]);

  // Calculate score function
  const calculateScore = useCallback(async () => {
    let score = 0;
    questions.forEach((q) => {
      const userAnswer = answers[q.question_id];
      if (userAnswer === q.answer) {
        score += 3; // Correct answer
      } else if (userAnswer && userAnswer !== q.answer) {
        score -= 1; // Wrong answer
      }
    });

    // Record the time for the very last question before submitting
    const finalElapsed = currentQuestionRef.current ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    const finalTimeTakenMap = { ...timeTakenMap };
    if (currentQuestionRef.current) {
      finalTimeTakenMap[currentQuestionRef.current] = (finalTimeTakenMap[currentQuestionRef.current] || 0) + finalElapsed;
    }

    setCompleted(true);
    setShowReport(true);
    await fetch('/api/test-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year,
        slot,
        answers,
        flagged,
        timeRemaining: 0,
        currentSection,
        completed: true,
        score,
        timeTakenMap: finalTimeTakenMap
      }),
    });
  }, [year, slot, answers, flagged, currentSection, questions, timeTakenMap, questionStartTime]);

  // Handle section end
  const handleEndSection = useCallback(() => {
    setCompletedSections((prev) => new Set([...prev, currentSectionIndex]));
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setTimeRemaining(SECTION_TIME);
      setCurrentQuestionIndex(0);
    } else {
      // All sections complete
      setCompleted(true);
      setShowReport(true);
      calculateScore();
    }
    setShowEndSectionDialog(false);
    saveProgress();
  }, [currentSectionIndex, sections.length, saveProgress, calculateScore]);

  // Handle exam end
  const handleEndExam = useCallback(() => {
    setCompleted(true);
    setShowReport(true);
    calculateScore();
    setShowEndExamDialog(false);
  }, [calculateScore]);

  // Timer effect
  useEffect(() => {
    if (isUntimed || completed || timeRemaining <= 0 || completedSections.has(currentSectionIndex)) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isUntimed, completed, timeRemaining, currentSectionIndex, completedSections]);

  // Calculator functions
  const handleCalculatorInput = useCallback((value: string) => {
    if (value === 'C') {
      setCalculatorValue('0');
    } else if (value === '=') {
      setCalculatorValue((prev) => {
        try {
          const result = eval(prev.replace(/×/g, '*').replace(/÷/g, '/'));
          return String(result);
        } catch {
          return 'Error';
        }
      });
    } else {
      setCalculatorValue((prev) => {
        if (prev === '0' || prev === 'Error') return value;
        return prev + value;
      });
    }
  }, []);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [saveProgress]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const clearResponse = () => {
    if (currentQuestion) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[currentQuestion.question_id];
        return next;
      });
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const markForReviewAndNext = () => {
    if (currentQuestion) {
      // Toggle flag to active if not flagged
      if (!flagged.includes(currentQuestion.question_id)) {
        setFlagged((prev) => [...prev, currentQuestion.question_id]);
      }
      // Go to next
      if (currentQuestionIndex < allQuestionsInSection.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const saveAndNext = () => {
    if (currentQuestionIndex < allQuestionsInSection.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string) => {
    const isAnswered = !!answers[questionId];
    const isFlagged = flagged.includes(questionId);
    const isVisited = visitedQuestions.has(questionId);

    if (isAnswered && isFlagged) return 'answered-marked';
    if (isAnswered) return 'answered';
    if (isFlagged) return 'marked';
    if (isVisited) return 'not-answered';
    return 'not-visited';
  };

  const getQuestionButtonStyles = (questionId: string) => {
    const status = getQuestionStatus(questionId);

    // CBT shapes and colors:
    // Answered: Green (rounded with a cut or just standard pill)
    if (status === 'answered') {
      return 'bg-green-600 text-white border-green-700 hover:bg-green-700 rounded-tr-3xl';
    }
    // Answered & Marked: Purple circular with a check/tick (represented as tick badge)
    if (status === 'answered-marked') {
      return 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 rounded-full ring-2 ring-green-400';
    }
    // Marked for Review (not answered): Blue/Purple circular
    if (status === 'marked') {
      return 'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600 rounded-full';
    }
    // Not Answered: Red trapezoid/cut shape
    if (status === 'not-answered') {
      return 'bg-red-500 text-white border-red-600 hover:bg-red-600 rounded-bl-3xl';
    }
    // Not Visited: Gray rectangle
    return 'bg-gray-100 dark:bg-zinc-800 border-gray-300 text-gray-800 dark:text-zinc-300 hover:bg-gray-200';
  };

  const canSwitchSection = completedSections.has(currentSectionIndex) || completed;
  const isCurrentSectionCompleted = completedSections.has(currentSectionIndex);

  // If completed and showReport is true, display report dashboard
  if (completed && showReport) {
    return (
      <DiagnosticReport
        year={year}
        slot={slot}
        questions={questions}
        answers={answers}
        sections={sections}
        questionsBySection={questionsBySection}
        onReviewQuestion={(secIdx, qIdx) => {
          setCurrentSectionIndex(secIdx);
          setCurrentQuestionIndex(qIdx);
          setShowReport(false);
        }}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">

      {/* Review Mode Banner */}
      {completed && (
        <div className="bg-primary/10 border-b border-primary/20 p-3 flex justify-between items-center px-6 text-sm font-medium">
          <span>👀 You are currently reviewing your completed test. Correct answers and explanations are shown.</span>
          <Button onClick={() => setShowReport(true)} size="sm">Back to Report Card</Button>
        </div>
      )}

      {/* Top Header - CAT CBT Style */}
      <header className="bg-zinc-900 text-white px-6 py-2 flex items-center justify-between border-b-4 border-primary">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-zinc-300">
              CAT {year} Online Examination
            </h1>
            <p className="text-xs text-zinc-400">Diagnostic Baseline Test</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Clock */}
          {!isCurrentSectionCompleted && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded border border-zinc-700 text-primary-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-bold tracking-wider">
                {isUntimed ? 'UNTIMED MODE' : `Time Left: ${formatTime(timeRemaining)}`}
              </span>
            </div>
          )}

          {/* Calculator Trigger */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCalculatorOpen(!calculatorOpen)}
            className="text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Calculator className="h-4 w-4 mr-1.5" />
            Calculator
          </Button>

          {/* Profile details */}
          <div className="flex items-center gap-3 border-l border-zinc-700 pl-6">
            <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || 'User'} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-zinc-300" />
              )}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-zinc-100">{session?.user?.name || 'Aspirant'}</p>
              <p className="text-[10px] text-zinc-400">ID: K-{session?.user?.email?.split('@')[0] || '1000'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Thin Section Tabs - CAT CBT Style */}
      <div className="bg-muted/30 border-b border-border/80 px-6 py-2 flex items-center justify-between">
        <div className="flex gap-2">
          {sections.map((section, idx) => {
            const isCompleted = completedSections.has(idx);
            const isCurrent = idx === currentSectionIndex;
            return (
              <Button
                key={section}
                variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}
                size="sm"
                className={`px-6 font-semibold uppercase ${isCurrent ? 'bg-primary text-primary-foreground shadow-sm' : ''}`}
                onClick={() => {
                  if (canSwitchSection && !completed) {
                    setCurrentSectionIndex(idx);
                    setCurrentQuestionIndex(0);
                  }
                }}
                disabled={completed || (!canSwitchSection && !isCurrent)}
              >
                {section} {isCompleted && '✓'}
              </Button>
            );
          })}
        </div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Section: <span className="text-foreground">{currentSection}</span>
        </div>
      </div>

      {/* Main Workspace - CBT Split Screen & Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Side: Question Display */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <QuestionDisplay
            question={currentQuestion}
            allQuestionsInContext={allQuestionsInSection}
            isTestMode={true}
            testFinished={completed || isCurrentSectionCompleted}
            testAnswers={answers}
            onAnswerChange={handleAnswerChange}
          />
        </div>

        {/* Right Side: Sidebar with Palette & Details */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/80 bg-muted/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">

            {/* Candidate Box */}
            <Card className="border bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Section Questions</h4>
                  <p className="text-xs text-muted-foreground">Select a question to view it</p>
                </div>
              </CardContent>
            </Card>

            {/* Question Palette Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2">
                {allQuestionsInSection.map((question, idx) => {
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <Button
                      key={question.question_id}
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 text-xs font-bold border transition-all duration-200 ${getQuestionButtonStyles(question.question_id)} ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Legend info matching real CBT */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legend</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-green-600 rounded-tr-lg border border-green-700"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-red-500 rounded-bl-lg border border-red-600"></div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 rounded"></div>
                  <span>Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-indigo-500 rounded-full"></div>
                  <span>Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <div className="h-4 w-4 bg-indigo-600 rounded-full ring-2 ring-green-400"></div>
                  <span>Answered & Marked for Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Floating sidebar box */}
          {calculatorOpen && (
            <Card className="mt-6 border-zinc-200 dark:border-zinc-800">
              <CardHeader className="py-3 bg-zinc-50 dark:bg-zinc-900 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase">Scientific Calculator</CardTitle>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setCalculatorOpen(false)}>×</Button>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div ref={calculatorInputRef} className="p-3 bg-muted rounded text-right text-lg font-mono min-h-[40px] flex items-center justify-end">{calculatorValue}</div>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['C', '÷', '×', '⌫', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map((op) => (
                    <Button
                      key={op}
                      variant="outline"
                      size="sm"
                      className={`h-8 font-mono ${op === '=' ? 'bg-primary text-primary-foreground col-span-1' : op === '0' ? 'col-span-2' : ''}`}
                      onClick={() => {
                        if (op === '⌫') setCalculatorValue((prev) => prev.slice(0, -1) || '0');
                        else handleCalculatorInput(op);
                      }}
                    >
                      {op}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Bottom Control Bar - CBT Style */}
      <footer className="bg-zinc-100 dark:bg-zinc-900 border-t border-border/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">

        {/* Left Side Controls */}
        <div className="flex gap-2 w-full sm:w-auto">
          {!isCurrentSectionCompleted && !completed && (
            <>
              <Button
                variant="outline"
                onClick={markForReviewAndNext}
                className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 hover:bg-indigo-100 rounded-xl px-5 text-xs font-bold"
              >
                Mark for Review & Next
              </Button>
              <Button
                variant="ghost"
                onClick={clearResponse}
                className="text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-xl px-5 text-xs font-bold"
              >
                Clear Response
              </Button>
            </>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="rounded-xl px-5 text-xs font-bold"
          >
            Previous
          </Button>

          {!isCurrentSectionCompleted && !completed && (
            <Button
              onClick={saveAndNext}
              disabled={currentQuestionIndex === allQuestionsInSection.length - 1}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 text-xs font-bold shadow-md"
            >
              Save & Next
            </Button>
          )}

          {!completed && !isCurrentSectionCompleted && (
            <Button
              variant="outline"
              onClick={() => setShowEndSectionDialog(true)}
              className="border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900/40 dark:hover:bg-red-950/20 rounded-xl px-5 text-xs font-bold"
            >
              {currentSectionIndex < sections.length - 1 ? 'End Section' : 'Submit Exam'}
            </Button>
          )}

          {isCurrentSectionCompleted && currentSectionIndex < sections.length - 1 && (
            <Button
              onClick={() => {
                setCurrentSectionIndex(currentSectionIndex + 1);
                setCurrentQuestionIndex(0);
              }}
              className="rounded-xl px-6 text-xs font-bold"
            >
              Next Section
            </Button>
          )}

          {!completed && (
            <Button
              variant="destructive"
              onClick={() => setShowEndExamDialog(true)}
              className="rounded-xl px-5 text-xs font-bold shadow-md"
            >
              End Exam
            </Button>
          )}
        </div>
      </footer>

      {/* End Section Dialog */}
      <Dialog open={showEndSectionDialog} onOpenChange={setShowEndSectionDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>End Section?</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to end the <strong>{currentSection}</strong> section? You will not be able to return to this section.
              {currentSectionIndex < sections.length - 1
                ? ' You will automatically move to the next section.'
                : ' Since this is the final section, ending it will submit and complete your entire exam.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowEndSectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleEndSection}>
              {currentSectionIndex < sections.length - 1 ? 'End Section' : 'Submit & End Exam'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Exam Dialog */}
      <Dialog open={showEndExamDialog} onOpenChange={setShowEndExamDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Submit & End Exam?</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to end the exam? This will submit all your answers and calculate your score.
              You will not be able to return to the exam after ending it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowEndExamDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleEndExam}>
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
