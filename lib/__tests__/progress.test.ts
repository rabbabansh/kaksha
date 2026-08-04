import { describe, it, expect } from 'vitest';
import {
  calculateSubtopicPercentage,
  calculateTopicPercentage,
  calculateSectionPercentage,
  calculateKakshaScore,
  SubtopicProgress,
  TopicProgress,
  SectionProgress
} from '../progress';

describe('progress calculations', () => {
  describe('calculateSubtopicPercentage', () => {
    it('calculates correct percentage', () => {
      expect(calculateSubtopicPercentage(8, 10)).toBe(80);
      expect(calculateSubtopicPercentage(1, 3)).toBe(33); // Math.round(33.333...)
    });

    it('returns 0 if totalQuestions is 0 to prevent division by zero', () => {
      expect(calculateSubtopicPercentage(0, 0)).toBe(0);
    });
  });

  describe('calculateTopicPercentage', () => {
    it('calculates average of subtopic percentages', () => {
      const subtopics: SubtopicProgress[] = [
        { section: 'S', topic: 'T', subtopic: 'ST1', totalQuestions: 10, correctCount: 8, percentage: 80 },
        { section: 'S', topic: 'T', subtopic: 'ST2', totalQuestions: 10, correctCount: 6, percentage: 60 },
      ];
      expect(calculateTopicPercentage(subtopics)).toBe(70);
    });

    it('returns 0 for empty subtopics', () => {
      expect(calculateTopicPercentage([])).toBe(0);
    });
  });

  describe('calculateSectionPercentage', () => {
    it('calculates average of topic percentages', () => {
      const topics: TopicProgress[] = [
        { section: 'S', topic: 'T1', subtopics: [], percentage: 90 },
        { section: 'S', topic: 'T2', subtopics: [], percentage: 50 },
      ];
      expect(calculateSectionPercentage(topics)).toBe(70);
    });

    it('returns 0 for empty topics', () => {
      expect(calculateSectionPercentage([])).toBe(0);
    });
  });

  describe('calculateKakshaScore', () => {
    it('calculates average of section percentages', () => {
      const sections: SectionProgress[] = [
        { section: 'QA', topics: [], percentage: 80 },
        { section: 'VARC', topics: [], percentage: 60 },
        { section: 'DILR', topics: [], percentage: 100 },
      ];
      expect(calculateKakshaScore(sections)).toBe(80);
    });

    it('returns 0 for empty sections', () => {
      expect(calculateKakshaScore([])).toBe(0);
    });
  });
});
