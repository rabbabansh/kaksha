/* eslint-disable */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, BookOpen, BarChart3, HelpCircle, BrainCircuit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DiagnosticReportProps {
  year: string;
  slot: string;
  questions: any[];
  answers: Record<string, string>;
  sections: string[];
  questionsBySection: Record<string, any[]>;
  onReviewQuestion: (sectionIndex: number, questionIndex: number) => void;
}

export function DiagnosticReport({
  year,
  slot,
  questions,
  answers,
  sections,
  questionsBySection,
  onReviewQuestion,
}: DiagnosticReportProps) {
  const router = useRouter();
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    // Try to fetch existing insights for this test
    const fetchExistingInsights = async () => {
      try {
        const res = await fetch(`/api/test-progress?year=${encodeURIComponent(year)}&slot=${encodeURIComponent(slot)}`);
        const data = await res.json();
        if (data.success && data.data?.aiInsights) {
          setAiInsights(data.data.aiInsights);
        }
      } catch (err) {
        console.error('Failed to fetch existing insights', err);
      }
    };
    fetchExistingInsights();
  }, [year, slot]);

  // Calculate statistics
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalScore = 0;

  const sectionStats = sections.map((section) => {
    const secQuestions = questionsBySection[section] || [];
    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    let score = 0;

    secQuestions.forEach((q) => {
      const ans = answers[q.question_id];
      if (ans && ans.trim() !== '') {
        attempted++;
        if (ans.trim().toUpperCase() === q.answer.trim().toUpperCase()) {
          correct++;
          score += 3;
        } else {
          incorrect++;
          score -= 1;
        }
      }
    });

    totalAttempted += attempted;
    totalCorrect += correct;
    totalIncorrect += incorrect;
    totalScore += score;

    return {
      name: section,
      total: secQuestions.length,
      attempted,
      correct,
      incorrect,
      score,
    };
  });

  const handleFinish = async () => {
    // Redirect to dashboard
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
          year,
          slot,
          isPractice: false,
          contextData: {
            overallScore: totalScore,
            totalCorrect,
            totalIncorrect,
            unattempted: questions.length - totalAttempted,
            sectionStats,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Diagnostic Test Report 📊</h1>
        <p className="text-muted-foreground text-lg">
          CAT {year} {slot !== 'NA' && slot !== 'Unknown' && ` - Slot ${slot}`} • Well done on completing your diagnostic!
        </p>
      </div>

      {/* Main Score Dashboard */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/20 bg-primary/5 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Overall Performance
            </CardTitle>
            <CardDescription>Your overall diagnostic metrics</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center my-auto pb-8">
            <div>
              <p className="text-3xl font-black text-primary">{totalScore}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">Kaksha Score</p>
            </div>
            <div>
              <p className="text-3xl font-black text-green-600">{totalCorrect}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-black text-red-500">{totalIncorrect}</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">Incorrect</p>
            </div>
            <div>
              <p className="text-3xl font-black text-muted-foreground">
                {questions.length - totalAttempted}
              </p>
              <p className="text-xs text-muted-foreground mt-1 uppercase font-semibold">Unattempted</p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Next Steps */}
        <Card className="border-green-200 dark:border-green-950/40 bg-green-500/5 flex flex-col justify-between p-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-xl text-green-700 dark:text-green-400">Unlock Dashboard</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your results have been processed! Click below to unlock your prep roadmap, personalized syllabus timeline, and AI Action Plan.
            </p>
          </div>
          <Button onClick={handleFinish} className="w-full h-12 rounded-xl mt-6 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg">
            Proceed to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Card>
      </div>

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
              <MarkdownRenderer content={aiInsights} />
            </div>
          </CardContent>
        ) : (
          <CardContent>
             <p className="text-muted-foreground text-sm italic">Get a personalized AI breakdown of your performance, highlighting strengths, weaknesses, and a recommended action plan.</p>
          </CardContent>
        )}
      </Card>

      {/* Section-wise performance table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3">Section</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Attempted</th>
                <th className="p-3 text-center">Correct</th>
                <th className="p-3 text-center">Incorrect</th>
                <th className="p-3 text-center">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {sectionStats.map((stat) => {
                const accuracy = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
                return (
                  <tr key={stat.name} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-bold">{stat.name}</td>
                    <td className="p-3 text-center font-bold text-primary">{stat.score}</td>
                    <td className="p-3 text-center">{stat.attempted} / {stat.total}</td>
                    <td className="p-3 text-center text-green-600 font-semibold">{stat.correct}</td>
                    <td className="p-3 text-center text-red-500 font-semibold">{stat.incorrect}</td>
                    <td className="p-3 text-center font-mono font-semibold">{accuracy}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Question Details Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Review Questions & Solutions
        </h2>

        {sections.map((section, secIdx) => {
          const secQuestions = questionsBySection[section] || [];
          return (
            <Card key={section} className="border">
              <CardHeader className="py-4 bg-muted/20">
                <CardTitle className="text-base font-bold">{section}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {secQuestions.map((q, qIdx) => {
                    const ans = answers[q.question_id];
                    let status: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                    if (ans && ans.trim() !== '') {
                      status = ans.trim().toUpperCase() === q.answer.trim().toUpperCase() ? 'correct' : 'incorrect';
                    }

                    return (
                      <button
                        key={q.question_id}
                        onClick={() => onReviewQuestion(secIdx, qIdx)}
                        className={`h-12 w-12 rounded-xl border flex flex-col items-center justify-center font-bold text-sm relative transition-all hover:scale-105 ${
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
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
