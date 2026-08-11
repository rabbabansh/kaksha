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
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-4rem)] max-w-5xl mx-auto md:pt-4 md:pb-2 md:px-4 lg:px-6">
      <div className="hidden md:flex items-center gap-3 mb-4 px-2">
        <div className="h-10 w-10 bg-indigo-500/10 text-xl flex items-center justify-center rounded-xl border border-indigo-500/20 shadow-sm">
          📕
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Coach</h1>
          <p className="text-xs text-muted-foreground font-medium">Your personal 24/7 CAT prep companion</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden md:rounded-2xl shadow-none md:shadow-sm border-0 md:border md:border-border/60 bg-background md:bg-card">
        <ChatClient userName={session.user?.name || 'there'} />
      </div>
    </div>
  );
}
