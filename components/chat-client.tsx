'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles, BookOpen, Lightbulb, TrendingUp } from 'lucide-react';
import { ChatQuestionCard } from './chat-question-card';
import { ChatSetCard } from './chat-set-card';
import { InlineMath, BlockMath } from 'react-katex';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'question' | 'system' | 'set';
  content?: string;
  questionData?: Question;
  questionsData?: Question[];
  userAnswer?: string;
  userAnswers?: Record<string, string>;
  isCorrect?: boolean;
  isCorrectMap?: Record<string, boolean>;
};

interface ChatClientProps {
  userName?: string;
  compact?: boolean; // when true, hides top-level header padding (used in TutorBubble)
}

export function ChatClient({ userName = 'there', compact = false }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      type: 'text',
      content: `Hello ${userName}! I'm Koach, your personal CAT prep tutor. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (textMessage?: string, questionAnswer?: { questionId: string; answer: string }) => {
    const messageToSend = textMessage || input.trim();
    if (!messageToSend && !questionAnswer) return;
    if (isLoading) return;

    const userMessage = questionAnswer
      ? `[ANSWER_SUBMITTED] questionId: ${questionAnswer.questionId}, answer: ${questionAnswer.answer}`
      : messageToSend;

    setInput('');

    if (questionAnswer) {
      setMessages((prev) => [...prev, { role: 'user', type: 'text', content: `I selected: ${questionAnswer.answer}` }]);
    } else {
      setMessages((prev) => [...prev, { role: 'user', type: 'text', content: messageToSend }]);
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages, questionAnswer }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      if (data.question) {
        if (data.questions && data.questions.length > 1) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', type: 'text', content: data.message || data.text || '' },
            { role: 'assistant', type: 'set', questionData: data.question, questionsData: data.questions },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', type: 'text', content: data.message || data.text || '' },
            { role: 'assistant', type: 'question', questionData: data.question },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', type: 'text', content: data.message || data.text || '' },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', type: 'text', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (questionId: string, answer: string) => {
    handleSend(answer);
  };

  const renderMathInText = (text: string): React.ReactNode => {
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    const mathRegex = /\$\$?([^$]+)\$\$?/g;
    const matches = [];
    let match;

    while ((match = mathRegex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length, content: match[1], isBlock: match[0].startsWith('$$') && match[0].endsWith('$$') });
    }

    if (matches.length === 0) return text;

    matches.forEach((mathMatch, idx) => {
      if (mathMatch.start > lastIndex) {
        const textBefore = text.substring(lastIndex, mathMatch.start);
        if (textBefore) parts.push(<span key={`text-${idx}`}>{textBefore}</span>);
      }
      try {
        if (mathMatch.isBlock) parts.push(<BlockMath key={`math-${idx}`} math={mathMatch.content} />);
        else parts.push(<InlineMath key={`math-${idx}`} math={mathMatch.content} />);
      } catch {
        parts.push(<span key={`math-${idx}`}>{mathMatch.content}</span>);
      }
      lastIndex = mathMatch.end;
    });

    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex);
      if (textAfter) parts.push(<span key="text-end">{textAfter}</span>);
    }

    return <>{parts}</>;
  };

  const processMathInChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') return renderMathInText(children);
    if (Array.isArray(children)) return children.map((child, idx) => <span key={idx}>{processMathInChildren(child)}</span>);
    return children;
  };

  const renderMarkdownContent = (content: string) => {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border">
        <MarkdownRenderer content={content} />
      </div>
    );
  };

  const SUGGESTIONS = [
    { label: 'Explain Algebra Basics', icon: <BookOpen className="w-3 h-3" /> },
    { label: 'Give me a DILR puzzle', icon: <Lightbulb className="w-3 h-3" /> },
    { label: 'How do I improve my reading speed?', icon: <TrendingUp className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" ref={scrollRef}>
        
        {/* Welcome state / Suggestions */}
        {messages.length === 1 && (
          <div className="mt-8 mb-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-sm">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">How can I help you ace CAT?</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-8">
              I can explain difficult concepts, provide practice sets, or help you analyze your past mistakes.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/80 border border-border/50 rounded-xl text-xs font-semibold transition-colors text-foreground"
                >
                  <span className="text-primary">{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div key={idx} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 mr-3 mt-1 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
            )}

            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Content */}
              {message.type === 'set' && message.questionsData ? (
                <div className="w-full mt-2">
                  <ChatSetCard
                    questions={message.questionsData}
                    onSubmit={(qId, ans) => handleQuestionSubmit(qId, ans)}
                    disabled={!!message.userAnswers}
                    userAnswers={message.userAnswers}
                    isCorrectMap={message.isCorrectMap}
                  />
                </div>
              ) : message.type === 'question' && message.questionData ? (
                <div className="w-full mt-2">
                  <ChatQuestionCard
                    question={message.questionData}
                    onSubmit={(ans) => handleQuestionSubmit(message.questionData.question_id, ans)}
                    disabled={!!message.userAnswer}
                  />
                  {message.userAnswer && (
                    <div className="mt-2 text-xs font-bold px-1">
                      <span className={message.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                        {message.isCorrect ? '✓ Correct Answer!' : '✗ Incorrect'}
                      </span>
                    </div>
                  )}
                </div>
              ) : message.content ? (
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-br-sm'
                      : 'bg-muted/40 border border-border/50 text-foreground rounded-bl-sm leading-relaxed'
                  }`}
                >
                  {renderMarkdownContent(message.content)}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full justify-start animate-in fade-in zoom-in duration-300">
            <div className="flex-shrink-0 w-8 h-8 mr-3 mt-1 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="bg-muted/40 border border-border/50 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 pb-24 md:pb-4 bg-background border-t border-border/40 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative max-w-4xl mx-auto flex items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Koach anything..."
            disabled={isLoading}
            className="w-full pr-12 pl-5 py-6 rounded-2xl bg-muted/20 border-border/60 focus-visible:ring-primary focus-visible:ring-1 shadow-sm text-sm"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 h-9 w-9 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2 font-medium">
          Koach can make mistakes. Consider verifying important logic.
        </p>
      </div>
    </div>
  );
}
