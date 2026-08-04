'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, BarChart3, HelpCircle, Clock, BrainCircuit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { PracticeReportCard } from './practice-report-card';

interface PracticeReportProps {
  topic?: string;
  questions: any[];
  sessionAttempts: any[];
  onReviewQuestion: (index: number) => void;
}

export function PracticeReport({
  topic,
  questions,
  sessionAttempts,
  onReviewQuestion,
}: PracticeReportProps) {
  const router = useRouter();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Calculate statistics
  const totalAttempted = sessionAttempts.length;
  const totalCorrect = sessionAttempts.filter(a => a.isCorrect).length;
  const totalIncorrect = totalAttempted - totalCorrect;
  const totalScore = (totalCorrect * 3) - totalIncorrect;
  
  const totalTimeTaken = sessionAttempts.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);
  const avgTimeTaken = totalAttempted > 0 ? Math.floor(totalTimeTaken / totalAttempted) : 0;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const handleFinish = () => {
    window.location.href = '/dashboard';
  };

  const generateInsights = async () => {
    if (isGeneratingInsights || aiInsights) return;
    setIsGeneratingInsights(true);
    
    try {
      const res = await fetch('/api/progress/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPractice: true,
          contextData: {
            topic,
            overallScore: totalScore,
            totalCorrect,
            totalIncorrect,
            accuracy: `${accuracy}%`,
            avgTimeTaken: `${avgTimeTaken} seconds`,
            timeTakenPerQuestion: sessionAttempts.map(a => ({
               questionTopic: a.question.topic,
               subtopic: a.question.subtopic,
               isCorrect: a.isCorrect,
               timeTakenSeconds: a.timeTaken
            }))
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiInsights(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 overflow-y-auto h-screen pb-32">
      {/* Header */}
      <div className="text-center space-y-3 mt-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Practice Report Card 📊</h1>
        <p className="text-muted-foreground text-lg">
          {topic ? `Module: ${topic}` : 'Mixed Practice'} • Kaksha Session Completed
        </p>
      </div>

      {/* Main Score Dashboard */}
      <PracticeReportCard 
        title="Kaksha Complete!"
        totalQuestions={totalAttempted}
        correctCount={totalCorrect}
        onNextStep={() => window.location.href = '/dashboard'}
        nextStepLabel="Return to Dashboard"
      />

      {/* AI Insights Section */}
      <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <BrainCircuit className="h-5 w-5" /> AI Performance Insights
            </div>
            {!aiInsights && (
              <Button size="sm" onClick={generateInsights} disabled={isGeneratingInsights} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isGeneratingInsights && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Insights
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        {aiInsights ? (
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed" translate="no">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                {aiInsights}
              </ReactMarkdown>
            </div>
          </CardContent>
        ) : (
          <CardContent>
             <p className="text-muted-foreground text-sm italic">Get a personalized AI breakdown of this practice sprint.</p>
          </CardContent>
        )}
      </Card>

      {/* Question Details Grid */}
      <div className="space-y-6 pb-20">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Review Questions
        </h2>

        <Card className="border">
          <CardHeader className="py-4 bg-muted/20">
            <CardTitle className="text-base font-bold">Session Questions</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {questions.map((q, qIdx) => {
                const attempt = sessionAttempts.find(a => a.question.question_id === q.question_id);
                let status: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                if (attempt) {
                  status = attempt.isCorrect ? 'correct' : 'incorrect';
                }

                return (
                  <button
                    key={q.question_id}
                    onClick={() => onReviewQuestion(qIdx)}
                    className={`h-14 w-14 rounded-xl border flex flex-col items-center justify-center font-bold text-sm relative transition-all hover:scale-105 ${
                      status === 'correct'
                        ? 'bg-green-100 dark:bg-green-950/20 border-green-300 text-green-700 dark:text-green-300'
                        : status === 'incorrect'
                        ? 'bg-red-100 dark:bg-red-950/20 border-red-300 text-red-700 dark:text-red-300'
                        : 'bg-white hover:bg-muted border-gray-300 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{qIdx + 1}</span>
                    <span className="absolute bottom-1">
                      {status === 'correct' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                      {status === 'incorrect' && <XCircle className="h-3 w-3 text-red-500" />}
                      {status === 'unattempted' && <HelpCircle className="h-3 w-3 text-gray-400" />}
                    </span>
                    {attempt && attempt.timeTaken && (
                       <span className="absolute -top-2 -right-2 bg-muted text-[10px] border rounded px-1 flex items-center shadow-sm text-muted-foreground bg-background">
                         <Clock className="h-2 w-2 mr-0.5"/> {attempt.timeTaken}s
                       </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
