'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import ChatClient to avoid SSR issues
const ChatClient = dynamic(() => import('./chat-client').then(m => ({ default: m.ChatClient })), { ssr: false });

export function TutorBubble() {
  const [open, setOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Set isFullScreen default to true on mobile screens when open is toggled to true
  useEffect(() => {
    if (open) {
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      setIsFullScreen(isMobile);
    }
  }, [open]);

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
          className={`fixed z-[100] bg-background flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
            isFullScreen
              ? 'inset-0 w-screen h-dvh max-h-none rounded-none border-0'
              : 'bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-24 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[70vh] sm:max-h-[calc(100dvh-8rem)] rounded-2xl border border-border animate-in slide-in-from-bottom-4 fade-in'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">📕</span>
              <span className="font-bold text-sm">Coach</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(v => !v)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-lg hover:bg-primary-foreground/10"
                title={isFullScreen ? "Minimize" : "Maximize"}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded-lg hover:bg-primary-foreground/10"
                aria-label="Close"
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
      {(!open || !isFullScreen) && (
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
      )}
    </>
  );
}
