'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, CheckCircle, XCircle, BrainCircuit, RefreshCw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

type SessionState = 'loading' | 'primer' | 'question' | 'feedback' | 'completed' | 'error';

interface PracticeSessionClientProps {
  subtopic: string;
}

export function PracticeSessionClient({ subtopic }: PracticeSessionClientProps) {
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [primerText, setPrimerText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
  };

  const submitAnswer = async (answer: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedAnswer(answer);

    const question = questions[currentIndex];
    const correct = answer === question.answer;
    
    setIsCorrect(correct);
    setCorrectAnswer(question.answer);

    // Fire backend progress tracking asynchronously
    fetch('/api/progress/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: question.question_id,
        userAnswer: answer,
        source: 'practice'
      }),
    }).catch(console.error);
  };

  const askTutor = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    const question = questions[currentIndex];
    try {
      const res = await fetch('/api/practice/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopic,
          question_html: question.question_html,
          option_a_html: question.option_a_html,
          option_b_html: question.option_b_html,
          option_c_html: question.option_c_html,
          option_d_html: question.option_d_html,
          answer: question.answer,
          userAnswer: selectedAnswer
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExplanation(data.data);
      } else {
        setExplanation('Failed to get AI Tutor explanation.');
      }
    } catch (err) {
      setExplanation('An error occurred while fetching the AI Tutor explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  const moveToNextQuestion = () => {
    setIsSubmitting(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setCorrectAnswer(null);
    setExplanation(null);
    setIsExplaining(false);
    
    if (currentIndex + 1 >= questions.length) {
      setState('completed');
    } else {
      setCurrentIndex(curr => curr + 1);
      setState('question');
    }
  };

  // ---------------- Render Helpers ----------------
  
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
        <Button className="mt-6" onClick={() => window.location.href='/practice/modules'}>Go Back</Button>
      </div>
    );
  }

  if (state === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-3xl font-bold mb-2">Module Complete!</h2>
        <p className="text-muted-foreground mt-2">You have completely finished this practice session. You cannot re-answer questions.</p>
        <Button onClick={() => window.location.href='/dashboard'}>View Dashboard</Button>
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
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {primerText}
            </ReactMarkdown>
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

  // State is 'question' or 'feedback'
  const currentQ = questions[currentIndex];
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground font-medium">
        <span>{subtopic} Module</span>
        <span>Question {currentIndex + 1} of {questions.length}</span>
      </div>

      <Card className="shadow-md mb-6 relative overflow-hidden">
        {/* Progress bar top */}
        <div 
          className="absolute top-0 left-0 h-1 bg-primary transition-all duration-500" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
        
        <CardContent className="pt-8">
          <div className="prose dark:prose-invert max-w-none mb-8">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
              {currentQ.question_html}
            </ReactMarkdown>
          </div>

          {currentQ.question_type === 'MCQ' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optHtml = currentQ[`option_${opt.toLowerCase()}_html`];
                if (!optHtml) return null;
                
                let btnVariant: "outline" | "default" | "destructive" = "outline";
                let btnClass = "h-auto p-4 justify-start text-left items-start w-full border-2";
                
                if (selectedAnswer) {
                  if (opt === correctAnswer) {
                    btnClass += " border-green-500 bg-green-50 dark:bg-green-950/30";
                  } else if (opt === selectedAnswer && opt !== correctAnswer) {
                    btnVariant = "destructive";
                  } else {
                    btnClass += " opacity-50";
                  }
                }

                return (
                  <Button
                    key={opt}
                    variant={btnVariant}
                    className={btnClass}
                    onClick={() => submitAnswer(opt)}
                    disabled={isSubmitting || selectedAnswer !== null}
                  >
                    <span className="font-bold mr-3">{opt}.</span>
                    <span className="flex-1 whitespace-pre-wrap">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                        {optHtml}
                      </ReactMarkdown>
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="max-w-sm">
              <p className="text-sm font-medium mb-2 text-muted-foreground">Type your numeric answer:</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. 42"
                  id="tita-input"
                  disabled={isSubmitting || selectedAnswer !== null}
                />
                <Button 
                  disabled={isSubmitting || selectedAnswer !== null}
                  onClick={() => {
                    const val = (document.getElementById('tita-input') as HTMLInputElement).value;
                    if(val) submitAnswer(val);
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Practice Module Feedback Box */}
      {selectedAnswer !== null && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className={`border-2 ${isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'}`}>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                )}
                <CardTitle className={`text-lg font-bold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {isCorrect ? 'Correct! Excellent job.' : `Incorrect. The correct answer is Option ${correctAnswer}.`}
                </CardTitle>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={askTutor} 
                  disabled={isExplaining}
                  className="border-primary/20 hover:bg-primary/5 text-xs font-semibold"
                >
                  {isExplaining && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                  Ask AI Tutor
                </Button>
                <Button size="sm" onClick={moveToNextQuestion} className="text-xs font-semibold">
                  Next Question <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {/* Textbook solution displayed instantly */}
              {currentQ.explanation_html && (
                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preloaded Textbook Explanation</h4>
                  <div className="prose dark:prose-invert max-w-none text-sm notranslate" translate="no" dangerouslySetInnerHTML={{ __html: currentQ.explanation_html }} />
                </div>
              )}

              {/* AI Tutor solution displayed optionally */}
              {explanation && (
                <div className="space-y-2 border-t pt-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" /> AI Tutor Guidance
                  </h4>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                      {explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
