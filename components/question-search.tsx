'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Question = any;

interface QuestionSearchProps {
  allQuestions: Question[];
  onResultsChange: (results: Question[]) => void;
  placeholder?: string;
}

export function QuestionSearch({ allQuestions, onResultsChange, placeholder = "Search questions, topics, or subtopics..." }: QuestionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      onResultsChange(allQuestions);
      return allQuestions;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = allQuestions.filter(q => {
      // Search in question HTML content (simplified text matching)
      const questionText = (q.question_html || '').toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const subtopic = (q.subtopic || '').toLowerCase();
      const source = (q.source || '').toLowerCase();
      const section = (q.section || '').toLowerCase();
      
      return (
        questionText.includes(query) ||
        topic.includes(query) ||
        subtopic.includes(query) ||
        source.includes(query) ||
        section.includes(query)
      );
    });

    onResultsChange(results);
    return results;
  }, [searchQuery, allQuestions, onResultsChange]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Search</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
