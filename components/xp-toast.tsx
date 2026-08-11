'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface XPToastProps {
  xpGained: number;
  newBadges?: string[];
  onDismiss?: () => void;
}

export function XPToast({ xpGained, newBadges = [], onDismiss }: XPToastProps) {
  const [visible, setVisible] = useState(true);
  const [badgeIndex, setBadgeIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Cycle through badges every 1.5s if multiple
  useEffect(() => {
    if (newBadges.length <= 1) return;
    const interval = setInterval(() => {
      setBadgeIndex(i => (i + 1) % newBadges.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [newBadges]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none animate-in slide-in-from-top-4 fade-in duration-500">
      {/* XP Pill */}
      {xpGained > 0 && (
        <div className="flex items-center gap-2 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 font-black text-lg px-5 py-2.5 rounded-full shadow-lg shadow-yellow-400/30 border-2 border-yellow-300 dark:border-yellow-600 animate-bounce">
          <Star className="h-5 w-5 fill-yellow-700" />
          +{xpGained} XP
        </div>
      )}

      {/* Badge earned pill(s) */}
      {newBadges.length > 0 && (
        <div className="flex items-center gap-2 bg-indigo-600 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg shadow-indigo-600/30 border-2 border-indigo-400 animate-in fade-in zoom-in duration-300">
          🏅 New Badge: {newBadges[badgeIndex]}!
          {newBadges.length > 1 && (
            <span className="text-indigo-300 text-xs">({badgeIndex + 1}/{newBadges.length})</span>
          )}
        </div>
      )}
    </div>
  );
}
