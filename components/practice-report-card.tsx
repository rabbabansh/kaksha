import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trophy } from 'lucide-react';

interface PracticeReportCardProps {
  totalQuestions: number;
  correctCount: number;
  skippedCount?: number;
  avgTimePerQuestion?: number;
  onNextStep?: () => void;
  nextStepLabel?: string;
  title?: string;
}

export function PracticeReportCard({
  totalQuestions,
  correctCount,
  skippedCount = 0,
  avgTimePerQuestion,
  onNextStep = () => window.location.href = '/dashboard',
  nextStepLabel = "Return to Dashboard",
  title = "Kaksha Complete!"
}: PracticeReportCardProps) {
  const incorrectCount = totalQuestions - correctCount - skippedCount;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-indigo-100 overflow-hidden">
      <div className="bg-gradient-to-br from-indigo-50 to-white pt-12 pb-8 px-6 text-center">
        <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-2 text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          You scored {correctCount} out of {totalQuestions}. XP updated!
        </p>

        <div className={`grid ${avgTimePerQuestion !== undefined ? (skippedCount > 0 ? 'grid-cols-6' : 'grid-cols-5') : (skippedCount > 0 ? 'grid-cols-5' : 'grid-cols-4')} gap-4 bg-white rounded-xl shadow-sm border p-4 mb-8`}>
          <div className="text-left">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
            <p className="text-lg font-bold text-foreground">{totalQuestions}</p>
          </div>
          <div className="text-left border-l pl-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Correct</p>
            <p className="text-lg font-bold text-green-600">{correctCount}</p>
          </div>
          <div className="text-left border-l pl-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Incorrect</p>
            <p className="text-lg font-bold text-red-500">{incorrectCount}</p>
          </div>
          {skippedCount > 0 && (
            <div className="text-left border-l pl-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Skipped</p>
              <p className="text-lg font-bold text-muted-foreground">{skippedCount}</p>
            </div>
          )}
          <div className="text-left border-l pl-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-lg font-bold text-foreground">{accuracy}%</p>
          </div>
          {avgTimePerQuestion !== undefined && (
             <div className="text-left border-l pl-3">
               <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Time</p>
               <p className="text-lg font-bold text-indigo-600">{avgTimePerQuestion}s</p>
             </div>
          )}
        </div>

        <Button onClick={onNextStep} size="lg" className="w-full sm:w-auto font-bold bg-foreground hover:bg-foreground/90 text-background px-8">
          {nextStepLabel}
        </Button>
      </div>
    </Card>
  );
}
