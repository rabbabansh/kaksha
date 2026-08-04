'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Attempt {
  id: string;
  isCorrect: boolean;
  timeTaken: number | null;
  source: string;
  attemptedAt: string;
}

export function PastAttempts({ questionId }: { questionId: string }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/questions/${questionId}/attempts`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAttempts(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [questionId]);

  if (loading) {
    return (
      <div className="mt-6 border rounded-lg p-4 flex items-center justify-center bg-muted/20">
        <div className="animate-pulse flex items-center text-sm text-muted-foreground gap-2">
          <History className="h-4 w-4" /> Loading past attempts...
        </div>
      </div>
    );
  }

  if (attempts.length === 0) return null;

  return (
    <Card className="mt-6 bg-muted/10 border-dashed">
      <CardHeader className="py-4 border-b border-border/50">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Past Attempts
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {attempts.length} {attempts.length === 1 ? 'Attempt' : 'Attempts'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {attempt.source}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(attempt.attemptedAt).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {attempt.timeTaken && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {attempt.timeTaken}s
                  </div>
                )}
                {attempt.isCorrect ? (
                  <div className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4" /> Correct
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                    <XCircle className="h-4 w-4" /> Incorrect
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
