'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Bot, User } from 'lucide-react';
import { ChatQuestionCard } from './chat-question-card';
import { ChatSetCard } from './chat-set-card';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  type: 'text' | 'question' | 'system' | 'set';
  content?: string;
  questionData?: Question;
  questionsData?: Question[]; // For sets with multiple questions
  userAnswer?: string;
  userAnswers?: Record<string, string>; // For sets: questionId -> answer
  isCorrect?: boolean;
  isCorrectMap?: Record<string, boolean>; // For sets: questionId -> isCorrect
};

export function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      type: 'text',
      content: 'Hello! I\'m your CAT preparation assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (textMessage?: string, questionAnswer?: { questionId: string; answer: string }) => {
    const messageToSend = textMessage || input.trim();
    if (!messageToSend && !questionAnswer) return;
    if (isLoading) return;

    const userMessage = questionAnswer
      ? `[ANSWER_SUBMITTED] questionId: ${questionAnswer.questionId}, answer: ${questionAnswer.answer}`
      : messageToSend;

    setInput('');
    
    // Add user message
    if (questionAnswer) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          type: 'text',
          content: `I selected: ${questionAnswer.answer}`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          type: 'text',
          content: messageToSend,
        },
      ]);
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          questionAnswer: questionAnswer,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get response';
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const error = JSON.parse(errorText);
              errorMessage = error.error || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      // Handle response - could be text or question
      if (data.question) {
        // AI wants to ask a question
        // Check if this is a set (multiple questions)
        if (data.questions && data.questions.length > 1) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              type: 'text',
              content: data.message || data.text || '',
            },
            {
              role: 'assistant',
              type: 'set',
              questionData: data.question, // Keep first question for reference
              questionsData: data.questions, // All questions in the set
            },
          ]);
        } else {
          // Single question
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              type: 'text',
              content: data.message || data.text || '',
            },
            {
              role: 'assistant',
              type: 'question',
              questionData: data.question,
            },
          ]);
        }
      } else {
        // Regular text response
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            type: 'text',
            content: data.message || data.text || '',
          },
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'text',
          content: error instanceof Error 
            ? `Sorry, I encountered an error: ${error.message}. Please try again.`
            : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async (questionId: string, answer: string) => {
    // Simply send the answer as a regular message - the API will handle recording the attempt
    // This makes it appear as if the user typed the answer themselves
    handleSend(answer);
  };

  // Render markdown with math support using rehype/remark
  const renderMarkdownContent = (content: string) => {
    return (
      <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed notranslate" translate="no">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, idx) => (
          <div key={idx}>
            {message.type === 'set' && message.questionsData ? (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <ChatSetCard
                    questions={message.questionsData}
                    onSubmit={(questionId, answer) =>
                      handleQuestionSubmit(questionId, answer)
                    }
                    disabled={!!message.userAnswers}
                    userAnswers={message.userAnswers}
                    isCorrectMap={message.isCorrectMap}
                  />
                </div>
              </div>
            ) : message.type === 'question' && message.questionData ? (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <ChatQuestionCard
                    question={message.questionData}
                    onSubmit={(answer) =>
                      handleQuestionSubmit(message.questionData.question_id, answer)
                    }
                    disabled={!!message.userAnswer}
                  />
                  {message.userAnswer && (
                    <div className="mt-2 text-sm">
                      <span className={message.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {message.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-muted/50 border rounded-bl-sm'
                  }`}
                >
                  {message.content && (
                    <div className="text-sm">
                      {renderMarkdownContent(message.content)}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message or ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
