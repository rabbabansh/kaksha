/* eslint-disable */
'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardChartsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hierarchy: any;
  totalRawAttempts: number;
  totalRawCorrect: number;
  totalRawWrong: number;
}

export function DashboardCharts({ hierarchy, totalRawAttempts, totalRawCorrect, totalRawWrong }: DashboardChartsProps) {
  const [level, setLevel] = useState<'section' | 'topic' | 'subtopic'>('section');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Derive current data for the chart based on drill-down level
  let chartData: any[] = [];
  let title = 'Overall Performance by Section';
  let activeStats = {
    attempts: totalRawAttempts,
    correct: totalRawCorrect,
    wrong: totalRawWrong
  };

  const calculateNetScore = (correct: number, wrong: number, attempts: number) => {
    if (attempts === 0) return 0;
    return Math.round(((correct - wrong) / attempts) * 100);
  };

  if (level === 'section') {
    chartData = Object.values(hierarchy).map((s: any) => ({
      name: s.name,
      score: s.score,
      netScore: calculateNetScore(s.rawCorrect || 0, s.rawWrong || 0, s.rawAttempts || 0),
      rawAttempts: s.rawAttempts || 0,
      rawCorrect: s.rawCorrect || 0,
      rawWrong: s.rawWrong || 0
    }));
  } else if (level === 'topic' && activeSection) {
    title = `${activeSection} > Topics`;
    const sec = hierarchy[activeSection];
    if (sec) {
      activeStats = {
        attempts: sec.rawAttempts || 0,
        correct: sec.rawCorrect || 0,
        wrong: sec.rawWrong || 0
      };
      if (sec.topics) {
        chartData = Object.values(sec.topics).map((t: any) => ({
          name: t.name,
          score: t.score,
          netScore: calculateNetScore(t.rawCorrect || 0, t.rawWrong || 0, t.rawAttempts || 0),
          rawAttempts: t.rawAttempts || 0,
          rawCorrect: t.rawCorrect || 0,
          rawWrong: t.rawWrong || 0
        }));
      }
    }
  } else if (level === 'subtopic' && activeSection && activeTopic) {
    title = `${activeSection} > ${activeTopic} > Subtopics`;
    const top = hierarchy[activeSection]?.topics?.[activeTopic];
    if (top) {
      activeStats = {
        attempts: top.rawAttempts || 0,
        correct: top.rawCorrect || 0,
        wrong: top.rawWrong || 0
      };
      if (top.subtopics) {
        chartData = Object.values(top.subtopics).map((st: any) => ({
          name: st.name,
          score: st.score,
          netScore: calculateNetScore(st.rawCorrect || 0, st.rawWrong || 0, st.rawAttempts || 0),
          rawAttempts: st.rawAttempts || 0,
          rawCorrect: st.rawCorrect || 0,
          rawWrong: st.rawWrong || 0
        }));
      }
    }
  }

  // Sort descending by netScore for better visualization
  chartData.sort((a, b) => b.netScore - a.netScore);

  const handleBarClick = (data: any) => {
    if (level === 'section') {
      setActiveSection(data.name);
      setLevel('topic');
    } else if (level === 'topic') {
      setActiveTopic(data.name);
      setLevel('subtopic');
    }
  };

  const handleBack = () => {
    if (level === 'subtopic') {
      setLevel('topic');
      setActiveTopic(null);
    } else if (level === 'topic') {
      setLevel('section');
      setActiveSection(null);
    }
  };

  // Custom coloring based on netScore
  const getColor = (netScore: number) => {
    if (netScore >= 20) return '#22c55e'; // Green
    if (netScore >= -10) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  if (Object.keys(hierarchy).length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
        <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
        <p>No practice data available yet.</p>
        <p className="text-sm">Start practicing to generate your analytics!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {level !== 'section' && (
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      </div>
      
      {/* Dynamic Raw Stats Bar */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg text-sm border">
        <div className="flex flex-col">
          <span className="text-muted-foreground uppercase text-xs font-semibold tracking-wider">Total Attempts</span>
          <span className="font-bold text-lg">{activeStats.attempts}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground uppercase text-xs font-semibold tracking-wider">Correct</span>
          <span className="font-bold text-lg text-green-600 dark:text-green-400">{activeStats.correct}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground uppercase text-xs font-semibold tracking-wider">Incorrect</span>
          <span className="font-bold text-lg text-red-600 dark:text-red-400">{activeStats.wrong}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground uppercase text-xs font-semibold tracking-wider">Accuracy</span>
          <span className="font-bold text-lg">
            {activeStats.attempts > 0 ? Math.round((activeStats.correct / activeStats.attempts) * 100) : 0}%
          </span>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                handleBarClick(e.activePayload[0].payload);
              }
            }}
          >
            <XAxis type="number" domain={[-100, 100]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">Net Score: <span className={data.netScore < 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{data.netScore > 0 ? '+' : ''}{data.netScore}</span></p>
                      <p className="text-xs text-muted-foreground">Mastery: {data.score}%</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-2 border-t pt-2">
                        <span>Att: {data.rawAttempts || 0}</span>
                        <span className="text-green-600 dark:text-green-400">✔ {data.rawCorrect || 0}</span>
                        <span className="text-red-600 dark:text-red-400">✖ {data.rawWrong || 0}</span>
                      </div>
                      {level !== 'subtopic' && (
                        <p className="text-xs text-primary mt-2 font-medium">Click to drill down</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="netScore" 
              radius={[4, 4, 4, 4]}
              barSize={32}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={(data) => handleBarClick(data)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.netScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {level === 'section' && (
        <p className="text-xs text-muted-foreground text-center mt-4 italic">
          Tip: Click on a bar to see a detailed breakdown by topic.
        </p>
      )}
    </div>
  );
}
