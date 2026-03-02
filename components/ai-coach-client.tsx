'use client';

import { useState, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Matches the site's black/white/gray palette; no custom colours.
const mdComponents: Components = {
    h2: ({ children }) => (
        <h2 className="mt-8 first:mt-0 mb-3 text-base font-bold tracking-tight text-foreground border-b border-border pb-1.5 flex items-center gap-2">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">{children}</h3>
    ),
    p: ({ children }) => (
        <p className="mb-3 text-sm leading-relaxed text-foreground/80">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-4 space-y-2 pl-1">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-4 space-y-2 pl-1 list-decimal list-inside">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="flex gap-2.5 items-start text-sm leading-relaxed text-foreground/80">
            <span className="mt-2 shrink-0 h-1.5 w-1.5 rounded-full bg-foreground/40" />
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-foreground/70">{children}</em>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-border pl-4 my-3 text-sm text-foreground/60 italic">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-5 border-border" />,
    code: ({ children }) => (
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{children}</code>
    ),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiCoachClient() {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/progress/ai-analysis');
            if (!res.ok) throw new Error('Failed to fetch analysis');
            const payload = await res.json();
            if (payload.success && payload.data?.analysis) {
                setAnalysis(payload.data.analysis);
            } else {
                throw new Error(payload.error || 'Unknown error');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Empty state ────────────────────────────────────────────────────────────
    if (!analysis && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-5 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg">
                    <Sparkles className="h-7 w-7" />
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-1.5">Your Personal AI Coach</h2>
                    <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                        Analyses your test scores, correct and incorrect questions, and topic accuracy to build a personalised strength report and preparation roadmap.
                    </p>
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}. Please try again.</span>
                    </div>
                )}
                <Button size="default" onClick={generate} className="gap-2 px-6">
                    <Sparkles className="h-4 w-4" />
                    Generate My Analysis
                </Button>
            </div>
        );
    }

    // ── Loading skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-5 rounded-md bg-muted w-1/3" />
                <div className="h-3.5 rounded-md bg-muted w-full" />
                <div className="h-3.5 rounded-md bg-muted w-5/6" />
                <div className="h-3.5 rounded-md bg-muted w-2/3" />
                <div className="mt-6 h-5 rounded-md bg-muted w-1/4" />
                <div className="h-3.5 rounded-md bg-muted w-full" />
                <div className="h-3.5 rounded-md bg-muted w-11/12" />
                <div className="h-3.5 rounded-md bg-muted w-4/5" />
                <div className="mt-6 h-5 rounded-md bg-muted w-1/4" />
                <div className="h-3.5 rounded-md bg-muted w-full" />
                <div className="h-3.5 rounded-md bg-muted w-3/4" />
                <p className="text-xs text-muted-foreground text-center pt-4">Analysing your performance…</p>
            </div>
        );
    }

    // ── Analysis view ─────────────────────────────────────────────────────────
    return (
        <div>
            {/* Refresh button */}
            <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={generate} className="gap-1.5 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh Analysis
                </Button>
            </div>

            {/* Rendered markdown */}
            <div className="prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {analysis!}
                </ReactMarkdown>
            </div>

            {/* Footer note */}
            <p className="mt-8 text-xs text-muted-foreground border-t border-border pt-4">
                Analysis is based on your completed tests and chat practice. The more you attempt, the more precise the coaching.
            </p>
        </div>
    );
}
