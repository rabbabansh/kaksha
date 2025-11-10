'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface ChatSetCardProps {
  questions: Question[];
  onSubmit: (questionId: string, answer: string) => void;
  disabled?: boolean;
  userAnswers?: Record<string, string>; // questionId -> answer
  isCorrectMap?: Record<string, boolean>; // questionId -> isCorrect
}

export function ChatSetCard({
  questions,
  onSubmit,
  disabled = false,
  userAnswers: propUserAnswers,
  isCorrectMap: propIsCorrectMap,
}: ChatSetCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  
  // Use prop values if provided, otherwise use local state
  const userAnswers = propUserAnswers || selectedAnswers;
  const isCorrectMap = propIsCorrectMap || {};
  const submittedSet = new Set(Object.keys(userAnswers));

  if (questions.length === 0) return null;

  // Get set_html from the first question (all questions in a set share the same set_html)
  const setHtml = questions[0].set_html;
  const firstQuestion = questions[0];

  const handleSubmit = (questionId: string) => {
    const answer = userAnswers[questionId];
    if (answer && !submittedSet.has(questionId)) {
      if (!propUserAnswers) {
        setSubmittedQuestions((prev) => new Set(prev).add(questionId));
      }
      onSubmit(questionId, answer);
    }
  };

  return (
    <Card className="my-4 max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">
          {firstQuestion.topic && firstQuestion.subtopic ? (
            <span className="text-sm font-normal text-muted-foreground">
              {firstQuestion.topic} → {firstQuestion.subtopic}
              {questions.length > 1 && ` (Set of ${questions.length} questions)`}
            </span>
          ) : firstQuestion.topic ? (
            <span className="text-sm font-normal text-muted-foreground">
              {firstQuestion.topic}
              {questions.length > 1 && ` (Set of ${questions.length} questions)`}
            </span>
          ) : firstQuestion.section ? (
            <span className="text-sm font-normal text-muted-foreground">
              {firstQuestion.section}
              {questions.length > 1 && ` (Set of ${questions.length} questions)`}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Set HTML (Passage/Common Content) - ALWAYS SHOW IF AVAILABLE */}
        {setHtml && setHtml.trim() !== '' && setHtml.toUpperCase() !== 'N/A' && (
          <div
            className="prose prose-sm max-w-none mb-6 p-4 bg-muted rounded-lg border-2 border-primary/20"
            dangerouslySetInnerHTML={{ __html: setHtml }}
          />
        )}

        {/* All Questions from the Set */}
        {questions.map((question, index) => {
          // Helper function to check if HTML content is N/A or empty
          const isValidOption = (html: string | null | undefined): boolean => {
            if (!html) return false;
            // Strip HTML tags and check if content is N/A
            const textContent = html.replace(/<[^>]*>/g, '').trim();
            return textContent !== '' && textContent.toUpperCase() !== 'N/A';
          };

          const options = [
            { key: 'A', html: question.option_a_html },
            { key: 'B', html: question.option_b_html },
            { key: 'C', html: question.option_c_html },
            { key: 'D', html: question.option_d_html },
            { key: 'E', html: question.option_e_html },
          ].filter((opt) => isValidOption(opt.html));

          const isSubmitted = submittedSet.has(question.question_id);
          const hasAnswer = !!userAnswers[question.question_id];
          const isCorrect = isCorrectMap[question.question_id];

          return (
            <div key={question.question_id} className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0">
              {/* Question Number */}
              {questions.length > 1 && (
                <div className="text-sm font-semibold text-muted-foreground">
                  Question {index + 1} of {questions.length}
                </div>
              )}

              {/* Question Text */}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: question.question_html || '' }}
              />

              {/* Options */}
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => {
                      if (!isSubmitted && !disabled && !propUserAnswers) {
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [question.question_id]: option.key,
                        }));
                      }
                    }}
                    disabled={isSubmitted || disabled}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      userAnswers[question.question_id] === option.key
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    } ${isSubmitted || disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">{option.key}.</span>
                      <div
                        className="prose prose-sm max-w-none flex-1"
                        dangerouslySetInnerHTML={{ __html: option.html || '' }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button for this question */}
              {!isSubmitted && (
                <Button
                  onClick={() => handleSubmit(question.question_id)}
                  disabled={!hasAnswer || disabled}
                  className="w-full"
                >
                  Submit Answer {questions.length > 1 ? `(Q${index + 1})` : ''}
                </Button>
              )}

              {isSubmitted && (
                <div className="mt-2 text-sm">
                  <div className="text-muted-foreground mb-1">
                    Answer submitted: {userAnswers[question.question_id]}
                  </div>
                  {isCorrect !== undefined && (
                    <span className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

