'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionDisplay } from './question-display';
import { groupQuestionsBySet } from '@/lib/grouping'; // Import our new helper

// Define types
type Question = any;
type GroupedByYear = Record<string, Record<string, Question[]>>;

interface PYQViewProps {
  byYearSlot: GroupedByYear;
}

// A new component to render the smart grid
const QuestionGrid = ({ questions, onQuestionSelect }: { questions: Question[], onQuestionSelect: (q: Question) => void }) => {
  // Group questions by set FIRST
  const groupedQuestions = groupQuestionsBySet(questions);

  return (
    <CardContent className="grid grid-cols-8 gap-2">
      {groupedQuestions.map((questionSet, index) => {
        // questionSet is an array of questions, e.g., [q1, q2, q3] or [q1]
        // We will pass the FIRST question of the set to QuestionDisplay
        const firstQuestion = questionSet[0];
        
        return (
          <Button
            key={firstQuestion.question_id}
            variant="outline"
            size="icon"
            // Add a visual indicator for sets
            className={questionSet.length > 1 ? 'border-primary border-2' : ''} 
            onClick={() => onQuestionSelect(firstQuestion)}
            title={questionSet.length > 1 ? `Set ${index + 1} (${questionSet.length} questions)` : `Question ${index + 1}`}
          >
            {index + 1}
          </Button>
        );
      })}
    </CardContent>
  );
};


export function PYQView({ byYearSlot }: PYQViewProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  const years = Object.keys(byYearSlot).sort((a, b) => Number(b) - Number(a));
  const slots = selectedYear ? Object.keys(byYearSlot[selectedYear]).sort() : [];
  
  // This list contains ALL questions for the selected slot
  const allQuestionsInSlot = (selectedYear && selectedSlot) ? byYearSlot[selectedYear][selectedSlot] : [];

  const qaQuestions = allQuestionsInSlot.filter(q => q.section === 'Quantitative Ability');
  const dilrQuestions = allQuestionsInSlot.filter(q => q.section === 'Data Interpretation & Logical Reasoning');
  const varcQuestions = allQuestionsInSlot.filter(q => q.section === 'Verbal Ability & Reading Comprehension');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        {/* Year and Slot Selection */}
        <Card>
          <CardHeader><CardTitle>Select Paper</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold mb-2">Year</p>
            <div className="flex flex-wrap gap-2">
              {years.map(year => <Button key={year} onClick={() => { setSelectedYear(year); setSelectedSlot(null); setActiveQuestion(null); }} variant={selectedYear === year ? 'default' : 'outline'}>{year}</Button>)}
            </div>
            {selectedYear && (
              <>
                <p className="font-semibold mt-4 mb-2">Slot</p>
                <div className="flex flex-wrap gap-2">
                  {slots.map(slot => <Button key={slot} onClick={() => { setSelectedSlot(slot); setActiveQuestion(null); }} variant={selectedSlot === slot ? 'default' : 'outline'}>Slot {slot}</Button>)}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Question Grids */}
        {selectedYear && selectedSlot && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>QA</CardTitle></CardHeader>
              <QuestionGrid questions={qaQuestions} onQuestionSelect={setActiveQuestion} />
            </Card>
            <Card>
              <CardHeader><CardTitle>DILR</CardTitle></CardHeader>
              <QuestionGrid questions={dilrQuestions} onQuestionSelect={setActiveQuestion} />
            </Card>
            <Card>
              <CardHeader><CardTitle>VARC</CardTitle></CardHeader>
              <QuestionGrid questions={varcQuestions} onQuestionSelect={setActiveQuestion} />
            </Card>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {/* Pass allQuestionsInSlot so QuestionDisplay can find other questions in the set */}
        <QuestionDisplay question={activeQuestion} allQuestionsInContext={allQuestionsInSlot} />
      </div>
    </div>
  );
}
