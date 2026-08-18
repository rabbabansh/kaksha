'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Lock, CheckCircle2, ShieldAlert, Award, ArrowRight, Play, BookOpen, Clock, BrainCircuit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressRecord {
  section: string;
  topic: string;
  subtopic: string;
  correctCount: number;
  totalQuestions: number;
  masteryLevel: number;
  updatedAt?: string;
}

const QA_PATH = [
  { id: 'Percentage', name: 'Percentage', topic: 'Arithmetic', type: 'node' },
  { id: 'Profit & Loss', name: 'Profit & Loss', topic: 'Arithmetic', type: 'node' },
  { id: 'Simple & Compound Interest', name: 'Simple & Compound Interest', topic: 'Arithmetic', type: 'node' },
  { id: 'Ratio, Proportion & Variation', name: 'Ratio, Proportion & Variation', topic: 'Arithmetic', type: 'node' },
  { id: 'qa-check-1', name: 'Arithmetic Mastery Check', type: 'checkpoint', mockYear: '2024-sectional', mockSlot: 'Slot 1-QA' },
  
  { id: 'Average', name: 'Average', topic: 'Arithmetic', type: 'node' },
  { id: 'Mixture, Alligation, Removal & Replacement', name: 'Mixtures & Alligations', topic: 'Arithmetic', type: 'node' },
  { id: 'Time & Work', name: 'Time & Work', topic: 'Arithmetic', type: 'node' },
  { id: 'Time, Speed & Distance', name: 'TSD', topic: 'Arithmetic', type: 'node' },
  { id: 'qa-check-2', name: 'Advanced Arithmetic Check', type: 'checkpoint', mockYear: '2023-sectional', mockSlot: 'Slot 1-QA' },
  
  { id: 'Simple Equations', name: 'Simple Equations', topic: 'Algebra', type: 'node' },
  { id: 'Quadratic Equations', name: 'Quadratic Equations', topic: 'Algebra', type: 'node' },
  { id: 'Surds & Indices', name: 'Surds & Indices', topic: 'Algebra', type: 'node' },
  { id: 'Logarithms', name: 'Logarithms', topic: 'Algebra', type: 'node' },
  { id: 'qa-check-3', name: 'Algebra Check I', type: 'checkpoint', mockYear: '2022-sectional', mockSlot: 'Slot 1-QA' },
  
  { id: 'Progressions', name: 'Progressions', topic: 'Algebra', type: 'node' },
  { id: 'Inequalities & Modulus', name: 'Inequalities', topic: 'Algebra', type: 'node' },
  { id: 'Functions & Graphs', name: 'Functions', topic: 'Algebra', type: 'node' },
  { id: 'qa-check-4', name: 'Algebra Check II', type: 'checkpoint', mockYear: '2024-sectional', mockSlot: 'Slot 1-QA' }
];

const VARC_PATH = [
  { id: 'Reading Comprehension', name: 'RC Basics', topic: 'Reading Comprehension', type: 'node' },
  { id: 'Vocabulary', name: 'Vocabulary', topic: 'Verbal Ability', type: 'node' },
  { id: 'Grammar, Usage & Correction', name: 'Grammar', topic: 'Verbal Ability', type: 'node' },
  { id: 'varc-check-1', name: 'VARC Foundation Check', type: 'checkpoint', mockYear: '2024-sectional', mockSlot: 'Slot 1-VARC' },
  
  { id: 'Para Jumbles', name: 'Para Jumbles', topic: 'Verbal Ability', type: 'node' },
  { id: 'Para Completion', name: 'Para Completion', topic: 'Verbal Ability', type: 'node' },
  { id: 'Para Summary', name: 'Para Summary', topic: 'Verbal Ability', type: 'node' },
  { id: 'varc-check-2', name: 'Paragraphs Check', type: 'checkpoint', mockYear: '2023-sectional', mockSlot: 'Slot 1-VARC' },
];

const DILR_PATH = [
  { id: 'Tables & Graphs', name: 'Tables & Graphs', topic: 'DI', type: 'node' },
  { id: 'Arrangements', name: 'Arrangements', topic: 'Logical Reasoning', type: 'node' },
  { id: 'Blood Relation', name: 'Blood Relation', topic: 'Logical Reasoning', type: 'node' },
  { id: 'dilr-check-1', name: 'DILR Basics Check', type: 'checkpoint', mockYear: '2024-sectional', mockSlot: 'Slot 1-DILR' },
  
  { id: 'Games & Tournaments', name: 'Games & Tournaments', topic: 'DI', type: 'node' },
  { id: 'Puzzles', name: 'Puzzles', topic: 'Logical Reasoning', type: 'node' },
  { id: 'Selection & Distribution', name: 'Selection', topic: 'Logical Reasoning', type: 'node' },
  { id: 'dilr-check-2', name: 'Advanced DILR Check', type: 'checkpoint', mockYear: '2023-sectional', mockSlot: 'Slot 1-DILR' },
];

const PATHS: Record<string, any[]> = {
  QA: QA_PATH,
  VARC: VARC_PATH,
  DILR: DILR_PATH
};

export function MasterPathsClient({ progressRecords }: { progressRecords: ProgressRecord[] }) {
  const [activeSection, setActiveSection] = useState('VARC');

  const { nodeStates, progressPercent, currentUnlockIndex } = useMemo(() => {
    const states: Record<string, { status: 'locked' | 'unlocked' | 'mastered' | 'cracked', accuracy: number }> = {};
    const path = PATHS[activeSection];
    
    // Process progress records for this section
    let highestMasteredIndex = -1;
    
    path.forEach((node, index) => {
      if (node.type === 'checkpoint') {
         // Checkpoints are unlocked if the previous node is mastered
         states[node.id] = { status: 'locked', accuracy: 0 };
         return;
      }
      
      const record = progressRecords.find(r => r.subtopic === node.id);
      if (!record || record.totalQuestions < 5) { // Arbitrary minimum attempts
        states[node.id] = { status: 'locked', accuracy: 0 };
      } else {
        const acc = Math.round((record.correctCount / record.totalQuestions) * 100);
        
        // Spaced Repetition (Cracked Skills): if mastered but not updated recently (Simulated)
        // For MVP, we'll randomly mark 10% of old mastered skills as cracked to demonstrate the feature.
        const isCracked = acc >= 70 && Math.random() > 0.8 && index < highestMasteredIndex - 2;
        
        if (acc >= 70) {
          states[node.id] = { status: isCracked ? 'cracked' : 'mastered', accuracy: acc };
          highestMasteredIndex = Math.max(highestMasteredIndex, index);
        } else {
          states[node.id] = { status: 'unlocked', accuracy: acc }; // Played but not mastered
        }
      }
    });

    let currentUnlock = highestMasteredIndex + 1;
    
    // Compute unlocks (linear progression)
    path.forEach((node, index) => {
       if (index <= currentUnlock) {
          if (states[node.id]?.status === 'locked' || node.type === 'checkpoint') {
             states[node.id] = { status: 'unlocked', accuracy: states[node.id]?.accuracy || 0 };
          }
       }
     });
    
    // Overall completion %
    const masteredCount = path.filter(n => states[n.id]?.status === 'mastered').length;
    const pct = Math.round((masteredCount / path.length) * 100);
    
    return { nodeStates: states, progressPercent: pct, currentUnlockIndex: currentUnlock };
  }, [activeSection, progressRecords]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-2 bg-muted p-1 rounded-xl w-fit mx-auto mb-10 shadow-sm border border-border/50">
         {['VARC', 'DILR', 'QA'].map(sec => (
            <Button 
               key={sec} 
               variant={activeSection === sec ? 'default' : 'ghost'} 
               className="rounded-lg px-8 font-bold"
               onClick={() => setActiveSection(sec)}
            >
               {sec} Path
            </Button>
         ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
         <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
               <Award className="h-6 w-6 text-primary" /> {activeSection} Master Path
            </h2>
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-muted-foreground">{progressPercent}% Mastered</span>
               <Progress value={progressPercent} className="w-32 h-3" />
            </div>
         </div>

         <div className="relative py-12 flex flex-col items-center">
            {/* The SVG Path Line connecting nodes */}
            <div className="absolute top-0 bottom-0 w-3 bg-primary/10 rounded-full left-1/2 -translate-x-1/2 -z-10 shadow-inner" />

            <div className="space-y-16 w-full">
               {PATHS[activeSection].map((node, i) => {
                  const state = nodeStates[node.id];
                  const isLocked = state?.status === 'locked';
                  const isMastered = state?.status === 'mastered';
                  const isCracked = state?.status === 'cracked';
                  const isCurrent = i === currentUnlockIndex;
                  
                  // Zig-zag offset
                  const offset = i % 2 === 0 ? '-translate-x-16' : 'translate-x-16';
                  
                  if (node.type === 'checkpoint') {
                     return (
                        <div key={node.id} className="flex justify-center items-center w-full relative group">
                           <Card className={`w-72 border-2 ${isLocked ? 'border-muted bg-muted/50 opacity-60' : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-xl scale-105 transition-transform'}`}>
                              <CardContent className="p-5 text-center">
                                 <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-3 shadow-inner">
                                    {isLocked ? <Lock className="h-6 w-6 text-muted-foreground" /> : <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                                 </div>
                                 <h3 className="font-extrabold text-base mb-1">{node.name}</h3>
                                 <p className="text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-wider">Sectional Checkpoint</p>
                                 <Button variant={isLocked ? 'outline' : 'default'} size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold h-10" disabled={isLocked} asChild={!isLocked}>
                                    {!isLocked ? (
                                       <Link href={`/mocks/${node.mockYear}/${node.mockSlot}`}>
                                          Take Sectional <ArrowRight className="ml-2 h-4 w-4" />
                                       </Link>
                                    ) : (
                                       <span>Locked</span>
                                    )}
                                 </Button>
                              </CardContent>
                           </Card>
                        </div>
                     );
                  }

                  return (
                     <div key={node.id} className={`flex justify-center w-full relative transition-transform duration-300 ${isCurrent ? 'scale-110 z-10' : ''}`}>
                        <Link href={isLocked ? '#' : `/practice/modules/${encodeURIComponent(node.id)}`} className={`relative ${offset}`}>
                           {/* Outer ring */}
                           <div className={`w-28 h-28 rounded-full flex items-center justify-center p-2 border-4 ${
                              isMastered ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 
                              isCracked ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse' :
                              isLocked ? 'border-muted bg-muted/30 opacity-50' : 
                              'border-primary bg-primary/10 shadow-[0_0_25px_rgba(99,102,241,0.5)]'
                           }`}>
                              {/* Inner node */}
                              <div className={`w-full h-full rounded-full flex items-center justify-center text-white shadow-inner ${
                                 isMastered ? 'bg-gradient-to-br from-green-400 to-green-600' : 
                                 isCracked ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                 isLocked ? 'bg-muted-foreground' : 
                                 'bg-gradient-to-br from-primary to-indigo-600'
                              }`}>
                                 {isMastered && <CheckCircle2 className="h-10 w-10 drop-shadow-md" />}
                                 {isCracked && <ShieldAlert className="h-10 w-10 drop-shadow-md" />}
                                 {isLocked && <Lock className="h-10 w-10 drop-shadow-md" />}
                                 {!isMastered && !isCracked && !isLocked && <Star className="h-10 w-10 fill-current drop-shadow-md" />}
                              </div>
                           </div>
                           
                           {/* Floating Label */}
                           <div className={`absolute top-1/2 -translate-y-1/2 ${i % 2 === 0 ? 'left-full ml-6' : 'right-full mr-6 text-right'} w-56`}>
                              <Badge variant="outline" className="mb-2 text-[10px] uppercase font-bold tracking-wider bg-background/90 backdrop-blur-md border-primary/20 shadow-sm">{node.topic}</Badge>
                              <h4 className={`font-extrabold text-base leading-tight ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{node.name}</h4>
                              {!isLocked && state && state.accuracy > 0 && (
                                 <p className="text-sm font-bold text-primary/90 mt-1">
                                    {state.accuracy}% Accuracy
                                 </p>
                              )}
                              {isCracked && (
                                 <p className={`text-sm font-black text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1 ${i % 2 !== 0 ? 'justify-end' : ''}`}><ShieldAlert className="h-4 w-4" /> Needs Review!</p>
                              )}
                           </div>
                        </Link>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
}
