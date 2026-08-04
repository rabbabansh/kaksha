'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown-renderer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface AITutorPanelProps {
  question: Question;
  userAnswer?: string | null;
  mode?: 'explain' | 'feedback';
}

export function AITutorPanel({ question, userAnswer, mode = 'explain' }: AITutorPanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'tutor' | 'error'; text: string }>>([]);

  const askTutor = async (query?: string) => {
    const isFollowUp = !!query;
    setIsExplaining(true);
    
    if (isFollowUp) {
      setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    }

    try {
      const endpoint = (!isFollowUp && mode === 'feedback') ? '/api/practice/feedback' : '/api/practice/explain';
      
      const payload = {
        question_id: question.question_id,
        subtopic: question.subtopic,
        question_html: question.question_html,
        option_a_html: question.option_a_html,
        option_b_html: question.option_b_html,
        option_c_html: question.option_c_html,
        option_d_html: question.option_d_html,
        answer: question.answer,
        explanation_html: question.explanation_html,
        userQuery: query,
        userAnswer: (!isFollowUp && mode === 'feedback') ? userAnswer : undefined,
        chatHistory: chatHistory
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (isFollowUp) {
          setChatHistory(prev => [...prev, { role: 'tutor', text: data.data }]);
          setFollowUpQuery('');
        } else {
          setExplanation(data.data);
        }
      } else {
        if (isFollowUp) {
          setChatHistory(prev => [...prev, { role: 'error', text: 'Failed to get answer.' }]);
        } else {
          setExplanation('Failed to get AI Tutor explanation.');
        }
      }
    } catch (err) {
      if (isFollowUp) {
        setChatHistory(prev => [...prev, { role: 'error', text: 'Error fetching response.' }]);
      } else {
        setExplanation('An error occurred while fetching the AI Tutor explanation.');
      }
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Ask Tutor Button if no explanation yet */}
      {!explanation && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            className="w-full max-w-sm gap-2 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 shadow-sm"
            onClick={() => askTutor()}
            disabled={isExplaining}
          >
            {isExplaining ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Question...</>
            ) : (
              <><BrainCircuit className="h-4 w-4" /> Ask AI Tutor to Explain</>
            )}
          </Button>
        </div>
      )}

      {/* Explanation Block */}
      {explanation && (
        <div className="mt-4 p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
          <h4 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> AI Tutor Breakdown
          </h4>
          <div className="prose dark:prose-invert max-w-none text-sm notranslate" translate="no">
            <MarkdownRenderer content={explanation} />
          </div>
        </div>
      )}

      {/* Interactive Chat Block */}
      {explanation && (
        <div className="mt-6 border border-indigo-200 dark:border-indigo-900 rounded-xl bg-indigo-50/30 dark:bg-zinc-950 overflow-hidden shadow-sm">
          <div className="bg-indigo-100/50 dark:bg-indigo-900/50 px-4 py-2 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">AI Tutor Follow-up</span>
          </div>

          <div className="p-4 space-y-4">
            {chatHistory.length > 0 && (
              <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : msg.role === 'error'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted border shadow-sm rounded-bl-none'
                      }`}>
                      <MarkdownRenderer content={msg.text} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Still confused? Ask a follow-up question..."
                value={followUpQuery}
                onChange={e => setFollowUpQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && followUpQuery.trim() && !isExplaining) {
                    askTutor(followUpQuery);
                  }
                }}
                disabled={isExplaining}
                className="flex-1 bg-white dark:bg-zinc-900 border-indigo-100 dark:border-zinc-800"
              />
              <Button
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={isExplaining || !followUpQuery.trim()}
                onClick={() => askTutor(followUpQuery)}
              >
                {isExplaining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
