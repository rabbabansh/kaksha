'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, BrainCircuit, BookOpen, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Attempt = any;

interface ReviewSessionClientProps {
  subtopic: string;
}

export function ReviewSessionClient({ subtopic }: ReviewSessionClientProps) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // AI Tutor States
  const [explanation, setExplanation] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState<Record<string, boolean>>({});
  const [chatHistory, setChatHistory] = useState<Record<string, {role: string, text: string}[]>>({});
  const [followUpQuery, setFollowUpQuery] = useState<Record<string, string>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch(`/api/practice/review?subtopic=${encodeURIComponent(subtopic)}`);
        const data = await res.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          setErrorMsg('No past attempts found for this topic to review.');
          setLoading(false);
          return;
        }
        setAttempts(data.data);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load review session.');
      } finally {
        setLoading(false);
      }
    }
    initSession();
  }, [subtopic]);

  const askTutor = async (q: Question, query?: string) => {
    if (isExplaining[q.question_id]) return;
    setIsExplaining(prev => ({ ...prev, [q.question_id]: true }));
    
    const isFollowUp = !!query;
    if (isFollowUp) {
      setChatHistory(prev => ({
        ...prev,
        [q.question_id]: [...(prev[q.question_id] || []), { role: 'user', text: query }]
      }));
    }

    try {
      const payload = {
        question_id: q.question_id,
        subtopic: q.subtopic,
        question_html: q.question_html,
        option_a_html: q.option_a_html,
        option_b_html: q.option_b_html,
        option_c_html: q.option_c_html,
        option_d_html: q.option_d_html,
        answer: q.answer,
        explanation_html: q.explanation_html,
        userQuery: query,
        userAnswer: attempts[currentIndex]?.userAnswer
      };
      
      const res = await fetch('/api/practice/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        if (isFollowUp) {
           setChatHistory(prev => ({
             ...prev,
             [q.question_id]: [...(prev[q.question_id] || []), { role: 'tutor', text: data.data }]
           }));
           setFollowUpQuery(prev => ({ ...prev, [q.question_id]: '' }));
        } else {
           setExplanation(prev => ({ ...prev, [q.question_id]: data.data }));
        }
      } else {
        if (isFollowUp) {
           setChatHistory(prev => ({
             ...prev,
             [q.question_id]: [...(prev[q.question_id] || []), { role: 'error', text: 'Failed to get answer.' }]
           }));
        } else {
           setExplanation(prev => ({ ...prev, [q.question_id]: 'Failed to get AI Tutor explanation.' }));
        }
      }
    } catch (err) {
      if (isFollowUp) {
         setChatHistory(prev => ({
           ...prev,
           [q.question_id]: [...(prev[q.question_id] || []), { role: 'error', text: 'Error.' }]
         }));
      } else {
         setExplanation(prev => ({ ...prev, [q.question_id]: 'An error occurred while fetching the AI Tutor explanation.' }));
      }
    }
    
    setIsExplaining(prev => ({ ...prev, [q.question_id]: false }));
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Loading Review Hub...</h2>
      </div>
    );
  }

  if (errorMsg || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Nothing to review</h2>
        <p className="text-muted-foreground">{errorMsg}</p>
        <Button className="mt-6" onClick={() => window.location.href='/dashboard'}>Return to Dashboard</Button>
      </div>
    );
  }

  const currentAttempt = attempts[currentIndex];
  const currentQ = currentAttempt.question;
  const isCorrect = currentAttempt.isCorrect;
  const isSet = currentQ.set_id && currentQ.set_id !== 'N/A';
  const qId = currentQ.question_id;
  
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">
      
      {/* Top Header - Review Mode */}
      <header className="bg-zinc-900 text-white px-6 py-2 flex items-center justify-between border-b-4 border-indigo-500">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-black">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-zinc-300">
              Kaksha Review Mode
            </h1>
            <p className="text-xs text-zinc-400">{subtopic}</p>
          </div>
        </div>
        <div className="text-sm font-semibold text-zinc-300">
           Reviewing {currentIndex + 1} of {attempts.length}
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
                       let btnClass = "h-auto p-4 justify-start text-left items-start w-full border-2 transition-all notranslate opacity-80 cursor-default";
                       
                       if (opt === currentQ.answer) {
                         btnClass += " border-green-500 bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500/20 opacity-100";
                       } else if (opt === currentAttempt.userAnswer && opt !== currentQ.answer) {
                         btnVariant = "destructive";
                         btnClass += " ring-2 ring-red-500/20 opacity-100";
                       }

                       return (
                         <Button
                           key={opt}
                           variant={btnVariant}
                           className={btnClass}
                           translate="no"
                           disabled
                         >
                           <span className="font-bold mr-3">({opt})</span>
                           <span className="flex-1 whitespace-normal">
                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                               {optHtml}
                             </ReactMarkdown>
                           </span>
                           {opt === currentAttempt.userAnswer && (
                              <span className="ml-2 text-xs font-bold uppercase tracking-wider opacity-70">Your Answer</span>
                           )}
                         </Button>
                       );
                     })}
                   </div>
                 ) : (
                   <div className="max-w-sm">
                     <p className="text-sm font-medium mb-2 text-muted-foreground uppercase">You Typed (TITA):</p>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         className={`flex h-12 w-full rounded-md border-2 bg-background px-3 py-2 text-lg font-semibold cursor-default ${isCorrect ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}
                         value={currentAttempt.userAnswer}
                         disabled
                       />
                     </div>
                     {!isCorrect && (
                       <p className="text-sm font-bold text-green-600 mt-2">Correct Answer: {currentQ.answer}</p>
                     )}
                   </div>
                 )}
               </div>
             </CardContent>
          </Card>

          {/* AI Solution Pane */}
          <div className="mt-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
             <div className={`p-6 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:bg-red-950/20'} shadow-sm`}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                   <div className={`flex items-center ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {isCorrect ? (
                         <><CheckCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">You answered correctly</span></>
                      ) : (
                         <><XCircle className="h-7 w-7 mr-2" /> <span className="font-extrabold text-xl tracking-tight">You answered incorrectly</span></>
                      )}
                   </div>
                   <div className="flex gap-3">
                      {!currentQ.explanation_html && !explanation[qId] && (
                         <Button size="sm" onClick={() => askTutor(currentQ)} disabled={isExplaining[qId]} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isExplaining[qId] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
                            Ask AI Tutor
                         </Button>
                      )}
                   </div>
                </div>

                {/* Info Bar */}
                <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground font-semibold">
                   <div className="flex items-center gap-1 bg-background/50 px-3 py-1.5 rounded-md border shadow-sm">
                      <Clock className="h-4 w-4" /> Time Taken: {currentAttempt.timeTaken ? `${currentAttempt.timeTaken}s` : 'Unknown'}
                   </div>
                   <div className="flex items-center gap-1 bg-background/50 px-3 py-1.5 rounded-md border shadow-sm">
                      Attempted: {new Date(currentAttempt.attemptedAt).toLocaleDateString()}
                   </div>
                </div>

                {(currentQ.explanation_html || explanation[qId]) && (
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                         <BookOpen className="h-4 w-4" /> Solution Breakdown
                      </div>
                      <div className="prose dark:prose-invert max-w-none text-sm notranslate bg-background/60 p-6 rounded-lg border border-black/5 dark:border-white/5" translate="no">
                         {explanation[qId] && !currentQ.explanation_html ? (
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                               {explanation[qId]}
                            </ReactMarkdown>
                         ) : (
                            <div dangerouslySetInnerHTML={{ __html: currentQ.explanation_html }} />
                         )}
                      </div>

                      {/* Tier 3: Interactive Chat */}
                      <div className="mt-6 border border-indigo-200 dark:border-indigo-900 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/10 overflow-hidden">
                         <div className="bg-indigo-100/50 dark:bg-indigo-900/50 px-4 py-2 flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">AI Tutor Follow-up</span>
                         </div>
                         
                         <div className="p-4 space-y-4">
                            {(chatHistory[qId] || []).length > 0 && (
                               <div className="space-y-4 mb-4">
                                  {chatHistory[qId].map((msg, i) => (
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
                                কাছের</ReactMarkdown>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}
                            
                            <div className="flex gap-2">
                               <input 
                                  className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm"
                                  placeholder="Still confused? Ask the AI a specific question..."
                                  value={followUpQuery[qId] || ''}
                                  onChange={(e) => setFollowUpQuery(prev => ({ ...prev, [qId]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && followUpQuery[qId]?.trim()) askTutor(currentQ, followUpQuery[qId]); }}
                                  disabled={isExplaining[qId]}
                               />
                               <Button 
                                  className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                  disabled={isExplaining[qId] || !(followUpQuery[qId]?.trim())} 
                                  onClick={() => askTutor(currentQ, followUpQuery[qId])}
                               >
                                  {isExplaining[qId] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                               </Button>
                            </div>
                         </div>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Right Side: Sidebar Navigation (CBT Style) */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border/80 bg-muted/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <Card className="border bg-card shadow-sm">
              <CardContent className="p-4">
                 <h4 className="text-sm font-bold text-foreground mb-4">Past Attempts</h4>
                 <div className="grid grid-cols-5 gap-2">
                    {attempts.map((att, idx) => {
                       let stateClass = att.isCorrect 
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800" 
                        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800";
                       
                       if (idx === currentIndex) {
                         stateClass += " ring-2 ring-primary ring-offset-1";
                       }
                       
                       return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setCurrentIndex(idx);
                              if (scrollRef.current) scrollRef.current.scrollTo({ top: 0 });
                            }}
                            className={`h-10 rounded-md border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:opacity-80 ${stateClass}`}
                          >
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
               variant="outline"
               size="lg" 
               className="w-full font-bold text-base h-14 shadow-sm mb-4" 
               onClick={() => window.location.href='/dashboard'}
             >
                Exit Review
             </Button>
          </div>
        </aside>

      </div>
    </div>
  );
}
