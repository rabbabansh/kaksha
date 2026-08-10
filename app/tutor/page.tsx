import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/auth';
import { ChatClient } from '@/components/chat-client';
import { Sparkles } from 'lucide-react';

export default async function ChatPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  const profile = await getUserProfile();
  if (profile && !profile.onboardingCompleted) {
      redirect('/onboarding');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto pt-4 pb-2 px-4 sm:px-6">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="h-10 w-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-xl border border-indigo-500/20 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Kaksha AI Tutor</h1>
          <p className="text-xs text-muted-foreground font-medium">Your personal 24/7 CAT prep companion</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden rounded-2xl shadow-sm border border-border/60 bg-card">
        <ChatClient userName={session.user?.name || 'there'} />
      </div>
    </div>
  );
}
