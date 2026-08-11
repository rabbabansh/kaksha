/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { AITutorPanel } from '@/components/ai-tutor-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BrainCircuit, Trophy, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { XPToast } from '@/components/xp-toast';
import { Badge } from '@/components/ui/badge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

type SessionState = 'loading' | 'primer' | 'question' | 'completed' | 'error';

interface PracticeSessionClientProps {
  subtopic: string;
}

export function PracticeSessionClient({ subtopic }: PracticeSessionClientProps) {
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [primerText, setPrimerText] = useState('');
  const [attemptResults, setAttemptResults] = useState<('correct' | 'incorrect' | null)[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [xpGained, setXpGained] = useState<number>(0);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [timeTakenList, setTimeTakenList] = useState<number[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initSession() {
      try {
        // Fetch Questions
        const qRes = await fetch(`/api/practice/generate?subtopic=${encodeURIComponent(subtopic)}&limit=10`);
        const qData = await qRes.json();

        if (!qData.success || !qData.data || qData.data.length === 0) {
          setErrorMsg('No unattempted questions found for this topic. Try another module or jump into Review mode!');
          setState('error');
          return;
        }
        setQuestions(qData.data);

        // Fetch Primer
        const pRes = await fetch(`/api/practice/primer?subtopic=${encodeURIComponent(subtopic)}`);
        const pData = await pRes.json();
        if (pData.success && pData.data) {
          setPrimerText(pData.data);
          setState('primer');
        } else {
          // Fallback if primer fails
          setPrimerText('Get ready to master this topic!');
          setState('primer');
        }

      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to initialize session. Please check your connection.');
        setState('error');
      }
    }
    initSession();
  }, [subtopic]);

  useEffect(() => {
    if (state === 'completed') {
      async function completeSession() {
        try {
          const res = await fetch('/api/progress/session/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtopics: [subtopic] })
          });
          const json = await res.json();
          if (json.success) {
            setXpGained(json.xpGained || 0);
            setNewBadges(json.newBadges || []);
          }
        } catch (e) {
          console.error('Error completing session:', e);
        }
      }
      completeSession();
    }
  }, [state, subtopic]);

  const handleStartQuestions = () => {
    setState('question');
    setQuestionStartTime(Date.now());
  };

  const submitAnswer = async (answer: string) => {
    if (isSubmitting || selectedAnswer !== null) return;
    setIsSubmitting(true);
    setSelectedAnswer(answer);

    const question = questions[currentIndex];
    const correct = answer === question.answer;
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);

    setIsCorrect(correct);
    setCorrectAnswer(question.answer);
    if (correct) setScore(s => s + 1);

    setTimeTakenList(prev => {
      const newList = [...prev];
      newList[currentIndex] = timeTaken;
      return newList;
    });

    setAttemptResults(prev => {
      const newResults = [...prev];
      newResults[currentIndex] = correct ? 'correct' : 'incorrect';
      return newResults;
    });

    try {
      await fetch('/api/progress/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.question_id,
          userAnswer: answer,
          source: 'practice',
          timeTaken
        }),
      });
    } catch (e) {
      console.error(e);
    }

    // Scroll up mechanic: gently scroll the left pane down so the solution is perfectly in view
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const moveToNextQuestion = () => {
    setIsSubmitting(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCorrectAnswer(null);

    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });

    if (currentIndex + 1 >= questions.length) {
      setState('completed');
    } else {
      setCurrentIndex(curr => curr + 1);
      setQuestionStartTime(Date.now());
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Generating Your Module...</h2>
        <p className="text-muted-foreground text-sm mt-2">Assembling questions & writing primer.</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-muted-foreground">{errorMsg}</p>
        <Button className="mt-6" onClick={() => window.location.href = '/practice/modules'}>Go Back</Button>
      </div>
    );
  }

  if (state === 'completed') {
    const correctCount = attemptResults.filter(r => r === 'correct').length;
    const clientXpGained = (correctCount * 10) + ((attemptResults.length - correctCount) * 2);
    const displayXp = xpGained > 0 ? xpGained : clientXpGained;

    return (
      <div className="min-h-[60vh] px-4 py-8 max-w-2xl mx-auto space-y-6">
        {/* XP Toast Animation */}
        <XPToast xpGained={displayXp} newBadges={newBadges} />

        <div className="relative">
          <div className="text-center space-y-2 pb-6">
            <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mb-4 shadow-lg animate-in zoom-in duration-500">
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Kaksha Complete! 🎉</h2>
            <p className="text-muted-foreground font-medium">You scored {score} out of {questions.length}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Correct</p>
              <p className="text-3xl font-black text-green-600 mt-1">{correctCount}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Wrong</p>
              <p className="text-3xl font-black text-red-500 mt-1">{questions.length - correctCount}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">XP Earned</p>
              <p className="text-3xl font-black text-yellow-500 mt-1">+{displayXp}</p>
            </div>
          </div>

          {/* Unlocked Badges */}
          {newBadges.length > 0 && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-6">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">🏅 Badges Earned!</p>
              <div className="flex flex-wrap gap-2">
                {newBadges.map((badge) => (
                  <Badge key={badge} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Per-question results */}
          <div className="bg-muted/30 rounded-2xl p-5 mb-6 border border-border/60">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Per Question Breakdown</p>
            <div className="flex flex-wrap gap-2.5">
              {questions.map((q, idx) => (
                <div
                  key={q.question_id}
                  className={`h-14 w-14 rounded-xl border flex flex-col items-center justify-center font-bold text-sm relative transition-all ${
                    attemptResults[idx] === 'correct'
                      ? 'bg-green-100 dark:bg-green-950/20 border-green-300 text-green-700'
                      : attemptResults[idx] === 'incorrect'
                      ? 'bg-red-100 dark:bg-red-950/20 border-red-300 text-red-700'
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                  title={`Q${idx + 1}: ${q.subtopic || q.topic}`}
                >
                  <span className="text-xs font-bold">Q{idx + 1}</span>
                  <span className="text-[9px] text-muted-foreground font-normal mt-1 flex items-center gap-0.5">
                    <Clock className="h-2 w-2" /> {timeTakenList[idx] || 0}s
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => window.location.href = '/dashboard'} className="w-full h-12 font-bold" size="lg">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'primer') {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 pb-8">
            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Module Primer: {subtopic}</CardTitle>
            </div>
            <CardDescription>Read this carefully before attempting the sprint.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={primerText} />
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 flex justify-end">
            <Button size="lg" onClick={handleStartQuestions} className="w-full sm:w-auto">
              Start Practice <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isSet = currentQ.set_id && currentQ.set_id !== 'N/A';

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">

      {/* Top Header - Unified CBT Style for Practice */}
      <header className="bg-zinc-900 text-white px-6 py-2 flex items-center justify-between border-b-4 border-primary">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xl shadow-sm">
            📕
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-zinc-300">
              Kaksha Practice Mode
            </h1>
            <p className="text-xs text-zinc-400">{subtopic}</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-zinc-300">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Left Side: Question Display */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 relative scroll-smooth pb-32">

          <Card className="border border-border/80 shadow-sm rounded-none sm:rounded-xl">
            <CardContent className="p-6">
              {isSet && currentQ.set_html && (
                <div className="mb-6 pb-6 border-b border-border prose dark:prose-invert max-w-none notranslate" translate="no" dangerouslySetInnerHTML={{ __html: currentQ.set_html }} />
              )}

              <div className="space-y-6">
                {/* Question Text */}
                <div className="prose dark:prose-invert max-w-none text-base notranslate" translate="no" dangerouslySetInnerHTML={{ __html: currentQ.question_html }} />

                {/* Options */}
                {currentQ.question_type === 'MCQ' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const optHtml = currentQ[`option_${opt.toLowerCase()}_html`];
                      if (!optHtml) return null;

                      let btnVariant: "outline" | "default" | "destructive" = "outline";
                      let btnClass = "h-auto p-4 justify-start text-left items-start w-full border-2 transition-all notranslate";

                      if (selectedAnswer) {
                        if (opt === correctAnswer) {
                          btnClass += " border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/20";
                        } else if (opt === selectedAnswer && opt !== correctAnswer) {
                          btnVariant = "destructive";
                          btnClass += " ring-2 ring-red-500/20";
                        } else {
                          btnClass += " opacity-50";
                        }
                      } else {
                        btnClass += " hover:bg-muted/40 hover:border-primary/50";
                      }

                      return (
                        <Button
                          key={opt}
                          variant={btnVariant}
                          className={btnClass}
                          translate="no"
                          onClick={() => submitAnswer(opt)}
                          disabled={isSubmitting || selectedAnswer !== null}
                        >
                          <span className="font-bold mr-3">({opt})</span>
                          <span className="flex-1 whitespace-normal">
                            <MarkdownRenderer content={optHtml} />
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="max-w-sm">
                    <p className="text-sm font-medium mb-2 text-muted-foreground uppercase">Type in the answer (TITA):</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="e.g. 42"
                        id="tita-input"
                        disabled={isSubmitting || selectedAnswer !== null}
                      />
                      <Button
                        className="h-12"
                        disabled={isSubmitting || selectedAnswer !== null}
                        onClick={() => {
                          const val = (document.getElementById('tita-input') as HTMLInputElement).value;
                          if (val) submitAnswer(val);
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Solution Pane - Slides in below */}
          {selectedAnswer !== null && (
            <div className="mt-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
              <div className={`p-6 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'} shadow-sm`}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                  <div className={`flex items-center ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isCorrect ? (
                      <><CheckCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">Spot On!</span></>
                    ) : (
                      <><XCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">Incorrect. Answer is Option {correctAnswer}.</span></>
                    )}
                  </div>
                </div>

                {/* Static Explanation (if provided) */}
                {currentQ.explanation_html && currentQ.explanation_html.trim() !== '' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 mt-6">
                      <BookOpen className="h-4 w-4" /> Provided Solution
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm notranslate bg-background/60 p-6 rounded-lg border border-black/5 dark:border-white/5" translate="no">
                      <div dangerouslySetInnerHTML={{ __html: currentQ.explanation_html }} />
                    </div>
                  </div>
                )}

                {/* AI Tutor Panel */}
                <AITutorPanel question={currentQ} userAnswer={selectedAnswer} mode="feedback" />

              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar Navigation (CBT Style) - Hidden on Mobile */}
        <aside className="hidden md:flex w-80 border-l border-border/80 bg-muted/10 p-6 flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                <h4 className="text-sm font-bold text-foreground mb-4">Module Progress</h4>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    let stateClass = "bg-muted text-muted-foreground border-transparent"; // Unattempted
                    
                    if (attemptResults[idx] === 'correct') {
                      stateClass = idx === currentIndex 
                        ? "bg-green-600 text-white border-green-700 dark:bg-green-600 dark:border-green-700 shadow-[0_0_10px_rgba(22,163,74,0.4)]" 
                        : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300";
                    } else if (attemptResults[idx] === 'incorrect') {
                      stateClass = idx === currentIndex 
                        ? "bg-red-600 text-white border-red-700 dark:bg-red-600 dark:border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.4)]" 
                        : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300";
                    } else if (idx === currentIndex) {
                      stateClass = "bg-primary text-primary-foreground border-primary";
                    }

                    return (
                      <div key={idx} className={`h-10 rounded-md border flex items-center justify-center text-xs font-bold ${stateClass}`}>
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-6">
            <Button
              size="lg"
              className="w-full font-bold text-base h-14 shadow-md"
              onClick={moveToNextQuestion}
              disabled={selectedAnswer === null}
            >
              {currentIndex + 1 >= questions.length ? 'Finish Module' : 'Next Question'} &rarr;
            </Button>
          </div>
        </aside>

      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden border-t bg-background p-4 pb-safe flex flex-col gap-3 shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex overflow-x-auto gap-2 pb-1 snap-x no-scrollbar">
          {questions.map((q, idx) => {
            let stateClass = "bg-muted text-muted-foreground border-transparent";
            
            if (attemptResults[idx] === 'correct') {
              stateClass = idx === currentIndex 
                ? "bg-green-600 text-white border-green-700 shadow-sm" 
                : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300";
            } else if (attemptResults[idx] === 'incorrect') {
              stateClass = idx === currentIndex 
                ? "bg-red-600 text-white border-red-700 shadow-sm" 
                : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300";
            } else if (idx === currentIndex) {
              stateClass = "bg-primary text-primary-foreground border-primary";
            }

            return (
              <div 
                key={idx} 
                className={`h-8 w-8 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold snap-center ${stateClass}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
        <Button
          size="lg"
          className="w-full font-bold text-base h-12 shadow-md rounded-xl"
          onClick={moveToNextQuestion}
          disabled={selectedAnswer === null}
        >
          {currentIndex + 1 >= questions.length ? 'Finish Module' : 'Next Question'} &rarr;
        </Button>
      </div>
    </div>
  );
}
