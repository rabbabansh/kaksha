'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  History, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3, 
  Medal, 
  Monitor, 
  Star, 
  Zap, 
  ChevronRight, 
  Gift, 
  LibraryBig, 
  Sparkles, 
  BrainCircuit,
  Calendar,
  Flame,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export default function WhatsNewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mark as seen so they don't get redirected here again automatically
    localStorage.setItem('kaksha_whats_new_v1.4', 'true');
  }, []);

  const handleContinue = () => {
    window.location.href = '/dashboard';
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pt-16 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 animate-in fade-in zoom-in duration-500">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700">
            What&apos;s New in Kaksha
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom-6 fade-in duration-700 delay-150">
            We&apos;ve been hard at work building the ultimate CAT preparation ecosystem. Discover all the new features and upgrades.
          </p>
          <div className="pt-4 animate-in fade-in duration-1000 delay-300">
            <Button onClick={handleContinue} size="lg" className="rounded-full px-8 shadow-lg hover:shadow-primary/25 font-bold text-lg">
              Explore Dashboard <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-16">
        
        {/* Kaksha v1.4 */}
        <div className="relative animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
          <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-primary text-primary-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.4 (Latest)
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-primary">Kaksha v1.4 <span className="text-sm font-medium text-muted-foreground">(Latest)</span></h2>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/20 p-4 rounded-2xl shrink-0">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    Consistency Heatmap & Daily Tasks Explorer <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Track your preparation journey with our GitHub-style consistency calendar. Click on any day to inspect exactly which tests and practice sprints you attempted, check your daily target completion, and reattempt any missed tasks!
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle>Streak Engine & Gamification</CardTitle>
                  <CardDescription className="text-base mt-2">Stay motivated with active Current and Longest Streak tracking on your dashboard. Consistency is key to cracking CAT!</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <CardTitle>Historical Dailies & 1-Click Retries</CardTitle>
                  <CardDescription className="text-base mt-2">Missed a daily challenge or want to retry a weak area? The Day Detail panel lets you launch targeted practice sessions and review past sprints instantly.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow md:col-span-2">
                <CardHeader>
                  <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <SlidersHorizontal className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle>DRY Refactored Component & Service Layer</CardTitle>
                  <CardDescription className="text-base mt-2">Standardized reusable UI components across Practice Bank, Mock Tests, and Review Sessions with unified Markdown/LaTeX rendering, custom filter bars, and centralized database service utilities.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Kaksha v1.3 */}
        <div className="relative pt-12 opacity-85">
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-muted text-muted-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.3
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-muted-foreground">Kaksha v1.3</h2>
          </div>

          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/20 p-4 rounded-2xl shrink-0">
                  <LibraryBig className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    Unified Practice Bank
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Completely redesigned Practice Bank with horizontal filters, split-pane viewing for passages, and integrated AI Tutor.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <History className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle>Unified Session Tracking</CardTitle>
                  <CardDescription className="text-base mt-2">Every Mock, Practice Module, and Diagnostic test tracked in one place with precision.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <BrainCircuit className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>Ask AI Tutor Integration</CardTitle>
                  <CardDescription className="text-base mt-2">Seamless AI Tutor rendering markdown and LaTeX explanations whenever you get stuck.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Kaksha v1.2 */}
        <div className="relative pt-12 opacity-70">
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-muted text-muted-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.2
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-muted-foreground">Kaksha v1.2</h2>
          </div>

          <div className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-muted p-4 rounded-2xl shrink-0">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2 text-muted-foreground">
                    Review & History Hub
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Revisit your past practice modules and mock tests, filter by category, and learn from your mistakes by reviewing specific questions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">The Kaksha Score</CardTitle>
                  <CardDescription className="text-base mt-2">A unified metric between 0-100 that represents your true readiness for the CAT exam.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Deep Drill-down Analytics</CardTitle>
                  <CardDescription className="text-base mt-2">Click through interactive charts to dive deep into your VARC, DILR, and QA mastery matrices.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
