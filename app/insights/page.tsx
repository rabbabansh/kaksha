import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AiCoachClient } from '@/components/ai-coach-client';
import { Sparkles } from 'lucide-react';

export default async function InsightsPage() {
    const session = await getAuthSession();
    if (!session) redirect('/login');

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
                </div>
                <p className="text-muted-foreground text-sm">
                    Personalised strength analysis, weakness breakdown, and a preparation roadmap.
                </p>
            </div>
            <AiCoachClient />
        </div>
    );
}
