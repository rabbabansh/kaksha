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
  SlidersHorizontal,
  BookOpen,
  Layers
} from 'lucide-react';

export default function WhatsNewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mark as seen so they don't get redirected here again automatically
    localStorage.setItem('kaksha_whats_new_v1.5', 'true');
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
        
        {/* Kaksha v1.5 — Latest */}
        <div className="relative animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-100">
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-primary text-primary-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.5 ✨ (Latest)
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-primary">Kaksha v1.5 <span className="text-sm font-medium text-muted-foreground">(Latest)</span></h2>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/20 p-4 rounded-2xl shrink-0">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    20+ Badges &amp; XP Animations <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Earn badges across Activity, Accuracy, Mastery, and XP categories. Tap XP, Streak, or Badges on the dashboard to see info and your full badge collection — with locked/earned states.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-yellow-100 dark:bg-yellow-950/30 p-3 rounded-xl shrink-0"><Star className="w-6 h-6 text-yellow-500" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">XP Earn Animations</h4>
                    <p className="text-muted-foreground text-sm">A bouncing +XP toast appears after every sprint or mock, showing exactly how many XP you earned and any new badges unlocked.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-indigo-100 dark:bg-indigo-950/30 p-3 rounded-xl shrink-0"><Sparkles className="w-6 h-6 text-indigo-500" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Floating Tutor Bubble</h4>
                    <p className="text-muted-foreground text-sm">Coach is now a persistent floating button on every page — tap to open a quick chat window or expand to full screen.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-green-100 dark:bg-green-950/30 p-3 rounded-xl shrink-0"><BarChart3 className="w-6 h-6 text-green-600" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Enhanced Report Cards</h4>
                    <p className="text-muted-foreground text-sm">Post-sprint report cards now show per-question results, XP earned, correct/incorrect breakdown — all in one clear view.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-blue-100 dark:bg-blue-950/30 p-3 rounded-xl shrink-0"><LibraryBig className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Full-Text Question Search</h4>
                    <p className="text-muted-foreground text-sm">The Practice Bank now searches question content — not just metadata. Find any question by typing keywords from the question text.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-orange-100 dark:bg-orange-950/30 p-3 rounded-xl shrink-0"><Monitor className="w-6 h-6 text-orange-600" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Mock Test Desktop Warning</h4>
                    <p className="text-muted-foreground text-sm">Attempting a mock CBT on mobile? We now show a friendly warning recommending desktop for the best CAT simulation experience.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="bg-purple-100 dark:bg-purple-950/30 p-3 rounded-xl shrink-0"><BookOpen className="w-6 h-6 text-purple-600" /></div>
                  <div>
                    <h4 className="font-black text-lg mb-1">New Learn Section</h4>
                    <p className="text-muted-foreground text-sm">Practice Modules now live under a dedicated "Learn" tab in the navbar — a focused hub for your structured topic-wise practice sprints.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="relative h-8"><div className="absolute inset-x-0 top-1/2 h-0.5 bg-border" /></div>

        {/* Kaksha v1.4.2 */}
        <div className="relative animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
          <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-primary text-primary-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.4.2 (Latest)
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-primary">Kaksha v1.4.2 <span className="text-sm font-medium text-muted-foreground">(Latest)</span></h2>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/20 p-4 rounded-2xl shrink-0">
                  <Monitor className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    Mobile First Overhaul & Responsive App <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Kaksha is now 100% optimized for mobile. Featuring a highly responsive bottom navigation bar, swipable master paths, responsive charts, and an overhauled dashboard layout designed perfectly for your phone screen.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle>Daily Targets Widget</CardTitle>
                  <CardDescription className="text-base mt-2">Dailies are now completely decoupled and instantly accessible right inside the Practice Bank, making consistency easier than ever.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>Smart Evaluator Feedback</CardTitle>
                  <CardDescription className="text-base mt-2">Progress question boxes in CBT practice and mixed sessions now visually highlight instantly with green and red states to denote accuracy on-the-fly.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Kaksha v1.4.1 */}
        <div className="relative pt-12 opacity-90">
          <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-muted text-muted-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.4.1
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-muted-foreground">Kaksha v1.4.1</h2>
          </div>

          <div className="space-y-6">
            <Card className="border-border/80 bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/10 p-4 rounded-2xl shrink-0">
                  <BookOpen className="w-8 h-8 text-primary/70" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    Daily RC Passage & Daily DILR Caselet Pillars
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Every single day, Kaksha serves a fresh, deterministic CAT Reading Comprehension passage and DILR multi-question caselet. Built with authentic 2-pane CBT split-screens, real-time feedback, and streak tracking!
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle>Unified Hero Command Center</CardTitle>
                  <CardDescription className="text-base mt-2">Consolidated your Global Mastery Profile, Estimated Percentile, Streaks, XP, and 140-day Activity Heatmap into one cohesive mission control module.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <CardTitle>Adaptive Preparation Roadmap</CardTitle>
                  <CardDescription className="text-base mt-2">Dynamic CAT countdown, live weekly question velocity gauge, and milestone phase transitions that adapt automatically to your proficiency.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow md:col-span-2">
                <CardHeader>
                  <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Layers className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle>Diagnostics & Competency Hub</CardTitle>
                  <CardDescription className="text-base mt-2">Combined granular QA/VARC/DILR subtopic rankings with interactive performance bar charts and accuracy drill-downs in a seamless tabbed workspace.</CardDescription>
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
