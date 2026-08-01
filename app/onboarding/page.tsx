/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, AlertCircle, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TOPICS = [
  "Algebra", "Arithmetic", "Geometry", "Modern Math", "Number System", 
  "Data Interpretation", "Logical Reasoning", "Reading Comprehension", "Verbal Ability"
];

const CAT_DATES = {
  "2026": new Date("2026-11-29T00:00:00"),
  "2027": new Date("2027-11-28T00:00:00"),
  "2028": new Date("2028-11-26T00:00:00")
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [targetYear, setTargetYear] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetYear) {
      const examDate = CAT_DATES[targetYear as keyof typeof CAT_DATES];
      const diff = examDate.getTime() - new Date().getTime();
      setDaysRemaining(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  }, [targetYear]);

  const toggleTopic = (topic: string, isStrength: boolean) => {
    if (isStrength) {
      setStrengths(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
    } else {
      setWeaknesses(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async (skip: boolean = false) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age,
          targetExamYear: targetYear,
          selfStrengths: strengths,
          selfWeaknesses: weaknesses
        })
      });
      if (res.ok) {
        window.location.href = skip ? '/dashboard' : '/diagnostic';
      } else {
        console.error('Failed to submit onboarding data');
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${step >= i ? 'bg-primary w-16' : 'bg-primary/20 w-8'}`} />
          ))}
        </div>

        <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 to-primary" />
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Set Your Target</h1>
                <p className="text-muted-foreground">Let's personalise your Kaksha experience.</p>
              </div>

              <div className="space-y-6 max-w-sm mx-auto">
                <div className="space-y-2">
                  <Label>How old are you?</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 21" 
                    value={age} 
                    onChange={e => setAge(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Which CAT exam are you targeting?</Label>
                  <Select value={targetYear} onValueChange={setTargetYear}>
                    <SelectTrigger className="h-12">
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

              {daysRemaining && (
                <div className="bg-primary/5 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Countdown Initiated</p>
                  <div className="text-5xl font-black tabular-nums tracking-tighter">
                    {daysRemaining} <span className="text-2xl text-muted-foreground font-semibold">Days</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">until CAT {targetYear}</p>
                </div>
              )}

              <Button 
                onClick={handleNext} 
                disabled={!age || !targetYear} 
                className="w-full h-14 text-lg rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Your Strengths</h1>
                <p className="text-muted-foreground">Select the topics you feel confident in.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic, true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-2 ${
                      strengths.includes(topic) 
                        ? 'border-green-500 bg-green-500/10 shadow-sm' 
                        : 'border-muted hover:border-green-500/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      strengths.includes(topic) ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
                    }`}>
                      {strengths.includes(topic) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm font-medium ${strengths.includes(topic) ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                      {topic}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack} className="h-14 px-8 rounded-xl">Back</Button>
                <Button onClick={handleNext} className="flex-1 h-14 text-lg rounded-xl shadow-lg hover:shadow-primary/20 bg-green-600 hover:bg-green-700">
                  {strengths.length > 0 ? 'Continue' : 'Skip for now'} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Areas to Improve</h1>
                <p className="text-muted-foreground">Select the topics you struggle with the most.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TOPICS.filter(t => !strengths.includes(t)).map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic, false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col gap-2 ${
                      weaknesses.includes(topic) 
                        ? 'border-orange-500 bg-orange-500/10 shadow-sm' 
                        : 'border-muted hover:border-orange-500/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      weaknesses.includes(topic) ? 'border-orange-500 bg-orange-500' : 'border-muted-foreground'
                    }`}>
                      {weaknesses.includes(topic) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm font-medium ${weaknesses.includes(topic) ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'}`}>
                      {topic}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting} className="h-14 px-8 rounded-xl">Back</Button>
                <div className="flex-1 flex gap-2">
                  <Button 
                    variant="secondary"
                    onClick={() => handleSubmit(true)} 
                    disabled={isSubmitting} 
                    className="flex-1 h-14 text-lg rounded-xl shadow-lg"
                  >
                    Skip Diagnostic
                  </Button>
                  <Button 
                    onClick={() => handleSubmit(false)} 
                    disabled={isSubmitting} 
                    className="flex-1 h-14 text-lg rounded-xl shadow-lg hover:shadow-primary/20 bg-primary"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Profile...</>
                    ) : (
                      <>Start Diagnostic Test <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
