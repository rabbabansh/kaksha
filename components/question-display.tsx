'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface QuestionDisplayProps {
  question: Question | null;
  // This prop should contain all questions *within the current context* // (e.g., from one year/slot, or from all topics)
  allQuestionsInContext: Question[];
  // Test mode props
  isTestMode?: boolean;
  testFinished?: boolean;
  testAnswers?: Record<string, string>;
  onAnswerChange?: (questionId: string, answer: string) => void;
}

export function QuestionDisplay({ 
  question, 
  allQuestionsInContext,
  isTestMode = false,
  testFinished = false,
  testAnswers = {},
  onAnswerChange
}: QuestionDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

  // In test mode, use testAnswers instead of local state
  // In normal mode, use local state
  const currentAnswers = isTestMode ? testAnswers : userAnswers;
  const currentShowSolutions = isTestMode ? {} : showSolutions; // Don't show solutions in test mode until finished

  // Reset local state when the active question changes (only in non-test mode)
  useEffect(() => {
    if (!isTestMode) {
      setUserAnswers({});
      setShowSolutions({});
    }
  }, [question, isTestMode]);

  if (!question) {
    return (
      <Card className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          {isTestMode ? 'Select a question to answer in test mode.' : 'Select a question or set to begin.'}
        </p>
      </Card>
    );
  }

  // Determine if this is a set by checking its set_id
  const setId = question.set_id;
  const isSet = setId && setId !== 'N/A';

  // FIX: In CBT, we show exactly ONE question of the set at a time.
  const questionsToDisplay = [question];
  
  // Get the single set/passage HTML from the question
  const setHtml = isSet ? question.set_html : null;

  const handleCheckAnswer = (q_id: string) => {
    if (!isTestMode) {
      setShowSolutions(prev => ({ ...prev, [q_id]: true }));
    }
  };

  const handleAnswerChange = (q_id: string, answer: string) => {
    if (isTestMode && onAnswerChange) {
      onAnswerChange(q_id, answer);
    } else {
      setUserAnswers(prev => ({ ...prev, [q_id]: answer }));
    }
  };

  // Determine if solutions should be shown
  const shouldShowSolution = (q_id: string) => {
    if (isTestMode && testFinished) {
      return true; // Show all solutions after test is finished
    }
    if (isTestMode) {
      return false; // Don't show solutions during test
    }
    return currentShowSolutions[q_id] || false;
  };

  const renderQuestionBlock = (q: Question, index: number) => {
    const userAnswer = currentAnswers[q.question_id] || '';
    const showSolution = shouldShowSolution(q.question_id);
    const isCorrect = showSolution && q.answer 
      ? userAnswer.trim().toUpperCase() === q.answer.trim().toUpperCase() 
      : null;

    return (
      <div key={q.question_id} className="space-y-4">
        {/* Question Text */}
        <div className="flex gap-4">
          <div className="prose dark:prose-invert max-w-none leading-relaxed text-base notranslate" translate="no" dangerouslySetInnerHTML={{ __html: q.question_html || '' }} />
        </div>
        
        {/* Answer Inputs */}
        <div className="mt-4 space-y-3">
          {q.question_type === 'MCQ' ? (
            ['A', 'B', 'C', 'D', 'E'].map(opt => {
              const optionKey = `option_${opt.toLowerCase()}_html`;
              if (q[optionKey] && q[optionKey] !== 'N/A') {
                const isSelected = userAnswer === opt;
                
                // Colors based on state (normal vs review)
                let borderClass = 'border-border';
                let bgClass = 'bg-card hover:bg-muted/40';
                let textClass = '';

                if (isSelected) {
                  borderClass = 'border-primary ring-2 ring-primary/20 border-2';
                  bgClass = 'bg-primary/5';
                  textClass = 'text-primary font-bold';
                }

                if (showSolution) {
                  if (isSelected) {
                    if (isCorrect) {
                      borderClass = 'border-green-500 ring-2 ring-green-500/20 border-2';
                      bgClass = 'bg-green-500/10';
                      textClass = 'text-green-700 dark:text-green-300 font-bold';
                    } else {
                      borderClass = 'border-red-500 ring-2 ring-red-500/20 border-2';
                      bgClass = 'bg-red-500/10';
                      textClass = 'text-red-700 dark:text-red-300 font-bold';
                    }
                  } else if (q.answer === opt) {
                    // Highlight correct answer in green even if not selected
                    borderClass = 'border-green-500 border-2 border-dashed';
                    bgClass = 'bg-green-500/5';
                    textClass = 'text-green-700 dark:text-green-300 font-bold';
                  }
                }

                return (
                  <Button
                    key={opt}
                    variant="outline"
                    className={`w-full justify-start h-auto text-left whitespace-normal p-4 transition-all duration-200 rounded-xl notranslate ${borderClass} ${bgClass} ${textClass}`}
                    translate="no"
                    onClick={() => !showSolution && handleAnswerChange(q.question_id, opt)}
                    disabled={showSolution || (isTestMode && testFinished)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold shrink-0">({opt})</span>
                      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: q[optionKey] }} />
                    </div>
                  </Button>
                );
              }
              return null;
            })
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Type in the answer (TITA)</label>
              <Input 
                placeholder="Type your numeric answer here..."
                value={userAnswer}
                onChange={(e) => !showSolution && handleAnswerChange(q.question_id, e.target.value)}
                disabled={showSolution || (isTestMode && testFinished)}
                className={`h-12 rounded-xl text-base font-semibold ${
                  showSolution && userAnswer
                    ? (isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')
                    : userAnswer ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              />
            </div>
          )}
        </div>

        {/* Check Answer Button - Only show in non-test mode or after test is finished */}
        {!isTestMode && (
          <Button onClick={() => handleCheckAnswer(q.question_id)} className="mt-4" disabled={showSolution}>
            Check Answer
          </Button>
        )}

        {/* Solution Display - Show in normal mode when checked, or in test mode after finishing */}
        {showSolution && (
          <div className="mt-6 p-5 border rounded-xl bg-muted/30 space-y-3">
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect.'} The correct answer is: <span className="font-extrabold underline">{q.answer}</span>
            </h3>
            {isTestMode && !userAnswer && (
              <p className="text-sm text-muted-foreground">You did not answer this question.</p>
            )}
            <Separator className="my-2" />
            <div className="prose dark:prose-invert max-w-none leading-relaxed text-sm notranslate" translate="no" dangerouslySetInnerHTML={{ __html: q.explanation_html || 'No explanation available.' }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border border-border/80 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTestMode && !testFinished && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">[Test]</span>
            )}
            {question.topic}
          </div>
          <span className="text-sm font-normal text-muted-foreground">{question.source}</span>
        </CardTitle>
        <CardDescription>{question.subtopic}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {/* Split Screen Layout for Sets (passages/caselets) */}
        {isSet && setHtml ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[450px]">
            {/* Passage Panel (Scrollable) */}
            <div className="lg:max-h-[500px] lg:overflow-y-auto pr-4 border-r border-border/60 prose dark:prose-invert max-w-none p-4 rounded-xl bg-muted/20">
              <div dangerouslySetInnerHTML={{ __html: setHtml }} />
            </div>
            {/* Question Panel */}
            <div className="flex flex-col justify-between">
              {questionsToDisplay.map((q, index) => renderQuestionBlock(q, index))}
            </div>
          </div>
        ) : (
          /* Normal Standalone Layout */
          <div className="space-y-6">
             {questionsToDisplay.map((q, index) => renderQuestionBlock(q, index))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
