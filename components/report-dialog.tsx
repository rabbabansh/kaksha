'use client';

import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ReportDialogProps {
  questionId: string;
}

export function ReportDialog({ questionId }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('missing_details');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, reason, customReason }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setOpen(false), 2000);
      } else {
        alert('Failed to submit report. Please try again later.');
      }
    } catch (e) {
      alert('Error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        setTimeout(() => setSuccess(false), 300);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive shrink-0">
          <Flag className="w-4 h-4 mr-2" /> Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Question</DialogTitle>
          <DialogDescription>
            Help us improve Kaksha by reporting issues with this question.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center text-green-600 font-medium">
            Thank you! Your report has been submitted.
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing_details" id="r1" />
                <Label htmlFor="r1">Missing details in question (e.g. passage text missing)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incorrect_answer" id="r2" />
                <Label htmlFor="r2">Right answer in the app is actually incorrect</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing_media" id="r3" />
                <Label htmlFor="r3">Media is not loaded (like tables, graphs, images)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing_options" id="r4" />
                <Label htmlFor="r4">Options are missing or malformed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="r5" />
                <Label htmlFor="r5">Other (Please specify)</Label>
              </div>
            </RadioGroup>

            {reason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="custom">Please specify the issue:</Label>
                <Input
                  id="custom"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type your issue here..."
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!success && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || (reason === 'other' && !customReason.trim())}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Report
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
