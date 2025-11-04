'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type Question = any;

interface QuestionDisplayProps {
  question: Question | null;
  // This prop should contain all questions *within the current context* // (e.g., from one year/slot, or from all topics)
  allQuestionsInContext: Question[]; 
}

export function QuestionDisplay({ question, allQuestionsInContext }: QuestionDisplayProps) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

  // Reset state when the active question changes
  useEffect(() => {
    setUserAnswers({});
    setShowSolutions({});
  }, [question]);

  if (!question) {
    return (
      <Card className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Select a question or set to begin.</p>
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
    setShowSolutions(prev => ({ ...prev, [q_id]: true }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question.topic} - {question.subtopic}</CardTitle>
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
          const userAnswer = userAnswers[q.question_id] || '';
          const showSolution = showSolutions[q.question_id] || false;
          const isCorrect = showSolution ? userAnswer.trim().toUpperCase() === q.answer?.trim().toUpperCase() : null;

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
                      return (
                        <Button
                          key={opt}
                          variant={userAnswer === opt ? 'secondary' : 'outline'}
                          className="w-full justify-start h-auto text-left whitespace-normal p-4"
                          onClick={() => !showSolution && setUserAnswers(prev => ({ ...prev, [q.question_id]: opt }))}
                          disabled={showSolution}
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
                    onChange={(e) => !showSolution && setUserAnswers(prev => ({ ...prev, [q.question_id]: e.target.value }))}
                    disabled={showSolution}
                  />
                )}
              </div>

              {/* Check Answer Button */}
              <Button onClick={() => handleCheckAnswer(q.question_id)} className="ml-8 mt-4" disabled={showSolution}>
                Check Answer
              </Button>

              {/* Solution Display */}
              {showSolution && (
                <div className="ml-8 mt-4 p-4 border rounded-md bg-muted/50">
                  <h3 className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect.'} The correct answer is: {q.answer}
                  </h3>
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
