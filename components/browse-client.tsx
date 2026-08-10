'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/filter-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionDisplay } from './question-display';
import { Search, Filter, Loader2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface BrowseClientProps {
  questions: Question[];
  topics: string[];
  subtopics: string[];
  sections: string[];
  attemptMap?: Record<string, { isCorrect: boolean; timeTaken: number | null }>;
  testAnswers?: Record<string, string>;
  showSolutionsDefault?: boolean;
}

export function BrowseClient({ questions, topics, subtopics, sections, attemptMap = {}, testAnswers, showSolutionsDefault }: BrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [fullQuestionData, setFullQuestionData] = useState<Question | null>(null);
  const [setQuestions, setSetQuestions] = useState<Question[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Fetch full question data when a question is selected
  useEffect(() => {
    // Create AbortController to cancel in-flight requests
    const abortController = new AbortController();
    const currentQuestionId = selectedQuestion?.question_id;

    if (currentQuestionId) {
      setLoadingQuestion(true);
      fetch(`/api/questions/${currentQuestionId}`, {
        signal: abortController.signal,
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch question: ${res.statusText}`);
          }
          return res.json();
        })
        .then(payload => {
          if (payload.success) {
            const data = payload.data;
            if (data.question && data.question.question_id === currentQuestionId) {
              setFullQuestionData(data.question);
              if (data.setQuestions && data.setQuestions.length > 1) {
                setSetQuestions(data.setQuestions);
              } else {
                setSetQuestions([data.question]);
              }
            }
          } else {
            console.error('API returned an error:', payload.error);
          }
        })
        .catch(err => {
          // Ignore abort errors (they're expected when cancelling requests)
          if (err.name !== 'AbortError') {
            console.error('Error fetching question:', err);
          }
        })
        .finally(() => {
          // Only update loading state if this is still the current question
          if (currentQuestionId === selectedQuestion?.question_id) {
            setLoadingQuestion(false);
          }
        });
    } else {
      setFullQuestionData(null);
      setSetQuestions([]);
      setLoadingQuestion(false);
    }

    // Cleanup: cancel the request if the component unmounts or selectedQuestion changes
    return () => {
      abortController.abort();
    };
  }, [selectedQuestion]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Search filter (metadata only - question_html is fetched on demand)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (q.topic || '').toLowerCase().includes(query) ||
          (q.subtopic || '').toLowerCase().includes(query) ||
          (q.section || '').toLowerCase().includes(query) ||
          (q.year || '').includes(query) ||
          (q.slot || '').toLowerCase().includes(query) ||
          (q.question_id || '').toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Topic filter
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) return false;

      // Subtopic filter
      if (selectedSubtopic !== 'all' && q.subtopic !== selectedSubtopic) return false;

      // Section filter
      if (selectedSection !== 'all' && q.section !== selectedSection) return false;

      // Status filter
      if (selectedStatus !== 'all') {
        const attempt = attemptMap[q.question_id];
        if (selectedStatus === 'unattempted' && attempt) return false;
        if (selectedStatus === 'attempted' && !attempt) return false;
        if (selectedStatus === 'correct' && (!attempt || !attempt.isCorrect)) return false;
        if (selectedStatus === 'incorrect' && (!attempt || attempt.isCorrect)) return false;
      }

      return true;
    });
  }, [questions, searchQuery, selectedTopic, selectedSubtopic, selectedSection, selectedStatus, attemptMap]);

  // Get filtered subtopics based on selected topic
  const availableSubtopics = useMemo(() => {
    if (selectedTopic === 'all') return subtopics;
    return subtopics.filter((st) =>
      questions.some((q) => q.topic === selectedTopic && q.subtopic === st)
    );
  }, [subtopics, selectedTopic, questions]);

  return (
    <div className="flex flex-col gap-6">
      {/* Horizontal Filters Top Bar */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold whitespace-nowrap">
              <Filter className="h-5 w-5" />
              Practice Bank
            </div>
            <FilterBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showSearch={true}
              sections={sections}
              selectedSection={selectedSection}
              onSectionChange={setSelectedSection}
              topics={topics}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              subtopics={availableSubtopics}
              selectedSubtopic={selectedSubtopic}
              onSubtopicChange={setSelectedSubtopic}
              showStatus={true}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onClear={() => {
                setSearchQuery('');
                setSelectedTopic('all');
                setSelectedSubtopic('all');
                setSelectedSection('all');
                setSelectedStatus('all');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Two Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Pane: Question Display */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {selectedQuestion ? (
            <div className="space-y-4">
              {loadingQuestion ? (
                <Card className="flex items-center justify-center min-h-[500px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading question...</p>
                  </div>
                </Card>
              ) : fullQuestionData ? (
                <div className="bg-background rounded-xl shadow-sm border overflow-hidden">
                  <QuestionDisplay
                    question={fullQuestionData}
                    allQuestionsInContext={setQuestions}
                    isTestMode={!!testAnswers || showSolutionsDefault}
                    testFinished={showSolutionsDefault}
                    testAnswers={testAnswers}
                  />
                </div>
              ) : (
                <Card className="flex items-center justify-center min-h-[500px]">
                  <p className="text-muted-foreground">Failed to load question</p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground bg-muted/10 border-dashed">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg">Select a question from the list to view it here.</p>
            </Card>
          )}
        </div>

        {/* Right Pane: Questions List */}
        <div className="lg:col-span-1 order-1 lg:order-2 sticky top-6">
          <Card className="flex flex-col h-[calc(100vh-140px)]">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Question List</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {filteredQuestions.length} found
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>No questions found.</p>
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isSelected = selectedQuestion?.question_id === q.question_id;
                  return (
                    <Button
                      key={q.question_id}
                      variant="ghost"
                      className={`w-full justify-between text-left h-auto py-3 px-3 rounded-lg border border-transparent hover:border-border transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-md' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <div className="flex-1 mr-3 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${isSelected ? 'text-primary-foreground' : ''}`}>Q{idx + 1}</span>
                          {q.section && (
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {q.section}
                            </span>
                          )}
                        </div>
                        <div className={`text-xs truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {q.topic} {q.subtopic && `• ${q.subtopic}`}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {attemptMap[q.question_id] ? (
                          attemptMap[q.question_id].isCorrect ? (
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-green-400/20 text-green-100' : 'text-green-600 bg-green-50 dark:bg-green-900/30'
                            }`}>
                              <CheckCircle className="h-3 w-3" />
                            </div>
                          ) : (
                            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-red-400/20 text-red-100' : 'text-red-600 bg-red-50 dark:bg-red-900/30'
                            }`}>
                              <XCircle className="h-3 w-3" />
                            </div>
                          )
                        ) : (
                          <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-muted-foreground bg-muted/50'
                          }`}>
                            <MinusCircle className="h-3 w-3" />
                          </div>
                        )}
                        {attemptMap[q.question_id]?.timeTaken && (
                          <div className={`text-[9px] font-semibold ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                            {attemptMap[q.question_id].timeTaken}s
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
