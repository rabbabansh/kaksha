'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  recommended?: { strengths: string[], weaknesses: string[] };
}

export function BrowseClient({ questions, topics, subtopics, sections, attemptMap = {}, testAnswers, showSolutionsDefault, recommended }: BrowseClientProps) {
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

  const handleRandomQuestion = () => {
    if (filteredQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
      setSelectedQuestion(filteredQuestions[randomIndex]);
    }
  };

  const isReviewMode = !!testAnswers || showSolutionsDefault;

  return (
    <div className="space-y-6">
      {/* Horizontal Filters Section */}
      <Card className="w-full">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            {isReviewMode ? 'Question Review' : 'Practice Bank'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {!isReviewMode && (
              <>
                <div className="flex-1 min-w-[150px] space-y-2">
                  <label className="text-sm font-medium">Section</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px] space-y-2">
                  <label className="text-sm font-medium">Topic</label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[150px] space-y-2">
                  <label className="text-sm font-medium">Subtopic</label>
                  <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subtopics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subtopics</SelectItem>
                      {availableSubtopics.map((subtopic) => (
                        <SelectItem key={subtopic} value={subtopic}>{subtopic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex-1 min-w-[150px] space-y-2">
              <label className="text-sm font-medium">Attempt Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Questions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="unattempted">Unattempted</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                  <SelectItem value="correct">Correctly Answered</SelectItem>
                  <SelectItem value="incorrect">Incorrectly Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic('all');
                  setSelectedSubtopic('all');
                  setSelectedSection('all');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </Button>
              
              {!isReviewMode && (
                <Button
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleRandomQuestion}
                  disabled={filteredQuestions.length === 0}
                >
                  Surprise Me
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {/* Left Column: Active Question Display (takes up most space) */}
        <div className="lg:col-span-2 xl:col-span-3">
          <Card className="min-h-[500px] border-primary/10 shadow-sm">
            <CardContent className="pt-6">
              {!selectedQuestion ? (
                <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground space-y-4">
                  <Search className="h-12 w-12 opacity-20" />
                  <p className="text-lg">Select a question from the list to view it here.</p>
                </div>
              ) : loadingQuestion ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading question...</p>
                </div>
              ) : fullQuestionData ? (
                <QuestionDisplay
                  question={fullQuestionData}
                  allQuestionsInContext={setQuestions}
                  isTestMode={isReviewMode}
                  testFinished={isReviewMode}
                  testAnswers={testAnswers}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <p className="text-muted-foreground">Failed to load question.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Question List */}
        <div className="lg:col-span-1 xl:col-span-1">
          <Card className="sticky top-6 border-primary/10 shadow-sm h-[calc(100vh-100px)] flex flex-col">
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-md flex justify-between items-center">
                <span>Question List</span>
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {filteredQuestions.length} Found
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <p>No questions match filters.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredQuestions.map((q, idx) => {
                    const isSelected = selectedQuestion?.question_id === q.question_id;
                    return (
                      <button
                        key={q.question_id}
                        onClick={() => setSelectedQuestion(q)}
                        className={`w-full text-left p-4 transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : ''}`}>
                            Q{idx + 1}
                          </span>
                          <div className="flex items-center">
                            {attemptMap[q.question_id] ? (
                              attemptMap[q.question_id].isCorrect ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle className="h-3 w-3" /> Correct
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                                  <XCircle className="h-3 w-3" /> Incorrect
                                </span>
                              )
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                <MinusCircle className="h-3 w-3" /> Unattempted
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {q.question_id}
                        </div>
                        {(!isReviewMode && q.topic) && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {q.topic} • {q.subtopic}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


