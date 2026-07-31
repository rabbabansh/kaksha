/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

type SessionState = 'loading' | 'question' | 'completed' | 'error';

export function MixedSessionClient({ topic }: { topic?: string }) {
  const [state, setState] = useState<SessionState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [score, setScore] = useState(0);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
 
  useEffect(() => {
    async function initSession() {
      try {
        const url = topic 
          ? `/api/practice/mixed?topic=${encodeURIComponent(topic)}`
          : '/api/practice/mixed';
        const qRes = await fetch(url);
        const qData = await qRes.json();
        
        if (!qData.success || !qData.data || qData.data.length === 0) {
          setErrorMsg(topic ? `No questions found for the topic: ${topic}.` : 'No unattempted questions found for your weaknesses. Try a specific module!');
          setState('error');
          return;
        }
        setQuestions(qData.data);
        setState('question');
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to initialize session. Please check your connection.');
        setState('error');
      }
    }
    initSession();
  }, [topic]);

  const submitAnswer = async (answer: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedAnswer(answer);

    const question = questions[currentIndex];
    const correct = answer === question.answer;
    
    setIsCorrect(correct);
    setCorrectAnswer(question.answer);
    if (correct) setScore(s => s + 1);

    // Fire backend call asynchronously without awaiting
    fetch('/api/progress/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: question.question_id,
        userAnswer: answer,
        source: 'practice'
      }),
    }).catch(console.error);
    
    // We keep isSubmitting true so they can't click again, until they hit Next
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
    }
  };
  
  const askTutor = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    const question = questions[currentIndex];
    try {
      const res = await fetch('/api/practice/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question)
      });
      const data = await res.json();
      if (data.success) setExplanation(data.data);
      else setExplanation('Failed to get explanation.');
    } catch (err) {
      setExplanation('An error occurred while fetching the explanation.');
    }
    setIsExplaining(false);
  };
  
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Generating Rapid-Fire Module...</h2>
        <p className="text-muted-foreground text-sm mt-2">Targeting your top 5 weaknesses.</p>
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
        <h2 className="text-3xl font-bold mb-2">Sprint Complete!</h2>
        <p className="text-muted-foreground mb-8">You scored {score} out of {questions.length}.</p>
        <Button onClick={() => window.location.href='/dashboard'}>View Dashboard</Button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground font-medium">
        <span>Mixed Module: <span className="text-primary">{topic || currentQ.subtopic}</span></span>
        <span>Question {currentIndex + 1} of {questions.length}</span>
      </div>

      <Card className="shadow-md mb-6 relative overflow-hidden">
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
      
      {/* Rapid Fire Feedback Overlay */}
      {selectedAnswer !== null && (
        <div className={`mt-6 p-6 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className={`flex items-center ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isCorrect ? (
                 <><CheckCircle className="h-6 w-6 mr-2 shrink-0" /> <span className="font-semibold text-lg">Correct!</span></>
              ) : (
                 <><XCircle className="h-6 w-6 mr-2 shrink-0" /> <span className="font-semibold text-lg">Incorrect. The answer is Option {correctAnswer}.</span></>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={askTutor} disabled={isExplaining} className="text-xs font-semibold">
                {isExplaining ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Ask AI Tutor
              </Button>
              <Button size="sm" onClick={moveToNextQuestion} className="text-xs font-semibold">Next Question &rarr;</Button>
            </div>
          </div>

          {/* Preloaded Textbook explanation (Instant) */}
          {currentQ.explanation_html && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preloaded Textbook Explanation</h4>
              <div className="prose dark:prose-invert max-w-none text-sm notranslate" translate="no" dangerouslySetInnerHTML={{ __html: currentQ.explanation_html }} />
            </div>
          )}
          
          {explanation && (
            <div className="mt-4 p-4 bg-background rounded-xl border border-primary/10 bg-primary/5 space-y-2">
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
        </div>
      )}
    </div>
  );
}
