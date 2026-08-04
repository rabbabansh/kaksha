/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { AITutorPanel } from '@/components/ai-tutor-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BrainCircuit, Trophy, BookOpen, ArrowRight } from 'lucide-react';

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

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

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
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Trophy className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold mb-2">Kaksha Complete!</h2>
        <p className="text-muted-foreground mb-8">You scored {score} out of {questions.length}. XP updated!</p>
        <Button onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</Button>
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
            K
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

        {/* Right Side: Sidebar Navigation (CBT Style) */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/80 bg-muted/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                <h4 className="text-sm font-bold text-foreground mb-4">Module Progress</h4>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    let stateClass = "bg-muted text-muted-foreground border-transparent"; // Unattempted
                    if (idx === currentIndex) stateClass = "bg-primary text-primary-foreground border-primary";
                    else if (idx < currentIndex) stateClass = "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";

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
    </div>
  );
}
