import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, BookOpen, Layers } from 'lucide-react';

interface SubtopicsExplorerModalProps {
  children: React.ReactNode;
  hierarchy: any; // Passed from dashboard API
  title?: string;
  defaultSection?: string;
}

export function SubtopicsExplorerModal({ children, hierarchy, title = "Master Paths Explorer", defaultSection }: SubtopicsExplorerModalProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ [defaultSection || 'QA']: true });
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTopic = (topic: string) => {
    setOpenTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  // Helper to determine Grade from percentage (A-F)
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <DialogHeader className="px-6 py-4 border-b bg-white dark:bg-zinc-900 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Layers className="h-5 w-5 text-indigo-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.entries(hierarchy || {}).map(([sectionName, sectionData]: [string, any]) => {
            const isSectionOpen = openSections[sectionName];
            
            return (
              <div key={sectionName} className="border bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleSection(sectionName)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isSectionOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    <h3 className="font-bold text-lg">{sectionName}</h3>
                  </div>
                  <Badge variant="outline" className="font-semibold bg-white dark:bg-zinc-900">
                    {sectionData.percentage?.toFixed(0)}% Complete
                  </Badge>
                </button>
                
                {isSectionOpen && (
                  <div className="p-4 space-y-3 bg-white dark:bg-zinc-900">
                    {Object.entries(sectionData.topics || {}).map(([topicName, topicData]: [string, any]) => {
                      const isTopicOpen = openTopics[`${sectionName}-${topicName}`];
                      // Topic score is usually 0-10 based on percentage
                      const topicScore = ((topicData.percentage || 0) / 10).toFixed(1);

                      return (
                        <div key={topicName} className="border border-indigo-50/50 rounded-lg overflow-hidden">
                          <button 
                            onClick={() => toggleTopic(`${sectionName}-${topicName}`)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isTopicOpen ? <ChevronDown className="h-4 w-4 text-indigo-400" /> : <ChevronRight className="h-4 w-4 text-indigo-400" />}
                              <span className="font-semibold text-indigo-900 dark:text-indigo-300">{topicName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider">Score</span>
                              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">{topicScore}/10</Badge>
                            </div>
                          </button>

                          {isTopicOpen && (
                            <div className="bg-white dark:bg-zinc-950 border-t border-indigo-50">
                              {Object.entries(topicData.subtopics || {}).map(([subtopicName, subtopicData]: [string, any]) => {
                                const percentage = subtopicData.percentage || 0;
                                const grade = getGrade(percentage);
                                const isAttempted = subtopicData.totalQuestions > 0;

                                return (
                                  <div key={subtopicName} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-b last:border-0 transition-colors group">
                                    <div className="flex items-center gap-3">
                                      <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">{subtopicName}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                                      <Badge variant={isAttempted ? (grade === 'A' || grade === 'B' ? 'default' : 'secondary') : 'outline'} className={`w-8 justify-center font-bold ${grade === 'A' ? 'bg-green-500 text-white' : grade === 'F' && isAttempted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}`}>
                                        {isAttempted ? grade : '-'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
