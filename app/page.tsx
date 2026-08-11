import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, TrendingUp, Target, Brain, Sparkles, BookOpen, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function LandingPage() {
  const session = await getAuthSession();
  
  if (session) {
    redirect('/dashboard');
  }

  // Calculate days remaining to CAT 2026 (Nov 29, 2026)
  const catDate = new Date("2026-11-29T00:00:00");
  const diff = catDate.getTime() - new Date().getTime();
  const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Top Navbar specifically for Landing Page */}
      <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-2xl shadow-lg">
            📕
          </div>
          <span className="text-2xl font-bold tracking-tight">Kaksha</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-muted-foreground hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border/50">
            🐾 {daysRemaining} days to CAT
          </span>
          <Link href="/login">
            <Button variant="outline" className="rounded-full px-6 font-semibold border-primary/20 hover:bg-primary/5">
              Log In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-40 pb-20 md:pt-52 md:pb-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px] mix-blend-screen animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
            <Sparkles className="h-4 w-4 text-yellow-500 animate-spin-slow" />
            Kaksha 1.0 is now live for CAT 2026/27
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
            The secret to a 99%ile is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-primary animate-gradient-x">
              practice.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed">
            Practice smarter, not harder. Kaksha maps your strengths and weaknesses to build a friendly, personalized roadmap while you solve past papers and mocks.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-lg rounded-full shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] hover:-translate-y-1 transition-all duration-300 bg-primary text-primary-foreground">
                Start Practicing for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required
          </p>
        </div>
      </section>

      {/* Floating UI Mockup Showcase */}
      <section className="relative -mt-12 mb-32 z-20 px-4">
        <div className="max-w-5xl mx-auto rounded-2xl md:rounded-[2.5rem] border border-border/50 bg-background/50 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden ring-1 ring-white/10">
          <div className="rounded-xl md:rounded-[2rem] overflow-hidden border bg-card">
            {/* Mock Dashboard UI */}
            <div className="border-b bg-muted/30 px-6 py-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="grid md:grid-cols-3 p-6 gap-6 bg-gradient-to-br from-card to-muted/20">
              <div className="md:col-span-2 space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/> Algorithmic Mastery</h3>
                      <span className="text-3xl font-black text-primary">82<span className="text-lg text-muted-foreground">/100</span></span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Algebra</span><span className="font-bold text-green-500">Strong (95%)</span></div>
                      <div className="w-full bg-background rounded-full h-2"><div className="bg-green-500 h-2 rounded-full w-[95%]" /></div>
                      
                      <div className="flex justify-between text-sm pt-2"><span className="text-muted-foreground">Geometry</span><span className="font-bold text-orange-500">Weak (40%)</span></div>
                      <div className="w-full bg-background rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full w-[40%]" /></div>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 border rounded-xl bg-card">
                     <BookOpen className="h-6 w-6 text-blue-500 mb-2"/>
                     <div className="text-2xl font-bold">1,240</div>
                     <div className="text-sm text-muted-foreground">Questions Solved</div>
                   </div>
                   <div className="p-4 border rounded-xl bg-card">
                     <Target className="h-6 w-6 text-green-500 mb-2"/>
                     <div className="text-2xl font-bold">PYQ Mocks</div>
                     <div className="text-sm text-muted-foreground">Actual Interface</div>
                   </div>
                </div>
              </div>
              <div className="md:col-span-1 border rounded-xl bg-card p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center"><Bot className="h-4 w-4 text-primary"/></div>
                  <div><p className="font-bold text-sm">AI Tutor</p><p className="text-xs text-green-500">Online</p></div>
                </div>
                <div className="flex-1 space-y-4 text-sm">
                  <div className="bg-muted p-3 rounded-lg rounded-tr-none ml-6 text-muted-foreground">I don&apos;t understand how you got step 2...</div>
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg rounded-tl-none mr-6">
                    Ah! Notice that <span className="font-mono bg-background px-1 rounded text-xs text-primary">x² - y²</span> is a difference of squares. We can expand it to <span className="font-mono bg-background px-1 rounded text-xs text-primary">(x-y)(x+y)</span>. Make sense?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 bg-muted/30 border-y">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-semibold text-sm mb-6">
                <Brain className="h-4 w-4" /> Cognitive Engine
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                Practice beats<br />watching lectures.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                It is easy to get lost in 100-hour video courses. Kaksha focuses on active learning, giving you bite-sized practice sessions that adapt to your speed and help you retain what you learn.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Dynamic question generation based on your weaknesses",
                  "Bayesian Knowledge Tracing accurately maps your brain",
                  "AI Tutor acts as your personal 24/7 mentor",
                  "Detailed step-by-step solutions for every problem"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/20 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-primary shrink-0" /></div>
                    <span className="text-lg">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
              <div className="relative border shadow-2xl rounded-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500 bg-background/80 backdrop-blur-sm">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-500"/> AI Action Plan</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="font-semibold text-orange-600 dark:text-orange-400">Phase 1: Bridge the Gaps</p>
                    <p className="text-sm text-muted-foreground mt-1">Focus heavily on Geometry and Number Systems to build a solid foundation.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Phase 2: Consolidation</p>
                    <p className="text-sm text-muted-foreground mt-1">Mixed practice and sectional tests to build stamina.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Crack the CAT, one step at a time.</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Take a quick 15-minute diagnostic test to discover your starting strengths and weaknesses today.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-16 px-12 text-xl rounded-full shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] hover:scale-105 transition-all bg-primary text-primary-foreground hover:bg-primary/90">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
      
      <footer className="border-t py-12 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 shadow-sm text-xs">
            📕
          </div>
          <span className="font-semibold text-foreground">Kaksha</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Kaksha Prep. Built by engineers and top percentilers.</p>
      </footer>
    </div>
  );
}
