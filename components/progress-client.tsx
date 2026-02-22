'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface UserProgressStats {
  kakshaScore: number;
  sections: Array<{
    section: string;
    topics: Array<{
      topic: string;
      subtopics: Array<{
        subtopic: string;
        totalQuestions: number;
        correctCount: number;
        percentage: number;
      }>;
      percentage: number;
    }>;
    percentage: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  totalAttempts: number;
  totalCorrect: number;
}

export function ProgressClient() {
  const [stats, setStats] = useState<UserProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/progress/stats');
      if (response.ok) {
        const payload = await response.json();

        if (payload.success) {
          const data = payload.data;
          setStats(data);
          if (data.sections && data.sections.length > 0) {
            setSelectedSection(data.sections[0].section);
          }
        } else {
          console.error('API returned an error:', payload.error);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading progress...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">No progress data available yet.</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };


  return (
    <div className="space-y-6">
      {/* Kaksha Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Kaksha Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(stats.kakshaScore)}`}>
              {stats.kakshaScore}%
            </div>
            <div className="flex-1">
              <Progress value={stats.kakshaScore} className="h-4" />
              <div className="mt-2 text-sm text-muted-foreground">
                Overall performance across all sections
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCorrect}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.strengths.length > 0 ? (
              <div className="space-y-2">
                {stats.strengths.map((strength, idx) => (
                  <Badge key={idx} variant="outline" className="w-full justify-start p-2">
                    {strength}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No strengths identified yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.weaknesses.length > 0 ? (
              <div className="space-y-2">
                {stats.weaknesses.map((weakness, idx) => (
                  <Badge key={idx} variant="outline" className="w-full justify-start p-2">
                    {weakness}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No weaknesses identified yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress by Section */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSection || stats.sections[0]?.section} onValueChange={setSelectedSection}>
            <TabsList className="grid w-full grid-cols-3">
              {stats.sections.map((section) => (
                <TabsTrigger key={section.section} value={section.section}>
                  {section.section} ({section.percentage}%)
                </TabsTrigger>
              ))}
            </TabsList>

            {stats.sections.map((section) => (
              <TabsContent key={section.section} value={section.section} className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  {section.topics.map((topic) => (
                    <AccordionItem key={topic.topic} value={topic.topic}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">{topic.topic}</span>
                          <span className={`text-sm font-medium ${getScoreColor(topic.percentage)}`}>
                            {topic.percentage}%
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {topic.subtopics.map((subtopic) => (
                            <div key={subtopic.subtopic} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{subtopic.subtopic}</span>
                                <span className={`text-sm font-medium ${getScoreColor(subtopic.percentage)}`}>
                                  {subtopic.percentage}% ({subtopic.correctCount}/{subtopic.totalQuestions})
                                </span>
                              </div>
                              <Progress
                                value={subtopic.percentage}
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


