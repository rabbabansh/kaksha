import { getAuthSession, getUserProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard-client';
import { BarChart2 } from 'lucide-react';

export default async function InsightsPage() {
    // Bypass auth for debugging
    // const session = await getAuthSession();
    // if (!session) redirect('/login');
    
    // const profile = await getUserProfile();
    // if (profile && !profile.onboardingCompleted) {
    //     redirect('/onboarding');
    // }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart2 className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-extrabold tracking-tight">Command Center</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                    Track your Kaksha Score, complete daily targets, and drill down into your mastery analytics.
                </p>
            </div>
            
            <DashboardClient />
        </div>
    );
}

