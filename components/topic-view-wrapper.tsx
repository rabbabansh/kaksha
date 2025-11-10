'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TopicView } from './topic-view';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface TopicViewWrapperProps {
  allQuestions: Question[];
}

export function TopicViewWrapper({ allQuestions }: TopicViewWrapperProps) {
  const [selectedSection, setSelectedSection] = useState('Quantitative Ability');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter questions by search query first
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return allQuestions;
    }

    const query = searchQuery.toLowerCase().trim();
    return allQuestions.filter(q => {
      const questionText = (q.question_html || '').toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const subtopic = (q.subtopic || '').toLowerCase();
      const source = (q.source || '').toLowerCase();
      
      return (
        questionText.includes(query) ||
        topic.includes(query) ||
        subtopic.includes(query) ||
        source.includes(query)
      );
    });
  }, [allQuestions, searchQuery]);

  // Group questions by topic -> subtopic for the selected section
  const groupedByTopic = useMemo(() => {
    const sectionQuestions = filteredQuestions.filter(q => q.section === selectedSection);
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
  }, [filteredQuestions, selectedSection]);

  const sectionQuestions = filteredQuestions.filter(q => q.section === selectedSection);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search questions, topics, or subtopics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {sectionQuestions.length} result{sectionQuestions.length !== 1 ? 's' : ''} in {selectedSection}
            </p>
          )}
        </CardContent>
      </Card>

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
        data={groupedByTopic}
        allQuestions={sectionQuestions}
      />
    </div>
  );
}
