import { getAuthSession, getUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AiCoachClient } from '@/components/ai-coach-client';
import { DashboardClient } from '@/components/dashboard-client';
import { Sparkles, BarChart2 } from 'lucide-react';

export default async function InsightsPage() {
    const session = await getAuthSession();
    if (!session) redirect('/login');
    
    const profile = await getUserProfile();
    if (profile && !profile.onboardingCompleted) {
        redirect('/onboarding');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart2 className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                    Track your Kaksha Score and drill down into your section mastery.
                </p>
            </div>
            
            <DashboardClient />

            <div className="mt-16 mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-2xl font-bold tracking-tight">AI Coach</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    Personalised strength analysis, weakness breakdown, and a preparation roadmap.
                </p>
            </div>
            <AiCoachClient />
        </div>
    );
}
