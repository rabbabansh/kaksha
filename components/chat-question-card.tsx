'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface ChatQuestionCardProps {
  question: Question;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function ChatQuestionCard({
  question,
  onSubmit,
  disabled = false,
}: ChatQuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer && !submitted) {
      setSubmitted(true);
      onSubmit(selectedAnswer);
    }
  };

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

  return (
    <Card className="my-4 max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg">
          {question.topic && question.subtopic ? (
            <span className="text-sm font-normal text-muted-foreground">
              {question.topic} → {question.subtopic}
            </span>
          ) : question.topic ? (
            <span className="text-sm font-normal text-muted-foreground">
              {question.topic}
            </span>
          ) : question.section ? (
            <span className="text-sm font-normal text-muted-foreground">
              {question.section}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Text */}
        {question.set_html && question.set_html.trim() !== '' && question.set_html.toUpperCase() !== 'N/A' && (
          <div
            className="prose prose-sm max-w-none mb-4 p-4 bg-muted rounded-lg"
            dangerouslySetInnerHTML={{ __html: question.set_html }}
          />
        )}
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: question.question_html || '' }}
        />

        {/* Options */}
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => !submitted && !disabled && setSelectedAnswer(option.key)}
              disabled={submitted || disabled}
              className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                selectedAnswer === option.key
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              } ${submitted || disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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

        {/* Submit Button */}
        {!submitted && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || disabled}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {submitted && (
          <div className="text-sm text-muted-foreground">
            Answer submitted: {selectedAnswer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

