'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, UserPlus, BookOpen, Wifi, WifiOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type FeedEvent = {
  type: 'attempt' | 'signup' | 'session_complete' | 'connected' | 'heartbeat';
  ts?: string;
  user?: { name?: string | null; email?: string | null };
  topic?: string;
  subtopic?: string;
  section?: string;
  isCorrect?: boolean;
  source?: string;
  sessionType?: string;
  correct?: number;
  incorrect?: number;
  total?: number;
};

function EventRow({ event }: { event: FeedEvent & { id: string } }) {
  const time = event.ts ? new Date(event.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const userName = event.user?.name || event.user?.email?.split('@')[0] || 'Unknown';
  const userEmail = event.user?.email || '';

  if (event.type === 'attempt') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0 group">
        <div className={`mt-0.5 shrink-0 ${event.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {event.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{userName}</span>
            <span className="text-muted-foreground text-xs ml-1">({userEmail})</span>
            {' '}
            <span className={event.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {event.isCorrect ? 'answered correctly' : 'got wrong'}
            </span>
            {event.subtopic && <> · <span className="text-muted-foreground">{event.subtopic}</span></>}
            {event.section && <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{event.section}</span>}
          </p>
          {event.source && <p className="text-xs text-muted-foreground/60 mt-0.5">via {event.source}</p>}
        </div>
        <span className="text-xs text-muted-foreground/50 shrink-0">{time}</span>
      </div>
    );
  }

  if (event.type === 'signup') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
        <div className="mt-0.5 shrink-0 text-blue-500">
          <UserPlus className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <span className="font-semibold text-blue-600 dark:text-blue-400">New user signed up</span>
            {' · '}
            <span className="font-semibold">{userName}</span>
            <span className="text-muted-foreground text-xs ml-1">({userEmail})</span>
          </p>
        </div>
        <span className="text-xs text-muted-foreground/50 shrink-0">{time}</span>
      </div>
    );
  }

  if (event.type === 'session_complete') {
    const label = event.sessionType === 'DIAGNOSTIC' ? 'completed diagnostic' :
      event.sessionType === 'MOCK' ? 'finished a mock test' : 'completed a session';
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
        <div className="mt-0.5 shrink-0 text-purple-500">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <span className="font-semibold">{userName}</span>
            <span className="text-muted-foreground text-xs ml-1">({userEmail})</span>
            {' '}
            <span className="text-purple-600 dark:text-purple-400">{label}</span>
            {event.total != null && (
              <span className="text-muted-foreground ml-1">
                · {event.correct}/{event.total} correct
              </span>
            )}
          </p>
        </div>
        <span className="text-xs text-muted-foreground/50 shrink-0">{time}</span>
      </div>
    );
  }

  return null;
}

export function AdminLiveFeed() {
  const [events, setEvents] = useState<(FeedEvent & { id: string })[]>([]);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    const es = new EventSource('/api/admin/live-feed');
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const data: FeedEvent = JSON.parse(e.data);
        if (data.type === 'heartbeat' || data.type === 'connected') return;

        const id = `${Date.now()}-${counterRef.current++}`;
        setEvents((prev) => [{ ...data, id }, ...prev].slice(0, 200)); // keep latest 200
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Live Activity Feed</span>
          {events.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {events.length} events
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-500' : 'text-muted-foreground'}`}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      <ScrollArea className="h-[480px]" ref={scrollRef}>
        <div className="px-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Wifi className="h-8 w-8 opacity-30 animate-pulse" />
              <p className="text-sm">Waiting for activity...</p>
              <p className="text-xs opacity-60">Events will appear here in real time</p>
            </div>
          ) : (
            events.map((event) => <EventRow key={event.id} event={event} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
