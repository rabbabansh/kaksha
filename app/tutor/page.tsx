import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/auth';
import { ChatClient } from '@/components/chat-client';

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Chat Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about CAT preparation, concepts, or get help with practice problems
        </p>
      </div>
      <ChatClient />
    </div>
  );
}


