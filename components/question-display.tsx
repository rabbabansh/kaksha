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

  // Find all questions belonging to this set from the provided context list
  const questionsToDisplay = isSet 
    ? allQuestionsInContext.filter(q => q.set_id === setId).sort((a, b) => a.question_id.localeCompare(b.question_id))
    : [question];
  
  // Get the single set/passage HTML from the first question
  const setHtml = isSet ? questionsToDisplay[0].set_html : null;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isTestMode && !testFinished && (
            <span className="text-sm font-normal text-primary mr-2">[Test Mode]</span>
          )}
          {question.topic} - {question.subtopic}
        </CardTitle>
        <CardDescription>{question.source}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Display the Set HTML (Passage/Caselet) once if it's a set */}
        {isSet && setHtml && (
          <div 
            className="prose dark:prose-invert max-w-none mb-6 p-4 border rounded-lg bg-muted/50" 
            key={`${setId}-passage`}
            dangerouslySetInnerHTML={{ __html: setHtml }} 
          />
        )}
        
        {/* Map over all questions in the set (or the single question) */}
        {questionsToDisplay.map((q, index) => {
          const userAnswer = currentAnswers[q.question_id] || '';
          const showSolution = shouldShowSolution(q.question_id);
          const isCorrect = showSolution && q.answer 
            ? userAnswer.trim().toUpperCase() === q.answer.trim().toUpperCase() 
            : null;

          return (
            <div key={q.question_id}>
              {index > 0 && <Separator className="my-8" />}
              
              {/* Question Text */}
              <div className="flex gap-4 mt-4">
                <span className="text-xl font-bold">{index + 1}.</span>
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: q.question_html || '' }} />
              </div>
              
              {/* Answer Inputs */}
              <div className="ml-8 mt-4 space-y-2">
                {q.question_type === 'MCQ' ? (
                  ['A', 'B', 'C', 'D', 'E'].map(opt => {
                    const optionKey = `option_${opt.toLowerCase()}_html`;
                    if (q[optionKey] && q[optionKey] !== 'N/A') {
                      const isSelected = userAnswer === opt;
                      return (
                        <Button
                          key={opt}
                          variant={isSelected ? 'secondary' : 'outline'}
                          className={`w-full justify-start h-auto text-left whitespace-normal p-4 ${
                            isTestMode && testFinished && isSelected 
                              ? (isCorrect ? 'border-green-500 border-2' : 'border-red-500 border-2')
                              : ''
                          }`}
                          onClick={() => !showSolution && handleAnswerChange(q.question_id, opt)}
                          disabled={showSolution || (isTestMode && testFinished)}
                        >
                          <div className="flex items-start gap-4">
                            <span className="font-bold">({opt})</span>
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: q[optionKey] }} />
                          </div>
                        </Button>
                      );
                    }
                    return null;
                  })
                ) : (
                  <Input 
                    placeholder="Type your answer..."
                    value={userAnswer}
                    onChange={(e) => !showSolution && handleAnswerChange(q.question_id, e.target.value)}
                    disabled={showSolution || (isTestMode && testFinished)}
                    className={isTestMode && testFinished && userAnswer
                      ? (isCorrect ? 'border-green-500 border-2' : 'border-red-500 border-2')
                      : ''
                    }
                  />
                )}
              </div>

              {/* Check Answer Button - Only show in non-test mode or after test is finished */}
              {!isTestMode && (
                <Button onClick={() => handleCheckAnswer(q.question_id)} className="ml-8 mt-4" disabled={showSolution}>
                  Check Answer
                </Button>
              )}

              {/* Solution Display - Show in normal mode when checked, or in test mode after finishing */}
              {showSolution && (
                <div className="ml-8 mt-4 p-4 border rounded-md bg-muted/50">
                  <h3 className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect.'} The correct answer is: {q.answer}
                  </h3>
                  {isTestMode && !userAnswer && (
                    <p className="text-sm text-muted-foreground mt-2">You did not answer this question.</p>
                  )}
                  <Separator className="my-2" />
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: q.explanation_html || 'No explanation available.' }} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
