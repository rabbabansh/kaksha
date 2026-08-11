/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { Loader2, Save, AlertTriangle, RefreshCw, Trash2, BrainCircuit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Gift } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [targetYear, setTargetYear] = useState('');

  const [confirmDialog, setConfirmDialog] = useState<'reset' | 'reset_ai' | 'retake' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) {
          setName(d.data.name || session?.user?.name || '');
          setAge(d.data.profile?.age?.toString() || '');
          setTargetYear(d.data.profile?.targetExamYear || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', name, age: parseInt(age), targetExamYear: targetYear })
      });
      if (res.ok) {
        await update({ name }); // update next-auth session
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile.');
      }
    } catch (e) {
      alert('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDangerAction = async () => {
    setActionLoading(true);
    try {
      const action = confirmDialog === 'reset' ? 'reset_progress' : confirmDialog === 'reset_ai' ? 'reset_ai' : 'retake_diagnostic';
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (res.ok) {
        if (action === 'retake_diagnostic') {
          router.push('/onboarding');
        } else if (action === 'reset_ai') {
          alert('AI Analysis has been reset successfully.');
          setConfirmDialog(null);
          router.refresh();
        } else {
          alert('Progress has been reset completely.');
          setConfirmDialog(null);
          router.refresh();
        }
      } else {
        alert('Failed to execute action.');
      }
    } catch (e) {
      alert('Error executing action.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border-4 border-primary/20 shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-sm">
              {session?.user?.name?.[0] || 'U'}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session?.user?.name || 'Profile'}</h1>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/whats-new">
            <Button variant="outline" className="w-full h-14 flex items-center justify-start gap-3 rounded-xl border-green-500/20 hover:bg-green-500/10 hover:text-green-600">
              <Gift className="h-5 w-5 text-green-500" />
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">What's New</span>
                <span className="text-[10px] text-muted-foreground">Latest updates</span>
              </div>
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-14 flex items-center justify-start gap-3 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => signOut()}>
            <LogOut className="h-5 w-5" />
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm">Log Out</span>
              <span className="text-[10px] text-muted-foreground">Sign out of Kaksha</span>
            </div>
          </Button>
        </div>
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal information and target exam year.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Target CAT Year</Label>
                <Select value={targetYear} onValueChange={setTargetYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">CAT 2026</SelectItem>
                    <SelectItem value="2027">CAT 2027</SelectItem>
                    <SelectItem value="2028">CAT 2028</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 py-4">
            <Button onClick={handleSaveProfile} disabled={saving} className="ml-auto">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions that affect your progress and data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl bg-destructive/5 border-destructive/20 gap-4">
              <div>
                <h4 className="font-semibold text-destructive">Retake Diagnostic Test</h4>
                <p className="text-sm text-muted-foreground mt-1">This will force you to redo the onboarding wizard and establish a new baseline. Your previous diagnostic score will be overwritten.</p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white w-full sm:w-auto shrink-0" onClick={() => setConfirmDialog('retake')}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retake Diagnostic
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl bg-destructive/5 border-destructive/20 gap-4">
              <div>
                <h4 className="font-semibold text-destructive">Recalibrate AI Analysis</h4>
                <p className="text-sm text-muted-foreground mt-1">This will clear your current weaknesses, strengths, and AI plans. It will recalculate everything purely based on your past attempts without erasing any actual test history.</p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white w-full sm:w-auto shrink-0" onClick={() => setConfirmDialog('reset_ai')}>
                <BrainCircuit className="mr-2 h-4 w-4" /> Reset AI Engine
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-xl bg-destructive/5 border-destructive/20 gap-4">
              <div>
                <h4 className="font-semibold text-destructive">Reset All Progress</h4>
                <p className="text-sm text-muted-foreground mt-1">This will permanently delete ALL your solved questions, mock attempts, Kaksha Score, and AI Action Plans. This cannot be undone.</p>
              </div>
              <Button variant="destructive" className="w-full sm:w-auto shrink-0" onClick={() => setConfirmDialog('reset')}>
                <Trash2 className="mr-2 h-4 w-4" /> Hard Reset Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {confirmDialog === 'reset' ? 'Absolute Data Reset' : confirmDialog === 'reset_ai' ? 'Recalibrate AI Engine' : 'Retake Diagnostic Test'}
            </DialogTitle>
            <DialogDescription className="pt-4">
              {confirmDialog === 'reset' 
                ? "Are you absolutely sure you want to delete all your progress? Every question you've answered, every mock you've taken, and all your analytics will be permanently erased. You will start fresh as a day 1 user."
                : confirmDialog === 'reset_ai'
                ? "This will clear your AI action plans, strengths, and weaknesses, and recalculate them based on your historical attempts. Your test scores will NOT be lost. Proceed?"
                : "Are you sure you want to retake the diagnostic test? This will redirect you to the onboarding flow to set a new baseline."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setConfirmDialog(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDangerAction} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {confirmDialog === 'reset' ? 'Yes, Reset Everything' : confirmDialog === 'reset_ai' ? 'Yes, Recalibrate AI' : 'Yes, Retake Diagnostic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
