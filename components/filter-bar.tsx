'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;

  // Sections
  sections?: string[];
  selectedSection?: string;
  onSectionChange?: (val: string) => void;

  // Topics
  topics?: string[];
  selectedTopic?: string;
  onTopicChange?: (val: string) => void;

  // Subtopics
  subtopics?: string[];
  selectedSubtopic?: string;
  onSubtopicChange?: (val: string) => void;

  // Status
  showStatus?: boolean;
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;

  // Clear
  onClear?: () => void;
}

export function FilterBar({
  searchQuery = '',
  onSearchChange,
  showSearch = true,
  sections = [],
  selectedSection = 'all',
  onSectionChange,
  topics = [],
  selectedTopic = 'all',
  onTopicChange,
  subtopics = [],
  selectedSubtopic = 'all',
  onSubtopicChange,
  showStatus = false,
  selectedStatus = 'all',
  onStatusChange,
  onClear
}: FilterBarProps) {
  return (
    <div className="flex-1 flex flex-wrap gap-3 items-center justify-end">
      {showSearch && onSearchChange && (
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}

      {sections.length > 0 && onSectionChange && (
        <Select value={selectedSection} onValueChange={onSectionChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {topics.length > 0 && onTopicChange && (
        <Select value={selectedTopic} onValueChange={onTopicChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {subtopics.length > 0 && onSubtopicChange && (
        <Select value={selectedSubtopic} onValueChange={onSubtopicChange}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Subtopic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subtopics</SelectItem>
            {subtopics.map((st) => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatus && onStatusChange && (
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="unattempted">Unattempted</SelectItem>
            <SelectItem value="attempted">Attempted</SelectItem>
            <SelectItem value="correct">Correctly Answered</SelectItem>
            <SelectItem value="incorrect">Incorrectly Answered</SelectItem>
          </SelectContent>
        </Select>
      )}

      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
