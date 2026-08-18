'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { QuestionDisplay } from './question-display';
import { groupQuestionsBySet } from '@/lib/grouping'; // Import our new helper
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Define types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;
type GroupedByYear = Record<string, Record<string, Question[]>>;

interface PYQViewProps {
  byYearSlot: GroupedByYear;
}

// A new component to render the smart grid
const QuestionGrid = ({ 
  questions, 
  onQuestionSelect, 
  userAnswers, 
  isTestMode 
}: { 
  questions: Question[], 
  onQuestionSelect: (q: Question) => void,
  userAnswers?: Record<string, string>,
  isTestMode?: boolean
}) => {
  // Group questions by set FIRST
  const groupedQuestions = groupQuestionsBySet(questions);

  return (
    <CardContent className="grid grid-cols-8 gap-2">
      {groupedQuestions.map((questionSet, index) => {
        // questionSet is an array of questions, e.g., [q1, q2, q3] or [q1]
        // We will pass the FIRST question of the set to QuestionDisplay
        const firstQuestion = questionSet[0];
        
        // Check if any question in the set has been answered (for test mode)
        const hasAnswer = isTestMode && questionSet.some(q => userAnswers?.[q.question_id]);
        
        return (
          <Button
            key={firstQuestion.question_id}
            variant={hasAnswer ? "default" : "outline"}
            size="icon"
            // Add a visual indicator for sets
            className={questionSet.length > 1 ? 'border-primary border-2' : ''} 
            onClick={() => onQuestionSelect(firstQuestion)}
            title={questionSet.length > 1 ? `Set ${index + 1} (${questionSet.length} questions)` : `Question ${index + 1}`}
          >
            {index + 1}
          </Button>
        );
      })}
    </CardContent>
  );
};

export function PYQView({ byYearSlot }: PYQViewProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testFinished, setTestFinished] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);

  const years = Object.keys(byYearSlot).sort((a, b) => Number(b) - Number(a));
  const slots = selectedYear ? Object.keys(byYearSlot[selectedYear]).sort() : [];
  
  // This list contains ALL questions for the selected slot
  const allQuestionsInSlot = useMemo(() => {
    return (selectedYear && selectedSlot) ? byYearSlot[selectedYear][selectedSlot] : [];
  }, [byYearSlot, selectedYear, selectedSlot]);

  // Filter questions by section and search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allQuestionsInSlot;
    }

    const query = searchQuery.toLowerCase().trim();
    return allQuestionsInSlot.filter(q => {
      const questionText = (q.question_html || '').toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const subtopic = (q.subtopic || '').toLowerCase();
      const source = (q.source || '').toLowerCase();
      
      return (
        questionText.includes(query) ||
        topic.includes(query) ||
        subtopic.includes(query) ||
        source.includes(query)
      );
    });
  }, [allQuestionsInSlot, searchQuery]);

  const qaQuestions = filteredQuestions.filter(q => q.section === 'Quantitative Ability');
  const dilrQuestions = filteredQuestions.filter(q => q.section === 'Data Interpretation & Logical Reasoning');
  const varcQuestions = filteredQuestions.filter(q => q.section === 'Verbal Ability & Reading Comprehension');

  // Calculate score
  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    allQuestionsInSlot.forEach(q => {
      if (q.answer) {
        total++;
        const userAnswer = testAnswers[q.question_id] || '';
        if (userAnswer.trim().toUpperCase() === q.answer.trim().toUpperCase()) {
          correct++;
        }
      }
    });

    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  const handleStartTest = () => {
    setIsTestMode(true);
    setTestAnswers({});
    setTestFinished(false);
    setShowScoreDialog(false);
  };

  const handleFinishTest = () => {
    setTestFinished(true);
    setShowScoreDialog(true);
  };

  const handleExitTestMode = () => {
    setIsTestMode(false);
    setTestAnswers({});
    setTestFinished(false);
    setShowScoreDialog(false);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (isTestMode && !testFinished) {
      setTestAnswers(prev => ({ ...prev, [questionId]: answer }));
    }
  };

  const score = calculateScore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        {/* Test Mode Controls */}
        {selectedYear && selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Test Mode</CardTitle>
            </CardHeader>
            <CardContent>
              {!isTestMode ? (
                <Button onClick={handleStartTest} className="w-full" variant="default">
                  Start Test
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                    <span className="text-sm font-semibold">Test Mode Active</span>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(testAnswers).length} answered
                    </span>
                  </div>
                  {!testFinished ? (
                    <Button onClick={handleFinishTest} className="w-full" variant="destructive">
                      Finish Test
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md text-center">
                        <p className="text-lg font-bold">Score: {score.correct}/{score.total}</p>
                        <p className="text-sm text-muted-foreground">{score.percentage}%</p>
                      </div>
                      <Button onClick={handleExitTestMode} className="w-full" variant="outline">
                        Exit Test Mode
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Year and Slot Selection */}
        <Card>
          <CardHeader><CardTitle>Select Paper</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">Year</p>
            <div className="flex flex-wrap gap-2">
              {years.map(year => <Button 
                key={year} 
                onClick={() => { 
                  setSelectedYear(year); 
                  setSelectedSlot(null); 
                  setActiveQuestion(null);
                  if (isTestMode) handleExitTestMode();
                }} 
                variant={selectedYear === year ? 'default' : 'outline'}
                disabled={isTestMode && !testFinished}
              >
                {year}
              </Button>)}
            </div>
            {selectedYear && (
              <>
                <p className="font-semibold mt-4 mb-2">Slot</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map(slot => <Button 
                    key={slot} 
                    onClick={() => { 
                      setSelectedSlot(slot); 
                      setActiveQuestion(null);
                      if (isTestMode) handleExitTestMode();
                    }} 
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    disabled={isTestMode && !testFinished}
                  >
                    Slot {slot}
                  </Button>)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        {selectedYear && selectedSlot && !isTestMode && (
          <Card>
            <CardHeader><CardTitle>Search</CardTitle></CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Search questions, topics, or subtopics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2">
                  Found {filteredQuestions.length} result{filteredQuestions.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Question Grids */}
        {selectedYear && selectedSlot && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>VARC</CardTitle></CardHeader>
              <QuestionGrid 
                questions={varcQuestions} 
                onQuestionSelect={setActiveQuestion}
                userAnswers={testAnswers}
                isTestMode={isTestMode}
              />
            </Card>
            <Card>
              <CardHeader><CardTitle>DILR</CardTitle></CardHeader>
              <QuestionGrid 
                questions={dilrQuestions} 
                onQuestionSelect={setActiveQuestion}
                userAnswers={testAnswers}
                isTestMode={isTestMode}
              />
            </Card>
            <Card>
              <CardHeader><CardTitle>QA</CardTitle></CardHeader>
              <QuestionGrid 
                questions={qaQuestions} 
                onQuestionSelect={setActiveQuestion}
                userAnswers={testAnswers}
                isTestMode={isTestMode}
              />
            </Card>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {/* Pass allQuestionsInSlot so QuestionDisplay can find other questions in the set */}
        <QuestionDisplay 
          question={activeQuestion} 
          allQuestionsInContext={allQuestionsInSlot}
          isTestMode={isTestMode}
          testFinished={testFinished}
          testAnswers={testAnswers}
          onAnswerChange={handleAnswerChange}
        />
      </div>

      {/* Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
            <DialogDescription>
              Your performance on {selectedYear} Slot {selectedSlot}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {score.percentage}%
              </div>
              <p className="text-xl text-muted-foreground">
                {score.correct} out of {score.total} correct
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{score.correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-red-600">{score.total - score.correct}</p>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{score.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            <Button onClick={() => setShowScoreDialog(false)} className="w-full mt-4">
              Review Answers
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
