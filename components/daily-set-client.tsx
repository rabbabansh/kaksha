'use client';

import { useState, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { AITutorPanel } from '@/components/ai-tutor-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trophy, 
  BookOpen, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

interface DailySetClientProps {
  type: 'RC' | 'DILR';
}

export function DailySetClient({ type }: DailySetClientProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [setData, setSetData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ score: number; total: number; correctCount: number } | null>(null);

  useEffect(() => {
    async function loadDailySet() {
      try {
        const res = await fetch(`/api/practice/daily-set?type=${type}`, { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          setSetData(json.data);
        } else {
          setErrorMsg(json.error || 'Failed to load today’s daily set.');
        }
      } catch (e: any) {
        setErrorMsg('Network error while loading daily set.');
      } finally {
        setLoading(false);
      }
    }
    loadDailySet();
  }, [type]);

  const questions = setData?.questions || [];
  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (optionKey: string) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.question_id]: optionKey
    }));
  };

  const handleSubmitSet = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      let correctCount = 0;

      // Submit each question attempt
      for (const q of questions) {
        const userAns = answers[q.question_id] || '';
        const isCorrect = userAns.trim().toLowerCase() === (q.answer || '').trim().toLowerCase();
        if (isCorrect) correctCount += 1;

        await fetch('/api/progress/attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: q.question_id,
            userAnswer: userAns,
            isCorrect,
            source: type === 'RC' ? 'daily_rc' : 'daily_dilr',
            timeTaken: 60
          })
        });
      }

      setResults({
        score: correctCount * 3 - (questions.length - correctCount),
        total: questions.length,
        correctCount
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit daily set', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Loading Today’s Daily {type} Set...</p>
      </div>
    );
  }

  if (errorMsg || !setData) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-card border rounded-2xl text-center space-y-4 shadow-sm">
        <h3 className="font-black text-xl text-foreground">Daily {type} Set</h3>
        <p className="text-sm text-muted-foreground">{errorMsg || 'No set available for today.'}</p>
        <Link href="/dashboard">
          <Button variant="default">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
              DAILY {type === 'RC' ? 'READING COMPREHENSION' : 'DILR CASELET'}
            </Badge>
            <span className="text-xs font-bold text-muted-foreground">CAT {setData.year || 'PYQ'}</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {type === 'RC' ? 'Daily Passage Sprint' : `Daily Caselet: ${setData.subtopic}`}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="font-bold text-xs">
              Exit to Dashboard
            </Button>
          </Link>
          {!submitted && (
            <Button 
              size="sm" 
              onClick={handleSubmitSet} 
              disabled={submitting || Object.keys(answers).length === 0}
              className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Daily Set'}
            </Button>
          )}
        </div>
      </div>

      {/* Completion Banner */}
      {submitted && results && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 shadow-sm animate-in fade-in">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                  Daily {type} Completed! (+50 XP)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You scored <span className="font-bold text-foreground">{results.score} pts</span> • {results.correctCount} of {results.total} correct.
                </p>
              </div>
            </div>

            <Link href="/dashboard">
              <Button className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                Back to Dashboard <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 2-Pane Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Set Passage / Context */}
        <Card className="lg:col-span-6 shadow-sm border-border/80 bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-500" /> 
                {type === 'RC' ? 'Reading Passage Context' : 'Caselet Data & Constraints'}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {questions.length} Questions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 max-h-[650px] overflow-y-auto space-y-4 prose dark:prose-invert max-w-none text-sm leading-relaxed">
            <MarkdownRenderer content={setData.setHtml || 'No passage context text found.'} />
          </CardContent>
        </Card>

        {/* Right Pane: Question Selector & Active Question */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Question Nav Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {questions.map((q: any, idx: number) => {
              const isAns = Boolean(answers[q.question_id]);
              const isCurr = idx === currentIndex;
              return (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-9 rounded-xl font-black text-xs transition-all flex items-center justify-center border shrink-0 ${
                    isCurr
                      ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30'
                      : isAns
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          {currentQ && (
            <Card className="shadow-sm border-border/80 bg-card overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-border/40 bg-muted/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {currentQ.question_type || 'MCQ'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Question Text */}
                <div className="text-sm font-semibold text-foreground leading-relaxed">
                  <MarkdownRenderer content={currentQ.question_html || ''} />
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {['option_a_html', 'option_b_html', 'option_c_html', 'option_d_html', 'option_e_html'].map((optKey, idx) => {
                    const optVal = currentQ[optKey];
                    if (!optVal) return null;
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = answers[currentQ.question_id] === letter;
                    const isCorrectAnswer = (currentQ.answer || '').trim().toUpperCase() === letter;

                    let optStyle = 'border-border/70 hover:border-primary/50 hover:bg-muted/30';
                    if (isSelected) optStyle = 'border-primary bg-primary/5 ring-1 ring-primary';
                    if (submitted) {
                      if (isCorrectAnswer) optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
                      else if (isSelected && !isCorrectAnswer) optStyle = 'border-red-500 bg-red-500/10 text-red-800 dark:text-red-300';
                    }

                    return (
                      <div
                        key={letter}
                        onClick={() => handleSelectAnswer(letter)}
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 cursor-pointer transition-all ${optStyle}`}
                      >
                        <span className={`h-6 w-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border'
                        }`}>
                          {letter}
                        </span>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <MarkdownRenderer content={optVal} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation (After submission) */}
                {submitted && currentQ.explanation_html && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                      Explanation & Solution
                    </span>
                    <MarkdownRenderer content={currentQ.explanation_html} />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="font-bold text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>

                  {currentIndex < questions.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="font-bold text-xs"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : !submitted ? (
                    <Button
                      size="sm"
                      onClick={handleSubmitSet}
                      disabled={submitting}
                      className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Finish & Submit Set
                    </Button>
                  ) : null}
                </div>

                {/* AI Tutor Panel Integration */}
                <div className="pt-2">
                  <AITutorPanel question={currentQ} />
                </div>

              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  );
}
