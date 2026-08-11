'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import ChatClient to avoid SSR issues
const ChatClient = dynamic(() => import('./chat-client').then(m => ({ default: m.ChatClient })), { ssr: false });

export function TutorBubble() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Hide on pages where it doesn't make sense
  const hiddenPaths = ['/', '/login', '/onboarding', '/diagnostic'];
  const segments = pathname?.split('/').filter(Boolean) || [];
  const isTestPage = pathname?.startsWith('/mocks/') && segments.length === 3;
  if (hiddenPaths.includes(pathname || '') || isTestPage) return null;
  if (!session) return null;

  const userName = session.user?.name?.split(' ')[0] || 'there';

  return (
    <>
      {/* Floating Chat Window */}
      {open && (
        <div
          ref={bubbleRef}
          className="fixed bottom-20 right-4 z-[100] w-[340px] sm:w-[380px] h-[520px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
          style={{ maxHeight: 'calc(100dvh - 6rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">📕</span>
              <span className="font-bold text-sm">Kaksha Guru</span>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/tutor" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-hidden">
            <ChatClient userName={userName} compact />
          </div>
        </div>
      )}

      {/* Floating Bubble Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-20 right-4 z-[100] h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-muted text-muted-foreground scale-95 border border-border'
            : 'bg-primary text-primary-foreground hover:scale-110 hover:shadow-primary/30'
        } sm:bottom-6`}
        aria-label="Open Tutor AI"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <span className="text-2xl">📕</span>
        )}
      </button>
    </>
  );
}
