/* eslint-disable */
'use client';

import React, { useEffect, useRef, useReducer, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BrainCircuit, PlayCircle, Trophy, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
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
  explanation: string | null;
  isExplaining: boolean;
  chatHistory: {role: string, text: string}[];
  followUpQuery: string;
  isChatting: boolean;
};

type Action = 
  | { type: 'INIT_SUCCESS'; payload: Question[] }
  | { type: 'INIT_ERROR'; payload: string }
  | { type: 'SUBMIT_ANSWER'; payload: { answer: string; isCorrect: boolean | null; correctAnswer: string; timeTaken: number; question: Question } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'SET_REVIEW_INDEX'; payload: number | null }
  | { type: 'TUTOR_REQUEST'; isFollowUp: boolean; query?: string }
  | { type: 'TUTOR_SUCCESS'; isFollowUp: boolean; data: string }
  | { type: 'TUTOR_ERROR'; isFollowUp: boolean }
  | { type: 'SET_FOLLOWUP_QUERY'; payload: string };

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
  reviewIndex: null,
  explanation: null,
  isExplaining: false,
  chatHistory: [],
  followUpQuery: '',
  isChatting: false
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
        explanation: null,
        isExplaining: false,
        chatHistory: [],
        followUpQuery: '',
        currentIndex: state.currentIndex + 1,
        startTime: Date.now()
      };
    case 'FINISH_SESSION':
      return { ...state, status: 'completed' };
    case 'SET_REVIEW_INDEX':
      return { ...state, reviewIndex: action.payload };
    case 'TUTOR_REQUEST':
      return {
        ...state,
        isExplaining: !action.isFollowUp,
        isChatting: action.isFollowUp,
        chatHistory: action.isFollowUp && action.query 
          ? [...state.chatHistory, { role: 'user', text: action.query }]
          : state.chatHistory
      };
    case 'TUTOR_SUCCESS':
      return {
        ...state,
        isExplaining: false,
        isChatting: false,
        explanation: !action.isFollowUp ? action.data : state.explanation,
        chatHistory: action.isFollowUp 
          ? [...state.chatHistory, { role: 'tutor', text: action.data }]
          : state.chatHistory,
        followUpQuery: action.isFollowUp ? '' : state.followUpQuery
      };
    case 'TUTOR_ERROR':
      return {
        ...state,
        isExplaining: false,
        isChatting: false,
        explanation: !action.isFollowUp ? 'Failed to get explanation.' : state.explanation,
        chatHistory: action.isFollowUp 
          ? [...state.chatHistory, { role: 'error', text: 'Error.' }]
          : state.chatHistory
      };
    case 'SET_FOLLOWUP_QUERY':
      return { ...state, followUpQuery: action.payload };
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

    fetch('/api/progress/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: question.question_id,
        userAnswer: answer,
        source: 'practice',
        timeTaken
      }),
    }).catch(console.error);

    setTimeout(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const moveToNextQuestion = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });

    if (state.currentIndex + 1 >= state.questions.length) {
      // Calculate touched subtopics and call session/complete for batch scoring
      const touchedSubtopics = Array.from(new Set(state.sessionAttempts.map(a => a.question.subtopic).filter(Boolean)));
      
      fetch('/api/progress/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopics: touchedSubtopics })
      }).catch(console.error);

      dispatch({ type: 'FINISH_SESSION' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };
  
  const askTutor = async (query?: string) => {
    if (state.isExplaining || state.isChatting) return;
    const isFollowUp = !!query;
    
    dispatch({ type: 'TUTOR_REQUEST', isFollowUp, query });

    const question = state.questions[state.currentIndex];

    try {
      const payload = {
        ...question,
        userQuery: isFollowUp ? query : undefined,
      };

      const res = await fetch('/api/practice/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        dispatch({ type: 'TUTOR_SUCCESS', isFollowUp, data: data.data });
      } else {
        dispatch({ type: 'TUTOR_ERROR', isFollowUp });
      }
    } catch (err) {
      dispatch({ type: 'TUTOR_ERROR', isFollowUp });
    }
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
            K
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
                     <div className="flex gap-3">
                        {!state.explanation && (
                           <Button size="sm" onClick={() => askTutor()} disabled={state.isExplaining} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                              {state.isExplaining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
                              Ask AI Tutor
                           </Button>
                        )}
                     </div>
                  </div>

                  {(currentQ.explanation_html || state.explanation) && (
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                           <BookOpen className="h-4 w-4" /> Solution Breakdown
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm notranslate bg-background/60 p-6 rounded-lg border border-black/5 dark:border-white/5" translate="no">
                           {state.explanation && !currentQ.explanation_html ? (
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                                 {state.explanation}
                              </ReactMarkdown>
                           ) : (
                              <div dangerouslySetInnerHTML={{ __html: currentQ.explanation_html }} />
                           )}
                        </div>

                        <div className="mt-6 border border-indigo-200 dark:border-indigo-900 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/10 overflow-hidden">
                           <div className="bg-indigo-100/50 dark:bg-indigo-900/50 px-4 py-2 flex items-center gap-2">
                              <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">AI Tutor Follow-up</span>
                           </div>
                           
                           <div className="p-4 space-y-4">
                              {state.chatHistory.length > 0 && (
                                 <div className="space-y-4 mb-4">
                                    {state.chatHistory.map((msg, i) => (
                                       <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`p-3 rounded-xl max-w-[85%] text-sm ${
                                             msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                                : msg.role === 'error'
                                                ? 'bg-destructive/10 text-destructive'
                                                : 'bg-background border shadow-sm rounded-bl-none'
                                          }`}>
                                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                                                {msg.text}
                                             </ReactMarkdown>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                              
                              <div className="flex gap-2">
                                 <input 
                                    className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm"
                                    placeholder="Still confused? Ask the AI a specific question..."
                                    value={state.followUpQuery}
                                    onChange={(e) => dispatch({ type: 'SET_FOLLOWUP_QUERY', payload: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && state.followUpQuery.trim()) askTutor(state.followUpQuery); }}
                                    disabled={state.isChatting}
                                 />
                                 <Button 
                                    className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                    disabled={state.isChatting || !state.followUpQuery.trim()} 
                                    onClick={() => askTutor(state.followUpQuery)}
                                 >
                                    {state.isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                                 </Button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>

        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/80 bg-muted/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                 <h4 className="text-sm font-bold text-foreground mb-4">Module Progress</h4>
                 <div className="grid grid-cols-5 gap-2">
                    {state.questions.map((q, idx) => {
                       let stateClass = "bg-muted text-muted-foreground border-transparent";
                       if (idx === state.currentIndex) stateClass = "bg-primary text-primary-foreground border-primary";
                       else if (idx < state.currentIndex) stateClass = "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
                       
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
    </div>
  );
}
