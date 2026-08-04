'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, Target, Award, BarChart3, Medal, Monitor, Star, Zap, ChevronRight, Gift, LibraryBig, Sparkles, BrainCircuit } from 'lucide-react';

export default function WhatsNewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mark as seen so they don't get redirected here again automatically
    localStorage.setItem('kaksha_whats_new_v1.3', 'true');
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
        
        {/* Kaksha v1.3 */}
        <div className="relative animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
          <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
          
          <div className="flex items-center justify-center mb-12 relative z-10 hidden md:flex">
             <div className="bg-primary text-primary-foreground font-black px-6 py-2 rounded-full border-4 border-background shadow-sm">
                Kaksha v1.3 (Latest)
             </div>
          </div>
          <div className="md:hidden mb-8">
             <h2 className="text-2xl font-black text-primary">Kaksha v1.3 <span className="text-sm font-medium text-muted-foreground">(Latest)</span></h2>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-md transform transition-all hover:-translate-y-1 hover:shadow-xl">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="bg-primary/20 p-4 rounded-2xl shrink-0">
                  <LibraryBig className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                    Unified Practice Bank <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">New</span>
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    We&apos;ve completely redesigned the Practice Bank. Now it acts like a supercharged search engine for questions, featuring horizontal filters, split-pane viewing for seamless reading, and an integrated AI Tutor right at the bottom!
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
                  <CardDescription className="text-base mt-2">Every Mock, Practice Module, and Diagnostic test is now tracked beautifully in one place. Your attempts are recorded with precision so you can always look back at your journey.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <BrainCircuit className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>Ask AI Tutor Integration</CardTitle>
                  <CardDescription className="text-base mt-2">Our AI Tutor is now beautifully integrated across practice modules. It renders markdown and LaTeX flawlessly, giving you crisp, accurate explanations whenever you&apos;re stuck.</CardDescription>
                </CardHeader>
              </Card>

               <Card className="hover:shadow-md transition-shadow md:col-span-2">
                <CardHeader>
                  <div className="bg-orange-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-orange-500" />
                  </div>
                  <CardTitle>Daily Tasks & Smart Progression</CardTitle>
                  <CardDescription className="text-base mt-2">Your Dashboard now acts as your personal coach. It suggests Daily Tasks, tracks your progression path based on your skill level, and intelligently recommends questions to maximize your score.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Kaksha v1.2 */}
        <div className="relative pt-12 opacity-80">
          
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
                    Never lose track of your progress. Revisit your past practice modules and mock tests, filter by category, and learn from your mistakes by reviewing specific questions with their detailed explanations.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Dynamic Learning System</CardTitle>
                  <CardDescription className="text-base mt-2">Our adaptive engine now intelligently tracks your Bayesian Knowledge Tracing (BKT) mastery across subtopics, giving you exactly what you need to improve.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">The Kaksha Score</CardTitle>
                  <CardDescription className="text-base mt-2">A unified metric between 0-100 that represents your true readiness for the CAT exam, accurately mapped to expected percentiles.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Deep Drill-down Analytics</CardTitle>
                  <CardDescription className="text-base mt-2">A completely redesigned dashboard. Click through interactive charts to dive deep into your VARC, DILR, and QA mastery matrices.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Daily Priority Targets</CardTitle>
                  <CardDescription className="text-base mt-2">Stop guessing what to study. The engine now assigns actionable, bite-sized daily tasks tailored to repair your specific weaknesses.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Medal className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Global Leaderboard</CardTitle>
                  <CardDescription className="text-base mt-2">Compete with aspirants worldwide. See where you stand on the percentile bell curve and vie for the top ranks.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Monitor className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-muted-foreground">Authentic CBT Interface</CardTitle>
                  <CardDescription className="text-base mt-2">We rebuilt the test-taking environment to perfectly mimic the actual CAT Computer Based Test (CBT) interface, reducing test day anxiety.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Kaksha v1.1.0 */}
        <div className="pt-8 opacity-50">
           <div className="flex items-center justify-center mb-8 relative z-10 hidden md:flex">
             <div className="bg-muted text-muted-foreground font-bold px-4 py-1.5 rounded-full border-4 border-background text-sm">
                Kaksha v1.1.0
             </div>
          </div>
          <div className="md:hidden mb-6">
             <h2 className="text-xl font-bold text-muted-foreground">Kaksha v1.1.0</h2>
          </div>
          
          <div className="space-y-4 max-w-2xl mx-auto">
             <Card className="bg-transparent border-dashed">
                <CardContent className="p-6">
                   <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Introduced the basic Mock Engine to take full-length PYQ exams.</li>
                      <li>Added simple profile stats and static data tracking.</li>
                      <li>Included initial set of practice questions.</li>
                   </ul>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Base Version */}
        <div className="pt-4 pb-12 opacity-30">
           <div className="flex items-center justify-center mb-8 relative z-10 hidden md:flex">
             <div className="bg-muted/50 text-muted-foreground/80 font-bold px-4 py-1.5 rounded-full border-4 border-background text-sm">
                Kaksha v1.0.0
             </div>
          </div>
          <div className="md:hidden mb-6">
             <h2 className="text-lg font-bold text-muted-foreground/80">Kaksha v1.0.0</h2>
          </div>
          
          <div className="text-center">
             <p className="text-muted-foreground/80 italic">Initial launch of the Kaksha platform!</p>
          </div>
        </div>

      </div>
    </div>
  );
}
