/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BrainCircuit, Target, CheckCircle, XCircle, MinusCircle, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { BrowseClient } from './browse-client';

interface MockReportClientProps {
  year: string;
  slot: string;
}

export function MockReportClient({ year, slot }: MockReportClientProps) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string, text: string }[]>([]);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/mocks/report?year=${year}&slot=${slot}`);
        const data = await res.json();
        if (data.success) {
          setReportData(data.data);
          if (data.data.testProgress?.aiInsights) {
            setAiInsights(data.data.testProgress.aiInsights);
          }
        } else {
          setErrorMsg(data.error || 'Failed to load report');
        }
      } catch (err) {
        setErrorMsg('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [year, slot]);

  const generateInsights = async (query?: string) => {
    if (loadingInsights) return;
    setLoadingInsights(true);

    const isFollowUp = !!query;
    if (isFollowUp) {
      setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    }

    try {
      const res = await fetch('/api/mocks/report/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          slot,
          stats: reportData.stats,
          userQuery: query,
          chatHistory: chatHistory
        })
      });
      const data = await res.json();

      if (data.success) {
        if (isFollowUp) {
          setChatHistory(prev => [...prev, { role: 'tutor', text: data.data }]);
          setFollowUpQuery('');
        } else {
          setAiInsights(data.data);
          // Also update local report data so it knows we generated it
          setReportData((prev: any) => ({ ...prev, testProgress: { ...prev.testProgress, aiInsights: data.data } }));
        }
      }
    } catch (err) {
      console.error(err);
    }

    setLoadingInsights(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (errorMsg || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
        <p className="text-muted-foreground">{errorMsg}</p>
        <Button className="mt-6" onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
      </div>
    );
  }

  const { stats } = reportData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Performance Report</h1>
          <p className="text-muted-foreground text-lg">CAT {year} - Slot {slot}</p>
        </div>
        <Button variant="outline" className="mt-4 md:mt-0" onClick={() => window.location.href = '/dashboard'}>
          Back to Hub
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Total Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{stats.totalScore}</div>
            <p className="text-sm text-muted-foreground mt-1">Marks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /> Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">
              {stats.correct + stats.incorrect > 0
                ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">{stats.correct} correct out of {stats.correct + stats.incorrect} attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-blue-600" /> Attempt Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">
              {Math.round(((stats.correct + stats.incorrect) / (stats.correct + stats.incorrect + stats.skipped)) * 100)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">{stats.skipped} questions skipped</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Banner / Expanded Card */}
      <div className="mb-8">
        <Card className={`border-indigo-200 dark:border-indigo-900/50 flex flex-col ${(!aiInsights && !loadingInsights) ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''}`}>
          <CardHeader className="bg-indigo-50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <BrainCircuit className="h-5 w-5" /> AI Performance Insights
                </CardTitle>
                <CardDescription>Deep dive into your strategy based on mock data</CardDescription>
              </div>
              {!aiInsights && (
                <Button
                  onClick={() => generateInsights()}
                  disabled={loadingInsights}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0"
                >
                  {loadingInsights ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
                  Analyze Mock Performance
                </Button>
              )}
            </div>
          </CardHeader>

          {(loadingInsights || aiInsights) && (
            <CardContent className="p-0 flex flex-col">
              {loadingInsights && !aiInsights && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Analyzing your attempt patterns...</p>
                </div>
              )}

              {aiInsights && (
                <div className="flex flex-col">
                  <div className="p-6 space-y-6">
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                        {aiInsights}
                      </ReactMarkdown>
                    </div>

                    {/* Chat History */}
                    {chatHistory.length > 0 && (
                      <div className="mt-8 pt-6 border-t space-y-4">
                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4">Follow-up Discussion</h4>
                        {chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm'
                                : 'bg-muted/50 border shadow-sm rounded-bl-sm prose dark:prose-invert'
                              }`}>
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 bg-muted/30 border-t rounded-b-xl">
                    <form
                      onSubmit={(e) => { e.preventDefault(); if (followUpQuery.trim()) generateInsights(followUpQuery); }}
                      className="flex gap-2"
                    >
                      <input
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        placeholder="Ask a specific question about your report..."
                        value={followUpQuery}
                        onChange={(e) => setFollowUpQuery(e.target.value)}
                        disabled={loadingInsights}
                      />
                      <Button
                        type="submit"
                        disabled={loadingInsights || !followUpQuery.trim()}
                        className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                      >
                        {loadingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-bold border-b pb-2">Sectional Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['VARC', 'DILR', 'QA'].map((sec) => {
            const sectionData = stats.breakdown[sec];
            if (!sectionData) return null;

            return (
              <Card key={sec}>
                <CardHeader className="bg-muted/30 py-3">
                  <CardTitle className="text-base flex justify-between">
                    <span>{sec}</span>
                    <span className="font-black text-primary">{sectionData.score} pts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg border border-green-100 dark:border-green-900/50">
                      <div className="text-xl font-bold text-green-600">{sectionData.correct}</div>
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Correct</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                      <div className="text-xl font-bold text-red-600">{sectionData.incorrect}</div>
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Wrong</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg border">
                      <div className="text-xl font-bold text-muted-foreground">{sectionData.skipped}</div>
                      <div className="text-xs text-muted-foreground font-semibold uppercase">Skipped</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Question Review</h2>
        <BrowseClient
          questions={reportData.questions}
          topics={[...new Set(reportData.questions.map((q: any) => q.topic).filter(Boolean))] as string[]}
          subtopics={[...new Set(reportData.questions.map((q: any) => q.subtopic).filter(Boolean))] as string[]}
          sections={[...new Set(reportData.questions.map((q: any) => q.section).filter(Boolean))] as string[]}
          attemptMap={reportData.questions.reduce((acc: any, q: any) => {
            if (reportData.userAnswers[q.question_id]) {
              acc[q.question_id] = { isCorrect: reportData.userAnswers[q.question_id] === q.answer, timeTaken: null };
            }
            return acc;
          }, {})}
          testAnswers={reportData.userAnswers}
          showSolutionsDefault={true}
        />
      </div>
    </div>
  );
}
