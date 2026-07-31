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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtopic</label>
              <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subtopics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subtopics</SelectItem>
                  {availableSubtopics.map((subtopic) => (
                    <SelectItem key={subtopic} value={subtopic}>
                      {subtopic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

            <Button
              variant="outline"
              className="w-full"
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
          </CardContent>
        </Card>
      </div>

      {/* Questions List and Display */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredQuestions.length} Question{filteredQuestions.length !== 1 ? 's' : ''} Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No questions found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Question List */}
                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {filteredQuestions.map((q, idx) => (
                    <Button
                      key={q.question_id}
                      variant={selectedQuestion?.question_id === q.question_id ? 'default' : 'outline'}
                      className="w-full justify-between text-left h-auto py-3"
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Q{idx + 1}</span>
                          {q.year && q.slot && (
                            <span className="text-xs text-muted-foreground">
                              CAT {q.year} - Slot {q.slot}
                            </span>
                          )}
                          {q.section && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {q.section}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {q.question_type || 'Question'} • ID: {q.question_id}
                        </div>
                        {q.topic && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {q.topic} {q.subtopic && `• ${q.subtopic}`}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {attemptMap[q.question_id] ? (
                          attemptMap[q.question_id].isCorrect ? (
                             <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                               <CheckCircle className="h-3 w-3" /> Correct
                             </div>
                          ) : (
                             <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                               <XCircle className="h-3 w-3" /> Incorrect
                             </div>
                          )
                        ) : (
                           <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                             <MinusCircle className="h-3 w-3" /> Unattempted
                           </div>
                        )}
                        
                        {attemptMap[q.question_id]?.timeTaken && (
                           <div className="text-[10px] text-muted-foreground font-semibold">
                             {attemptMap[q.question_id].timeTaken}s
                           </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Question Display */}
                {selectedQuestion && (
                  <div className="mt-6">
                    {loadingQuestion ? (
                      <Card className="flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-muted-foreground">Loading question...</p>
                        </div>
                      </Card>
                    ) : fullQuestionData ? (
                      <QuestionDisplay
                        question={fullQuestionData}
                        allQuestionsInContext={setQuestions}
                        isTestMode={!!testAnswers || showSolutionsDefault}
                        testFinished={showSolutionsDefault}
                        testAnswers={testAnswers}
                      />
                    ) : (
                      <Card className="flex items-center justify-center min-h-[400px]">
                        <p className="text-muted-foreground">Failed to load question</p>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


