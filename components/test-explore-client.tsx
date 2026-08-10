'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionDisplay } from './question-display';
import { groupQuestionsBySet } from '@/lib/grouping';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface TestExploreClientProps {
  year: string;
  slot: string;
  questions: Question[];
  questionsBySection: Record<string, Question[]>;
  sections: string[];
}

export function TestExploreClient({
  year,
  slot,
  questionsBySection,
  sections,
}: TestExploreClientProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentSection = sections[currentSectionIndex] || sections[0];
  const currentQuestions = useMemo(() => questionsBySection[currentSection] || [], [questionsBySection, currentSection]);
  const groupedQuestions = useMemo(() => groupQuestionsBySet(currentQuestions), [currentQuestions]);
  const currentQuestion = groupedQuestions[currentQuestionIndex]?.[0] || null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tests
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">
              CAT {year}
              {slot !== 'NA' && slot !== 'Unknown' && ` - Slot ${slot}`}
            </h1>
            <p className="text-muted-foreground">Explore Mode - No timer, browse all questions</p>
          </div>
          <Link href={`/mocks/${year}/${slot}`}>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Test
            </Button>
          </Link>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2">
          {sections.map((section, idx) => (
            <Button
              key={section}
              variant={idx === currentSectionIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCurrentSectionIndex(idx);
                setCurrentQuestionIndex(0);
              }}
            >
              {section}
            </Button>
          ))}
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
              <div className="grid grid-cols-5 gap-2">
                {groupedQuestions.map((questionSet, idx) => {
                  const firstQ = questionSet[0];
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <Button
                      key={firstQ.question_id}
                      variant={isActive ? 'default' : 'outline'}
                      size="icon"
                      className={`h-10 w-10 ${isActive ? 'bg-primary' : ''}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Total: {groupedQuestions.length} questions</p>
                <p>Section: {currentSection}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <QuestionDisplay
                question={currentQuestion}
                allQuestionsInContext={currentQuestions}
                isTestMode={false}
                testFinished={true}
              />
              
              {currentQuestion && (
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {groupedQuestions.length}
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex < groupedQuestions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      } else if (currentSectionIndex < sections.length - 1) {
                        // Move to next section
                        setCurrentSectionIndex(currentSectionIndex + 1);
                        setCurrentQuestionIndex(0);
                      }
                    }}
                    disabled={currentQuestionIndex === groupedQuestions.length - 1 && currentSectionIndex === sections.length - 1}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

