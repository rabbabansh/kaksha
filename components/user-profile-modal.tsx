/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Award, Target, BrainCircuit, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserProfileModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ userId, open, onOpenChange }: UserProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch when opened
  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${userId}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error(e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    } else if (!open) {
      // Clear profile when modal closes to prevent showing old data
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-2xl text-primary border-2 border-primary/20">
                {profile.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-xl">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">Joined {new Date(profile.joinedAt).toLocaleDateString()}</p>
                {profile.targetExamYear && (
                  <Badge variant="outline" className="mt-1 text-[10px]">Target: CAT {profile.targetExamYear}</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Award className="w-3 h-3" /> Kaksha Score</span>
                <span className="text-2xl font-black text-indigo-600">{profile.kakshaScore}</span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Accuracy</span>
                <span className="text-2xl font-black text-green-600">{profile.accuracy}%</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-primary"><Target className="w-4 h-4" /> Top Strengths</h4>
              {profile.topStrengths?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.topStrengths.map((s: string) => (
                    <Badge key={s} className="bg-green-500/10 text-green-700 border-green-200">{s}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">No strengths established yet.</p>}
            </div>

            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-destructive"><BrainCircuit className="w-4 h-4" /> Needs Work</h4>
              {profile.topWeaknesses?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.topWeaknesses.map((w: string) => (
                    <Badge key={w} variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{w}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">No weaknesses detected yet.</p>}
            </div>

            <div className="text-xs text-center text-muted-foreground pt-4 border-t">
              Total questions attempted: {profile.totalAttempts}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Profile not found.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
