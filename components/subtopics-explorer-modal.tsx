'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Layers } from 'lucide-react';
import { CompetencyMatrix } from './competency-matrix';

interface SubtopicsExplorerModalProps {
  children: React.ReactNode;
  hierarchy: any; // Passed from dashboard API
  title?: string;
}

export function SubtopicsExplorerModal({ children, hierarchy, title = "Skill Hierarchy Matrix" }: SubtopicsExplorerModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[100vw] w-screen h-dvh max-h-none rounded-none border-0 p-0 flex flex-col bg-background overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-card">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground">
            <Layers className="h-5 w-5 text-indigo-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          <div className="max-w-6xl mx-auto">
            <CompetencyMatrix hierarchy={hierarchy} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
