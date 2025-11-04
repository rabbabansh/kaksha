'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionDisplay } from './question-display';
import { groupQuestionsBySet } from '@/lib/grouping'; // Import the helper

type Question = any;
type GroupedByTopic = Record<string, Record<string, Question[]>>;

interface TopicViewProps {
  section: string;
  data: GroupedByTopic;
  allQuestions: Question[]; // This holds ALL questions from all topics for context
}

export function TopicView({ section, data, allQuestions }: TopicViewProps) {
  // This state will hold the list of grouped sets/questions for the right panel
  const [activeSubtopicContent, setActiveSubtopicContent] = useState<Question[][] | null>(null);
  
  // This state will hold the single active question/set to display
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  const topics = Object.keys(data).sort();
  
  const handleSubtopicClick = (subtopicQuestions: Question[]) => {
    // Group the questions and set them as the list for the right panel
    setActiveSubtopicContent(groupQuestionsBySet(subtopicQuestions));
    // Clear the active question display
    setActiveQuestion(null); 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        {/* Left panel: Topic/Subtopic Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {topics.map(topic => (
            <AccordionItem key={topic} value={topic}>
              <AccordionTrigger>{topic}</AccordionTrigger>
              <AccordionContent>
                {Object.keys(data[topic]).sort().map(subtopic => (
                  <div 
                    key={subtopic} 
                    className="p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => handleSubtopicClick(data[topic][subtopic])}
                  >
                    {subtopic}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="lg:col-span-2">
        {activeQuestion ? (
          // Display mode: Show the selected question/set
          <div>
            <Button onClick={() => setActiveQuestion(null)} variant="outline" className="mb-4">
              Back to list
            </Button>
            <QuestionDisplay 
              question={activeQuestion} 
              allQuestionsInContext={allQuestions} // Pass all questions so it can find set members
            />
          </div>
        ) : activeSubtopicContent ? (
          // List mode: Show the list of questions/sets for the selected subtopic
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Questions / Sets</h2>
            <div className="max-h-[80vh] overflow-y-auto space-y-2 p-1">
              {activeSubtopicContent.map((questionSet, index) => {
                const firstQuestion = questionSet[0];
                const isSet = questionSet.length > 1;
                return (
                  <Card 
                    key={firstQuestion.question_id} 
                    className="cursor-pointer hover:border-primary"
                    onClick={() => setActiveQuestion(firstQuestion)}
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold">{isSet ? `Set ${index + 1}` : `Question ${index + 1}`} ({firstQuestion.source})</p>
                      <div className="text-sm text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: firstQuestion.question_html || '' }} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a subtopic to view questions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
