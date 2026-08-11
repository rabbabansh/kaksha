/* eslint-disable */
'use client';

import React, { useEffect, useRef, useReducer, memo } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, CheckCircle, XCircle, Loader2, PlayCircle, Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { AITutorPanel } from '@/components/ai-tutor-panel';
import { ReportDialog } from '@/components/report-dialog';
import { PracticeReport } from './practice-report';
import { QuestionDisplay } from './question-display';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

type SessionState = 'loading' | 'question' | 'completed' | 'error';

type State = {
  status: SessionState;
  errorMsg: string;
  questions: Question[];
  currentIndex: number;
  startTime: number;
  selectedAnswer: string | null;
  isSubmitting: boolean;
  isCorrect: boolean | null;
  correctAnswer: string | null;
  sessionAttempts: any[];
  score: number;
  reviewIndex: number | null;
};

type Action = 
  | { type: 'INIT_SUCCESS'; payload: Question[] }
  | { type: 'INIT_ERROR'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: string; isCorrect: boolean | null; correctAnswer: string; timeTaken: number; question: Question } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'SET_REVIEW_INDEX'; payload: number | null };

const initialState: State = {
  status: 'loading',
  errorMsg: '',
  questions: [],
  currentIndex: 0,
  startTime: Date.now(),
  selectedAnswer: null,
  isSubmitting: false,
  isCorrect: null,
  correctAnswer: null,
  sessionAttempts: [],
  score: 0,
  reviewIndex: null
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_SUCCESS':
      return { ...state, status: 'question', questions: action.payload, startTime: Date.now() };
    case 'INIT_ERROR':
      return { ...state, status: 'error', errorMsg: action.payload };
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        isSubmitting: true, // we can keep true to block rapid clicks, or false if it's instant
        selectedAnswer: action.payload.answer,
        isCorrect: action.payload.isCorrect,
        correctAnswer: action.payload.correctAnswer,
        score: action.payload.isCorrect ? state.score + 1 : state.score,
        sessionAttempts: [...state.sessionAttempts, {
          question: action.payload.question,
          userAnswer: action.payload.answer,
          isCorrect: action.payload.isCorrect,
          timeTaken: action.payload.timeTaken
        }]
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        isSubmitting: false,
        selectedAnswer: null,
        isCorrect: null,
        correctAnswer: null,
        currentIndex: state.currentIndex + 1,
        startTime: Date.now()
      };
    case 'FINISH_SESSION':
      return { ...state, status: 'completed' };
    case 'SET_REVIEW_INDEX':
      return { ...state, reviewIndex: action.payload };
    default:
      return state;
  }
}

// Memoized Question Text and Options to prevent re-renders of heavy math blocks
const MemoizedQuestionBody = memo(({ question, selectedAnswer, correctAnswer, isSubmitting, submitAnswer }: any) => {
  return (
    <div className="space-y-6">
      <div className="prose dark:prose-invert max-w-none text-base notranslate" translate="no" dangerouslySetInnerHTML={{ __html: question.question_html }} />
      {question.question_type === 'MCQ' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['A', 'B', 'C', 'D', 'E'].map((opt) => {
            const optHtml = question[`option_${opt.toLowerCase()}_html`];
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
                if(val) submitAnswer(val);
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
MemoizedQuestionBody.displayName = 'MemoizedQuestionBody';

export function MixedSessionClient({ topic }: { topic?: string }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [xpGained, setXpGained] = React.useState<number>(0);
  const [newBadges, setNewBadges] = React.useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initSession() {
      try {
        const url = topic 
          ? `/api/practice/mixed?topic=${encodeURIComponent(topic)}`
          : '/api/practice/mixed';
        const qRes = await fetch(url);
        const qData = await qRes.json();
        
        if (!qData.success || !qData.data || qData.data.length === 0) {
          dispatch({ type: 'INIT_ERROR', payload: topic ? `No questions found for the topic: ${topic}.` : 'No unattempted questions found. Try a specific module!' });
          return;
        }
        dispatch({ type: 'INIT_SUCCESS', payload: qData.data });
      } catch (err) {
        dispatch({ type: 'INIT_ERROR', payload: 'Failed to initialize session. Please check your connection.' });
      }
    }
    initSession();
  }, [topic]);

  const submitAnswer = async (answer: string) => {
    if (state.isSubmitting || state.selectedAnswer !== null) return;
    
    const question = state.questions[state.currentIndex];
    const actualAnswer = question.answer ? String(question.answer).trim() : 'NA';
    const correct = actualAnswer !== 'NA' && actualAnswer !== '' ? String(answer).trim() === actualAnswer : null;
    const timeTaken = Math.floor((Date.now() - state.startTime) / 1000);
    
    dispatch({
      type: 'SUBMIT_ANSWER',
      payload: { answer, isCorrect: correct, correctAnswer: actualAnswer, timeTaken, question }
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

    setTimeout(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const moveToNextQuestion = async () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });

    if (state.currentIndex + 1 >= state.questions.length) {
      // Calculate touched subtopics and call session/complete for batch scoring
      const touchedSubtopics = Array.from(new Set(state.sessionAttempts.map(a => a.question.subtopic).filter(Boolean)));
      
      try {
        const res = await fetch('/api/progress/session/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtopics: touchedSubtopics })
        });
        const json = await res.json();
        if (json.success) {
          setXpGained(json.xpGained || 0);
          setNewBadges(json.newBadges || []);
        }
      } catch (err) {
        console.error(err);
      }

      dispatch({ type: 'FINISH_SESSION' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };
  
  if (state.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Loading Module...</h2>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-muted-foreground">{state.errorMsg}</p>
        <Button className="mt-6" onClick={() => window.location.href='/practice/modules'}>Go Back</Button>
      </div>
    );
  }

  if (state.status === 'completed') {
    if (state.reviewIndex !== null) {
      const q = state.questions[state.reviewIndex];
      const attempt = state.sessionAttempts.find(a => a.question.question_id === q.question_id);
      return (
        <div className="h-screen bg-background flex flex-col font-sans">
          <header className="bg-zinc-900 text-white px-6 py-3 flex items-center justify-between border-b-4 border-primary shrink-0">
            <h1 className="font-bold">Reviewing Question {state.reviewIndex + 1}</h1>
            <Button size="sm" variant="outline" className="text-black" onClick={() => dispatch({ type: 'SET_REVIEW_INDEX', payload: null })}>
              Back to Report
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
             <div className="max-w-4xl mx-auto">
               <QuestionDisplay 
                 question={q} 
                 allQuestionsInContext={[q]} 
                 isTestMode={true} 
                 testFinished={true}
                 testAnswers={attempt ? { [q.question_id]: attempt.userAnswer } : {}}
               />
             </div>
          </div>
        </div>
      );
    }

    return (
      <PracticeReport 
        topic={topic}
        questions={state.questions}
        sessionAttempts={state.sessionAttempts}
        onReviewQuestion={(idx) => dispatch({ type: 'SET_REVIEW_INDEX', payload: idx })}
        xpGained={xpGained}
        newBadges={newBadges}
      />
    );
  }

  const currentQ = state.questions[state.currentIndex];
  const isSet = currentQ?.set_id && currentQ.set_id !== 'N/A';
  
  if (!currentQ) return null;

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      <header className="bg-zinc-900 text-white px-6 py-2 flex items-center justify-between border-b-4 border-primary">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xl shadow-sm">
            📕
          </div>
          <div>
            <div className="flex items-center gap-2">
               <span className="text-sm font-bold tracking-tight uppercase text-zinc-300">
                  Kaksha Practice Mode
               </span>
               <ReportDialog questionId={currentQ.question_id} />
            </div>
            <p className="text-xs text-zinc-400">{topic || currentQ.topic}</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-zinc-300">
           Question {state.currentIndex + 1} of {state.questions.length}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 relative scroll-smooth pb-32">
          
          <Card className="border border-border/80 shadow-sm rounded-none sm:rounded-xl">
             <CardContent className="p-6">
               {isSet && currentQ.set_html && (
                  <div className="mb-6 pb-6 border-b border-border prose dark:prose-invert max-w-none notranslate" translate="no" dangerouslySetInnerHTML={{ __html: currentQ.set_html }} />
               )}
               
               <MemoizedQuestionBody 
                 question={currentQ}
                 selectedAnswer={state.selectedAnswer}
                 correctAnswer={state.correctAnswer}
                 isSubmitting={state.isSubmitting}
                 submitAnswer={submitAnswer}
               />
             </CardContent>
          </Card>

          {state.selectedAnswer !== null && (
            <div className="mt-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
               <div className={`p-6 rounded-xl border-2 ${state.isCorrect === true ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : state.isCorrect === false ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                     <div className={`flex items-center ${state.isCorrect === true ? 'text-green-700 dark:text-green-400' : state.isCorrect === false ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                        {state.isCorrect === true ? (
                           <><CheckCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">Spot On!</span></>
                        ) : state.isCorrect === false ? (
                           <><XCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">Incorrect. Answer is Option {state.correctAnswer}.</span></>
                        ) : (
                           <><PlayCircle className="h-7 w-7 mr-2 text-yellow-600" /> <span className="font-extrabold text-xl tracking-tight">Answer Not Available.</span></>
                        )}
                  </div>
               </div>

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

               <AITutorPanel question={currentQ} userAnswer={state.selectedAnswer} mode="explain" />

               </div>
            </div>
          )}
        </div>

        <aside className="hidden md:flex w-80 border-l border-border/80 bg-muted/10 p-6 flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                 <h4 className="text-sm font-bold text-foreground mb-4">Module Progress</h4>
                 <div className="grid grid-cols-5 gap-2">
                    {state.questions.map((q, idx) => {
                       let stateClass = "bg-muted text-muted-foreground border-transparent";
                       
                       let isCorrect: boolean | null = null;
                       if (idx < state.sessionAttempts.length) {
                          isCorrect = state.sessionAttempts[idx].isCorrect;
                       } else if (idx === state.currentIndex && state.selectedAnswer !== null) {
                          isCorrect = state.isCorrect;
                       }

                       if (isCorrect === true) {
                         stateClass = idx === state.currentIndex 
                           ? "bg-green-600 text-white border-green-700 dark:bg-green-600 dark:border-green-700 shadow-[0_0_10px_rgba(22,163,74,0.4)]" 
                           : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300";
                       } else if (isCorrect === false) {
                         stateClass = idx === state.currentIndex 
                           ? "bg-red-600 text-white border-red-700 dark:bg-red-600 dark:border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.4)]" 
                           : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300";
                       } else if (idx === state.currentIndex) {
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
               disabled={state.selectedAnswer === null}
             >
                {state.currentIndex + 1 >= state.questions.length ? 'Finish Module' : 'Next Question'} &rarr;
             </Button>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden border-t bg-background p-4 pb-safe flex flex-col gap-3 shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex overflow-x-auto gap-2 pb-1 snap-x no-scrollbar">
          {state.questions.map((q, idx) => {
            let stateClass = "bg-muted text-muted-foreground border-transparent";
            
            let isCorrect: boolean | null = null;
            if (idx < state.sessionAttempts.length) {
              isCorrect = state.sessionAttempts[idx].isCorrect;
            } else if (idx === state.currentIndex && state.selectedAnswer !== null) {
              isCorrect = state.isCorrect;
            }

            if (isCorrect === true) {
              stateClass = idx === state.currentIndex 
                ? "bg-green-600 text-white border-green-700 shadow-sm" 
                : "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300";
            } else if (isCorrect === false) {
              stateClass = idx === state.currentIndex 
                ? "bg-red-600 text-white border-red-700 shadow-sm" 
                : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300";
            } else if (idx === state.currentIndex) {
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
          disabled={state.selectedAnswer === null}
        >
          {state.currentIndex + 1 >= state.questions.length ? 'Finish Module' : 'Next Question'} &rarr;
        </Button>
      </div>
    </div>
  );
}
