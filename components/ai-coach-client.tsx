/* eslint-disable */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Target, ListTodo, BookOpen, PenTool, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AiPlanData {
    summary: string;
    strengths: { topic: string; reason: string }[];
    focusAreas: { topic: string; tips: string[] }[];
    actionItems: { task: string; type: string }[];
}
// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiCoachClient() {
    const [planData, setPlanData] = useState<AiPlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlan = useCallback((forceRefresh = false) => {
        setLoading(true);
        setError(null);
        fetch(`/api/progress/ai-analysis${forceRefresh ? '?force=true' : ''}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data?.analysis) {
                    try {
                        const parsed = JSON.parse(data.data.analysis);
                        setPlanData(parsed);
                    } catch (e) {
                        // If parsing fails, it might be legacy markdown. Force refresh once.
                        if (!forceRefresh) {
                            fetchPlan(true);
                        } else {
                            setError('Failed to parse AI plan format.');
                        }
                    }
                } else {
                    setError('Failed to generate plan. Please try again.');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Error connecting to AI Coach.');
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchPlan(false);
    }, []);

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading && !planData) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-24 rounded-xl bg-muted/60 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-40 rounded-xl bg-muted/60" />
                    <div className="h-40 rounded-xl bg-muted/60" />
                </div>
            </div>
        );
    }

    if (error && !planData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" onClick={() => fetchPlan(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    if (!planData) return null;

    const getActionIcon = (type: string) => {
        if (type.toLowerCase().includes('mock')) return <Target className="h-4 w-4 text-blue-500" />;
        if (type.toLowerCase().includes('practice')) return <PenTool className="h-4 w-4 text-orange-500" />;
        return <BookOpen className="h-4 w-4 text-green-500" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            
            {/* Header & Summary */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background border p-8 shadow-sm group">
                <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/10 blur-3xl rounded-full transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" /> AI Coach Strategy
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                            Your Personalised Roadmap
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                            {planData.summary}
                        </p>
                    </div>
                    <Button 
                        variant="default" 
                        onClick={() => fetchPlan(true)} 
                        disabled={loading} 
                        className="shrink-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full px-6"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Strategy
                    </Button>
                </div>
            </div>

            {/* Strengths & Focus Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Strengths Card */}
                <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 opacity-80" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-semibold tracking-tight">Key Strengths</h4>
                    </div>
                    <div className="space-y-5">
                        {planData.strengths?.map((s, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                                <div>
                                    <p className="font-semibold text-sm text-foreground mb-1">{s.topic}</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{s.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Focus Areas Card */}
                <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 opacity-80" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-semibold tracking-tight">Critical Focus Areas</h4>
                    </div>
                    <div className="space-y-5">
                        {planData.focusAreas?.map((f, i) => (
                            <div key={i} className="space-y-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                                <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                                    {f.topic}
                                </p>
                                <ul className="space-y-1.5 pl-4">
                                    {f.tips?.map((tip, j) => (
                                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold tracking-tight">Your Action Plan for This Week</h4>
                        <p className="text-sm text-muted-foreground">Complete these items to maximize your score growth.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {planData.actionItems?.map((item, i) => (
                        <div 
                            key={i} 
                            className="group flex items-start gap-4 rounded-xl border border-muted bg-muted/20 p-4 transition-all hover:bg-muted/40 hover:border-primary/30"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm border group-hover:scale-110 transition-transform">
                                {getActionIcon(item.type)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground leading-relaxed mb-2">{item.task}</p>
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-background/80 shadow-sm">
                                    {item.type}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
