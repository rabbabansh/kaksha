'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TopicView } from './topic-view';

type Question = any;

interface TopicViewWrapperProps {
  allQuestions: Question[];
}

export function TopicViewWrapper({ allQuestions }: TopicViewWrapperProps) {
  const [selectedSection, setSelectedSection] = useState('Quantitative Ability');

  // Group questions by topic -> subtopic for the selected section
  const groupedByTopic = useMemo(() => {
    const sectionQuestions = allQuestions.filter(q => q.section === selectedSection);
    const grouped: Record<string, Record<string, Question[]>> = {};

    sectionQuestions.forEach(q => {
      const topic = q.topic || 'Uncategorized';
      const subtopic = q.subtopic || 'Uncategorized';

      if (!grouped[topic]) {
        grouped[topic] = {};
      }
      if (!grouped[topic][subtopic]) {
        grouped[topic][subtopic] = [];
      }
      grouped[topic][subtopic].push(q);
    });

    return grouped;
  }, [allQuestions, selectedSection]);

  return (
    <div className="space-y-4">
      {/* Section Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedSection('Quantitative Ability')}
              variant={selectedSection === 'Quantitative Ability' ? 'default' : 'outline'}
            >
              QA
            </Button>
            <Button
              onClick={() => setSelectedSection('Data Interpretation & Logical Reasoning')}
              variant={selectedSection === 'Data Interpretation & Logical Reasoning' ? 'default' : 'outline'}
            >
              DILR
            </Button>
            <Button
              onClick={() => setSelectedSection('Verbal Ability & Reading Comprehension')}
              variant={selectedSection === 'Verbal Ability & Reading Comprehension' ? 'default' : 'outline'}
            >
              VARC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Topic View */}
      <TopicView
        section={selectedSection}
        data={groupedByTopic}
        allQuestions={allQuestions.filter(q => q.section === selectedSection)}
      />
    </div>
  );
}
