'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Define the type based on Prisma's generated types
type Question = {
    question_id: string;
    section: string | null;
    topic: string | null;
    subtopic: string | null;
    set_html: string | null;
    question_html: string | null;
    question_type: string | null;
    option_a_html: string | null;
    option_b_html: string | null;
    option_c_html: string | null;
    option_d_html: string | null;
    option_e_html: string | null;
    answer: string | null;
    explanation_html: string | null;
};

interface QuestionBrowserProps {
  allQuestions: Question[];
  topics: string[];
  subtopics: string[];
}

export function QuestionBrowser({ allQuestions, topics, subtopics }: QuestionBrowserProps) {
  const [selectedSection, setSelectedSection] = useState('Quantitative Ability');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => 
      q.section === selectedSection &&
      (!selectedTopic || q.topic === selectedTopic) &&
      (!selectedSubtopic || q.subtopic === selectedSubtopic)
    );
  }, [allQuestions, selectedSection, selectedTopic, selectedSubtopic]);

  const handleCheckAnswer = () => {
    if (!activeQuestion || !activeQuestion.answer) return;

    const correct = userAnswer.trim().toUpperCase() === activeQuestion.answer.trim().toUpperCase();
    setIsCorrect(correct);
    setShowSolution(true);
  };

  const handleSelectQuestion = (question: Question) => {
    setActiveQuestion(question);
    setUserAnswer('');
    setShowSolution(false);
    setIsCorrect(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Filters and Question List Column */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Filters & Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setSelectedSection('Quantitative Ability')} variant={selectedSection === 'Quantitative Ability' ? 'default' : 'outline'}>QA</Button>
              <Button onClick={() => setSelectedSection('Data Interpretation & Logical Reasoning')} variant={selectedSection === 'Data Interpretation & Logical Reasoning' ? 'default' : 'outline'}>DILR</Button>
              <Button onClick={() => setSelectedSection('Verbal Ability & Reading Comprehension')} variant={selectedSection === 'Verbal Ability & Reading Comprehension' ? 'default' : 'outline'}>VARC</Button>
            </div>
            {/* Add Select components for topic and subtopic filters here */}

            <Separator className="my-4" />

            <div className="max-h-[60vh] overflow-y-auto">
              {filteredQuestions.map((q, index) => (
                <div 
                  key={q.question_id}
                  className="p-2 hover:bg-muted rounded-md cursor-pointer"
                  onClick={() => handleSelectQuestion(q)}
                >
                  <p className="font-semibold">Question {index + 1}</p>
                  <div className="text-sm text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: q.question_html || '' }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Question Column */}
      <div className="md:col-span-2">
        {activeQuestion ? (
          <Card>
            <CardHeader>
              <CardTitle>{activeQuestion.topic} - {activeQuestion.subtopic}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* WARNING: dangerouslySetInnerHTML is risky with unsanitized data. In production, use a library like 'dompurify'. */}
              {activeQuestion.set_html && activeQuestion.set_html !== 'N/A' && (
                <div className="prose dark:prose-invert mb-4 p-4 border rounded-md" dangerouslySetInnerHTML={{ __html: activeQuestion.set_html }} />
              )}
              <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: activeQuestion.question_html || '' }} />

              <Separator className="my-6" />

              {/* Answer Section */}
              <div className="space-y-4">
                {activeQuestion.question_type === 'MCQ' ? (
                  ['A', 'B', 'C', 'D', 'E'].map(opt => {
                    const optionKey = `option_${opt.toLowerCase()}_html` as keyof Question;
                    const optionHtml = activeQuestion[optionKey];
                    if (optionHtml && optionHtml !== 'N/A') {
                      return (
                        <Button 
                          key={opt}
                          variant={userAnswer === opt ? 'secondary' : 'outline'}
                          className="w-full justify-start h-auto text-left whitespace-normal"
                          onClick={() => setUserAnswer(opt)}
                        >
                          <div className="flex items-start gap-4">
                            <span className="font-bold">({opt})</span>
                            <div dangerouslySetInnerHTML={{ __html: optionHtml }} />
                          </div>
                        </Button>
                      );
                    }
                    return null;
                  })
                ) : (
                  <Input 
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                )}
              </div>

              <Button onClick={handleCheckAnswer} className="mt-6" disabled={showSolution}>Check Answer</Button>

              {/* Solution Section */}
              {showSolution && (
                <div className="mt-6">
                  <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect.'} The correct answer is: {activeQuestion.answer}
                  </h3>
                  <Separator className="my-4" />
                  <h4 className="font-semibold text-lg mb-2">Solution:</h4>
                  <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: activeQuestion.explanation_html || 'No explanation available.' }} />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a question from the list to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}