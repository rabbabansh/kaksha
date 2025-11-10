'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Calculator, Flag, X } from 'lucide-react';
import { QuestionDisplay } from './question-display';

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
}

const SECTION_TIME = 40 * 60; // 40 minutes in seconds

export function TestPageClient({
  year,
  slot,
  questions,
  questionsBySection,
  sections,
  initialProgress,
}: TestPageClientProps) {
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
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [showEndSectionDialog, setShowEndSectionDialog] = useState(false);
  const [showEndExamDialog, setShowEndExamDialog] = useState(false);
  const calculatorInputRef = useRef<HTMLDivElement>(null);

  const currentSection = sections[currentSectionIndex] || sections[0];
  const currentQuestions = questionsBySection[currentSection] || [];
  // Show one square per question, not grouped by set
  const allQuestionsInSection = useMemo(() => {
    return currentQuestions.sort((a, b) => {
      const aId = parseInt(a.question_id) || 0;
      const bId = parseInt(b.question_id) || 0;
      return aId - bId;
    });
  }, [currentQuestions]);
  const currentQuestion = allQuestionsInSection[currentQuestionIndex] || null;

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
        score -= 1; // Wrong answer (negative marking)
      }
    });

    setCompleted(true);
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
      }),
    });
  }, [year, slot, answers, flagged, currentSection, questions]);

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
      calculateScore();
    }
    setShowEndSectionDialog(false);
    saveProgress();
  }, [currentSectionIndex, sections.length, saveProgress, calculateScore]);

  // Handle exam end
  const handleEndExam = useCallback(() => {
    setCompleted(true);
    calculateScore();
    setShowEndExamDialog(false);
  }, [calculateScore]);

  // Timer effect
  useEffect(() => {
    if (completed || timeRemaining <= 0 || completedSections.has(currentSectionIndex)) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [completed, timeRemaining, currentSectionIndex, completedSections]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 10000);

    return () => clearInterval(interval);
  }, [saveProgress]);

  // Keyboard support for calculator
  useEffect(() => {
    if (!calculatorOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with text inputs
      }

      const key = e.key;
      if (key >= '0' && key <= '9') {
        handleCalculatorInput(key);
      } else if (key === '.') {
        handleCalculatorInput('.');
      } else if (key === '+' || key === '-') {
        handleCalculatorInput(key);
      } else if (key === '*') {
        handleCalculatorInput('×');
      } else if (key === '/') {
        e.preventDefault();
        handleCalculatorInput('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculatorInput('=');
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        if (e.ctrlKey || e.metaKey) {
          handleCalculatorInput('C');
        }
      } else if (key === 'Backspace') {
        setCalculatorValue((prev) => prev.slice(0, -1) || '0');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [calculatorOpen]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string) => {
    if (answers[questionId]) return 'answered';
    if (flagged.includes(questionId)) return 'flagged';
    if (timeRemaining <= 0 || completedSections.has(currentSectionIndex)) return 'timeout';
    return 'unanswered';
  };

  const getQuestionButtonColor = (questionId: string) => {
    const status = getQuestionStatus(questionId);
    if (status === 'answered') return 'bg-green-500 hover:bg-green-600 text-white';
    if (status === 'flagged') return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    if (status === 'timeout') return 'bg-red-500 hover:bg-red-600 text-white';
    return 'bg-white hover:bg-gray-100 border border-gray-300 text-gray-900';
  };

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('0');
    } else if (value === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(calculatorValue.replace(/×/g, '*').replace(/÷/g, '/'));
        setCalculatorValue(String(result));
      } catch {
        setCalculatorValue('Error');
      }
    } else {
      setCalculatorValue((prev) => {
        if (prev === '0' || prev === 'Error') return value;
        return prev + value;
      });
    }
  };

  const canSwitchSection = completedSections.has(currentSectionIndex) || completed;
  const isCurrentSectionCompleted = completedSections.has(currentSectionIndex);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              CAT {year}
              {slot !== 'NA' && slot !== 'Unknown' && ` - Slot ${slot}`}
            </h1>
            <p className="text-muted-foreground">Section: {currentSection}</p>
          </div>
          <div className="flex items-center gap-4">
            {!isCurrentSectionCompleted && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining <= 60 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                timeRemaining <= 300 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="text-xl font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
            {isCurrentSectionCompleted && (
              <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Section Completed
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setCalculatorOpen(!calculatorOpen)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </Button>
            {!completed && (
              <Button
                variant="destructive"
                onClick={() => setShowEndExamDialog(true)}
              >
                End Exam
              </Button>
            )}
          </div>
        </div>

        {/* Section Progress */}
        <div className="flex gap-2">
          {sections.map((section, idx) => {
            const isCompleted = completedSections.has(idx);
            const isCurrent = idx === currentSectionIndex;
            return (
              <Button
                key={section}
                variant={isCurrent ? 'default' : isCompleted ? 'secondary' : 'outline'}
                size="sm"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto">
                {allQuestionsInSection.map((question, idx) => {
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <Button
                      key={question.question_id}
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 ${getQuestionButtonColor(question.question_id)} ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-green-500 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-yellow-500 rounded"></div>
                  <span>Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-white border border-gray-300 rounded"></div>
                  <span>Not Attempted</span>
                </div>
                {(timeRemaining <= 0 || isCurrentSectionCompleted) && (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-red-500 rounded"></div>
                    <span>Time Up</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Question Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <QuestionDisplay
                question={currentQuestion}
                allQuestionsInContext={allQuestionsInSection}
                isTestMode={true}
                testFinished={completed || isCurrentSectionCompleted}
                testAnswers={answers}
                onAnswerChange={handleAnswerChange}
              />
              
              {currentQuestion && (
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => toggleFlag(currentQuestion.question_id)}
                    className={flagged.includes(currentQuestion.question_id) ? 'bg-yellow-100' : ''}
                  >
                    <Flag className={`h-4 w-4 mr-2 ${flagged.includes(currentQuestion.question_id) ? 'fill-yellow-500' : ''}`} />
                    {flagged.includes(currentQuestion.question_id) ? 'Unflag' : 'Flag'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    {!isCurrentSectionCompleted && (
                      <Button
                        onClick={() => {
                          if (currentQuestionIndex < allQuestionsInSection.length - 1) {
                            setCurrentQuestionIndex(currentQuestionIndex + 1);
                          }
                        }}
                        disabled={currentQuestionIndex === allQuestionsInSection.length - 1}
                      >
                        Next
                      </Button>
                    )}
                    {!isCurrentSectionCompleted && currentQuestionIndex === allQuestionsInSection.length - 1 && (
                      <Button
                        variant="destructive"
                        onClick={() => setShowEndSectionDialog(true)}
                      >
                        End Section
                      </Button>
                    )}
                    {isCurrentSectionCompleted && currentSectionIndex < sections.length - 1 && (
                      <Button
                        onClick={() => {
                          setCurrentSectionIndex(currentSectionIndex + 1);
                          setCurrentQuestionIndex(0);
                        }}
                      >
                        Next Section
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calculator Sidebar */}
        {calculatorOpen && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Calculator
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalculatorOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div 
                    ref={calculatorInputRef}
                    className="p-4 bg-muted rounded text-right text-2xl font-mono min-h-[60px] flex items-center justify-end"
                    tabIndex={0}
                  >
                    {calculatorValue}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['C', '÷', '×', '⌫'].map((op) => (
                      <Button
                        key={op}
                        variant="outline"
                        onClick={() => {
                          if (op === '⌫') {
                            setCalculatorValue((prev) => prev.slice(0, -1) || '0');
                          } else {
                            handleCalculatorInput(op);
                          }
                        }}
                      >
                        {op}
                      </Button>
                    ))}
                    {['7', '8', '9', '-'].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        onClick={() => handleCalculatorInput(val)}
                      >
                        {val}
                      </Button>
                    ))}
                    {['4', '5', '6', '+'].map((val) => (
                      <Button
                        key={val}
                        variant="outline"
                        onClick={() => handleCalculatorInput(val)}
                      >
                        {val}
                      </Button>
                    ))}
                    {['1', '2', '3', '='].map((val) => (
                      <Button
                        key={val}
                        variant={val === '=' ? 'default' : 'outline'}
                        onClick={() => handleCalculatorInput(val)}
                      >
                        {val}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => handleCalculatorInput('0')}
                      className="col-span-2"
                    >
                      0
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCalculatorInput('.')}
                    >
                      .
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keyboard shortcuts: 0-9, +, -, *, /, Enter (=), Backspace, Esc (clear)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* End Section Dialog */}
      <Dialog open={showEndSectionDialog} onOpenChange={setShowEndSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Section?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end the {currentSection} section? You will not be able to return to this section.
              {currentSectionIndex < sections.length - 1 && ' You will move to the next section.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndSectionDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndSection}>
              End Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Exam Dialog */}
      <Dialog open={showEndExamDialog} onOpenChange={setShowEndExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end the exam? This will submit all your answers and calculate your score.
              You will not be able to return to the exam after ending it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndExamDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndExam}>
              End Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
