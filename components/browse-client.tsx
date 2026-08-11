'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionDisplay } from './question-display';
import { Search, Filter, Loader2, CheckCircle, XCircle, MinusCircle, X, ChevronLeft, SlidersHorizontal } from 'lucide-react';

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
  questionTexts?: Record<string, string>; // stripped plaintext of question HTML for full-text search
}

export function BrowseClient({ questions, topics, subtopics, sections, attemptMap = {}, testAnswers, showSolutionsDefault, questionTexts = {} }: BrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [fullQuestionData, setFullQuestionData] = useState<Question | null>(null);
  const [setQuestions, setSetQuestions] = useState<Question[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch full question data when a question is selected
  useEffect(() => {
    const abortController = new AbortController();
    const currentQuestionId = selectedQuestion?.question_id;

    if (currentQuestionId) {
      setLoadingQuestion(true);
      fetch(`/api/questions/${currentQuestionId}`, { signal: abortController.signal })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch question: ${res.statusText}`);
          return res.json();
        })
        .then(payload => {
          if (payload.success) {
            const data = payload.data;
            if (data.question && data.question.question_id === currentQuestionId) {
              setFullQuestionData(data.question);
              setSetQuestions(data.setQuestions?.length > 1 ? data.setQuestions : [data.question]);
            }
          }
        })
        .catch(err => { if (err.name !== 'AbortError') console.error('Error fetching question:', err); })
        .finally(() => {
          if (currentQuestionId === selectedQuestion?.question_id) setLoadingQuestion(false);
        });
    } else {
      setFullQuestionData(null);
      setSetQuestions([]);
      setLoadingQuestion(false);
    }

    return () => { abortController.abort(); };
  }, [selectedQuestion]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const plainText = questionTexts[q.question_id] || '';
        const matchesSearch =
          (q.topic || '').toLowerCase().includes(query) ||
          (q.subtopic || '').toLowerCase().includes(query) ||
          (q.section || '').toLowerCase().includes(query) ||
          (q.year || '').includes(query) ||
          (q.slot || '').toLowerCase().includes(query) ||
          (q.question_id || '').toLowerCase().includes(query) ||
          plainText.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedTopic !== 'all' && q.topic !== selectedTopic) return false;
      if (selectedSubtopic !== 'all' && q.subtopic !== selectedSubtopic) return false;
      if (selectedSection !== 'all' && q.section !== selectedSection) return false;
      if (selectedStatus !== 'all') {
        const attempt = attemptMap[q.question_id];
        if (selectedStatus === 'unattempted' && attempt) return false;
        if (selectedStatus === 'attempted' && !attempt) return false;
        if (selectedStatus === 'correct' && (!attempt || !attempt.isCorrect)) return false;
        if (selectedStatus === 'incorrect' && (!attempt || attempt.isCorrect)) return false;
      }
      return true;
    });
  }, [questions, searchQuery, selectedTopic, selectedSubtopic, selectedSection, selectedStatus, attemptMap, questionTexts]);

  const availableSubtopics = useMemo(() => {
    if (selectedTopic === 'all') return subtopics;
    return subtopics.filter((st) => questions.some((q) => q.topic === selectedTopic && q.subtopic === st));
  }, [subtopics, selectedTopic, questions]);

  const handleClear = () => {
    setSearchQuery('');
    setSelectedTopic('all');
    setSelectedSubtopic('all');
    setSelectedSection('all');
    setSelectedStatus('all');
  };

  const activeFilterCount = [
    selectedSection !== 'all',
    selectedTopic !== 'all',
    selectedSubtopic !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  const questionListPanel = (
    <div className="flex flex-col h-full">
      {/* Search + filter toggle */}
      <div className="p-3 border-b border-border/60 flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 relative shrink-0"
          onClick={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="px-3 py-2 flex flex-wrap gap-1.5 border-b border-border/40">
          {selectedSection !== 'all' && (
            <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer" onClick={() => setSelectedSection('all')}>
              {selectedSection} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {selectedTopic !== 'all' && (
            <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer" onClick={() => setSelectedTopic('all')}>
              {selectedTopic} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {selectedSubtopic !== 'all' && (
            <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer" onClick={() => setSelectedSubtopic('all')}>
              {selectedSubtopic} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {selectedStatus !== 'all' && (
            <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer" onClick={() => setSelectedStatus('all')}>
              {selectedStatus} <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          <button className="text-[10px] text-muted-foreground underline" onClick={handleClear}>Clear all</button>
        </div>
      )}

      {/* Count */}
      <div className="px-3 py-1.5 border-b border-border/40">
        <span className="text-xs text-muted-foreground font-medium">{filteredQuestions.length} questions found</span>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No questions found.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSelected = selectedQuestion?.question_id === q.question_id;
            const attempt = attemptMap[q.question_id];
            return (
              <button
                key={q.question_id}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'border-transparent hover:bg-muted/60 hover:border-border'
                }`}
                onClick={() => setSelectedQuestion(q)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      Q{idx + 1}
                    </span>
                    {q.section && (
                      <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {q.section}
                      </span>
                    )}
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {q.subtopic || q.topic}
                    </span>
                  </div>
                  {attempt ? (
                    attempt.isCorrect ? (
                      <CheckCircle className={`h-4 w-4 shrink-0 ${isSelected ? 'text-green-300' : 'text-green-600'}`} />
                    ) : (
                      <XCircle className={`h-4 w-4 shrink-0 ${isSelected ? 'text-red-300' : 'text-red-500'}`} />
                    )
                  ) : (
                    <MinusCircle className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white/40' : 'text-muted-foreground/40'}`} />
                  )}
                </div>
                <div className={`text-[10px] mt-1 truncate ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {q.topic}{q.year && ` · CAT ${q.year}`}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">

      {/* ---- MOBILE LAYOUT ---- */}
      <div className="md:hidden flex flex-col gap-0" style={{ height: 'calc(100dvh - 10rem)' }}>
        {selectedQuestion ? (
          /* Mobile: Question View */
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-background shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => { setSelectedQuestion(null); setFullQuestionData(null); }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <span className="text-sm font-semibold text-muted-foreground truncate">
                {selectedQuestion.subtopic || selectedQuestion.topic}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pb-24">
              {loadingQuestion ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-sm">Loading question...</p>
                </div>
              ) : fullQuestionData ? (
                <div className="bg-background overflow-hidden">
                  <QuestionDisplay
                    question={fullQuestionData}
                    allQuestionsInContext={setQuestions}
                    isTestMode={!!testAnswers || showSolutionsDefault}
                    testFinished={showSolutionsDefault}
                    testAnswers={testAnswers}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Failed to load question.</div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile: Question List */
          <div className="flex flex-col h-full bg-background">
            {questionListPanel}
          </div>
        )}
      </div>

      {/* ---- DESKTOP LAYOUT ---- */}
      <div className="hidden md:block">
        {/* Desktop filters bar */}
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold whitespace-nowrap">
                <Filter className="h-5 w-5" />
                Practice Bank
              </div>
              <div className="flex-1 flex flex-wrap gap-3 items-center justify-end">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                {sections.length > 0 && (
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Section" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {topics.length > 0 && (
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Topic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {availableSubtopics.length > 0 && (
                  <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic}>
                    <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Subtopic" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subtopics</SelectItem>
                      {availableSubtopics.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="unattempted">Unattempted</SelectItem>
                    <SelectItem value="attempted">Attempted</SelectItem>
                    <SelectItem value="correct">Correctly Answered</SelectItem>
                    <SelectItem value="incorrect">Incorrectly Answered</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-9" onClick={handleClear}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
          {/* Left: Question Display */}
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

          {/* Right: Question List */}
          <div className="lg:col-span-1 order-1 lg:order-2 sticky top-6">
            <Card className="flex flex-col h-[calc(100vh-140px)]">
              <CardHeader className="py-4 border-b shrink-0">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Question List</span>
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {filteredQuestions.length} found
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto">
                {questionListPanel}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-md max-h-[80dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filter Questions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {sections.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All Sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {topics.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All Topics" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {availableSubtopics.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtopic</label>
                <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="All Subtopics" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subtopics</SelectItem>
                    {availableSubtopics.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10"><SelectValue placeholder="All Questions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="unattempted">Unattempted</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                  <SelectItem value="correct">Correctly Answered</SelectItem>
                  <SelectItem value="incorrect">Incorrectly Answered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { handleClear(); setShowFilterModal(false); }}>
                Clear All
              </Button>
              <Button className="flex-1" onClick={() => setShowFilterModal(false)}>
                Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
