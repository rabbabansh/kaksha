'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2 } from 'lucide-react';

export interface BadgeDef {
  id: string;
  emoji: string;
  label: string;
  description: string;
  howToEarn: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const ALL_BADGES: BadgeDef[] = [
  // Activity
  { id: 'First Step', emoji: '👣', label: 'First Step', description: 'You started your CAT journey!', howToEarn: 'Attempt your very first question.', category: 'Activity', tier: 'bronze' },
  { id: 'Novice', emoji: '📖', label: 'Novice', description: 'A budding scholar in the making.', howToEarn: 'Attempt 10 questions.', category: 'Activity', tier: 'bronze' },
  { id: 'Scholar', emoji: '🎓', label: 'Scholar', description: 'Serious about your preparation.', howToEarn: 'Attempt 50 questions.', category: 'Activity', tier: 'silver' },
  { id: 'Veteran', emoji: '⚔️', label: 'Veteran', description: 'Battle-hardened by hundreds of questions.', howToEarn: 'Attempt 100 questions.', category: 'Activity', tier: 'silver' },
  { id: 'Dedicated', emoji: '🏋️', label: 'Dedicated', description: 'Your consistency is inspiring.', howToEarn: 'Attempt 250 questions.', category: 'Activity', tier: 'gold' },
  { id: 'Legend', emoji: '🌟', label: 'Legend', description: 'A true CAT aspirant legend.', howToEarn: 'Attempt 500 questions.', category: 'Activity', tier: 'platinum' },
  // Accuracy
  { id: 'Accurate', emoji: '🎯', label: 'Accurate', description: 'Your answers are consistently right.', howToEarn: 'Maintain 70%+ accuracy across 20+ questions.', category: 'Accuracy', tier: 'bronze' },
  { id: 'Sharp Shooter', emoji: '🏹', label: 'Sharp Shooter', description: 'Precision is your superpower.', howToEarn: 'Maintain 80%+ accuracy across 20+ questions.', category: 'Accuracy', tier: 'silver' },
  { id: 'Sniper', emoji: '🔭', label: 'Sniper', description: 'Rarely misses a target.', howToEarn: 'Maintain 90%+ accuracy across 20+ questions.', category: 'Accuracy', tier: 'gold' },
  { id: 'Perfectionist', emoji: '💎', label: 'Perfectionist', description: 'Near-perfect accuracy. Extraordinary.', howToEarn: 'Maintain 95%+ accuracy across 20+ questions.', category: 'Accuracy', tier: 'platinum' },
  // Mastery
  { id: 'Getting There', emoji: '🚀', label: 'Getting There', description: 'Building momentum on the Kaksha Score.', howToEarn: 'Reach a Kaksha Score of 30+.', category: 'Mastery', tier: 'bronze' },
  { id: 'Rising Star', emoji: '⭐', label: 'Rising Star', description: 'Your skills are shining through.', howToEarn: 'Reach a Kaksha Score of 50+.', category: 'Mastery', tier: 'silver' },
  { id: 'Proficient', emoji: '🧠', label: 'Proficient', description: 'Demonstrating strong command.', howToEarn: 'Reach a Kaksha Score of 70+.', category: 'Mastery', tier: 'silver' },
  { id: 'Kaksha Master', emoji: '👑', label: 'Kaksha Master', description: 'Mastery at its finest.', howToEarn: 'Reach a Kaksha Score of 80+.', category: 'Mastery', tier: 'gold' },
  { id: 'Elite', emoji: '🏆', label: 'Elite', description: 'Among the top CAT aspirants.', howToEarn: 'Reach a Kaksha Score of 90+.', category: 'Mastery', tier: 'gold' },
  { id: 'CAT Conqueror', emoji: '🦁', label: 'CAT Conqueror', description: 'You have conquered the CAT.', howToEarn: 'Reach a Kaksha Score of 95+.', category: 'Mastery', tier: 'platinum' },
  // XP
  { id: 'XP Earner', emoji: '✨', label: 'XP Earner', description: 'You\'ve started earning XP!', howToEarn: 'Earn 100 XP (10 XP per correct answer, 2 XP per attempt).', category: 'XP', tier: 'bronze' },
  { id: 'XP Grinder', emoji: '⚡', label: 'XP Grinder', description: 'Relentless XP farming!', howToEarn: 'Earn 500 XP total.', category: 'XP', tier: 'silver' },
  { id: 'XP Champion', emoji: '🔥', label: 'XP Champion', description: 'An XP powerhouse.', howToEarn: 'Earn 2000 XP total.', category: 'XP', tier: 'gold' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  silver: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  gold: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
  platinum: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
};

const CATEGORY_ORDER = ['Activity', 'Accuracy', 'Mastery', 'XP'];

interface BadgeInfoModalProps {
  earnedBadges: string[];
  open: boolean;
  onClose: () => void;
  highlightBadge?: string;
}

export function BadgeInfoModal({ earnedBadges, open, onClose, highlightBadge }: BadgeInfoModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(
    highlightBadge ? ALL_BADGES.find(b => b.id === highlightBadge) || null : null
  );
  const earnedSet = new Set(earnedBadges);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelectedBadge(null); } }}>
      <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Badge Collection</DialogTitle>
        </DialogHeader>

        {selectedBadge ? (
          <div className="space-y-4 pt-2">
            <button
              onClick={() => setSelectedBadge(null)}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              ← Back to all badges
            </button>
            <div className={`rounded-2xl border-2 p-6 text-center ${TIER_COLORS[selectedBadge.tier]}`}>
              <div className="text-6xl mb-3">{selectedBadge.emoji}</div>
              <h2 className="text-2xl font-black mb-1">{selectedBadge.label}</h2>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider mb-3">
                {selectedBadge.tier} · {selectedBadge.category}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">{selectedBadge.description}</p>
              {earnedSet.has(selectedBadge.id) ? (
                <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Earned!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-4 py-1.5 font-bold text-sm">
                    <Lock className="h-4 w-4" /> Locked
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground mt-3">How to earn:</p>
                  <p className="text-sm font-medium text-foreground">{selectedBadge.howToEarn}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{earnedSet.size}</span> of {ALL_BADGES.length} badges earned
            </p>
            {CATEGORY_ORDER.map(category => {
              const catBadges = ALL_BADGES.filter(b => b.category === category);
              return (
                <div key={category}>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">{category}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {catBadges.map(badge => {
                      const earned = earnedSet.has(badge.id);
                      return (
                        <button
                          key={badge.id}
                          onClick={() => setSelectedBadge(badge)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all hover:scale-105 hover:shadow-md text-center ${
                            earned
                              ? TIER_COLORS[badge.tier]
                              : 'bg-muted/30 border-border/50 opacity-50 grayscale'
                          }`}
                        >
                          <span className="text-2xl mb-1">{earned ? badge.emoji : '🔒'}</span>
                          <span className="text-[10px] font-bold leading-tight">{badge.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
