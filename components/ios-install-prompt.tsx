'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share, Plus, AlertCircle } from 'lucide-react';

interface IosInstallPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IosInstallPrompt({ open, onOpenChange }: IosInstallPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl p-6 bg-background border border-border overflow-hidden">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
            🎓
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
            Install Kaksha App
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add Kaksha to your iOS Home Screen for a faster, full-screen native app experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="text-xs leading-normal">
              Tap the <span className="font-bold text-foreground">Share</span> button in Safari's bottom navigation menu. It looks like a square with an upward arrow:
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 font-bold text-indigo-600 dark:text-indigo-400">
                <Share className="h-4 w-4 shrink-0" /> Share Button
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5">
            <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="text-xs leading-normal">
              Scroll down the share sheet options list and select <span className="font-bold text-foreground">Add to Home Screen</span>:
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 font-bold text-indigo-600 dark:text-indigo-400">
                <Plus className="h-4 w-4 shrink-0" /> Add to Home Screen
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
            <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-normal">
              <strong>Note:</strong> This feature only works using the native <strong>Safari</strong> browser on iOS.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
