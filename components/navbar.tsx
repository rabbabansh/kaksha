'use client';

import { useState, useEffect } from 'react';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, TrendingUp, Sparkles, FileText, UserCircle, GraduationCap, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from './theme-provider';
import { IosInstallPrompt } from './ios-install-prompt';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [xp, setXp] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [animateXp, setAnimateXp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Detect if iOS (requires Safari manual guide modal)
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isIos && !isStandalone) {
      setIsInstallable(true);
    }

    // 2. Detect if Android / Chrome (supports native install prompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Trigger native browser install dialog
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA installation');
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    } else {
      // Open iOS custom manual installation modal
      setShowInstallPrompt(true);
    }
  };

  // Automatically show iOS Safari PWA manual guide modal once on first visit
  useEffect(() => {
    if (isInstallable && !deferredPrompt && mounted) {
      const suggested = localStorage.getItem('pwa-prompt-suggested');
      if (!suggested) {
        setShowInstallPrompt(true);
        localStorage.setItem('pwa-prompt-suggested', 'true');
      }
    }
  }, [isInstallable, deferredPrompt, mounted]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data?.profile) {
          const newXp = res.data.profile.xp;
          if (xp !== null && newXp > xp) {
            setAnimateXp(true);
            setTimeout(() => setAnimateXp(false), 1200);
          }
          setXp(newXp);
          setStreak(res.data.profile.currentStreak);
        }
      })
      .catch(console.error);
  }, [session, pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: TrendingUp },
    { href: '/practice/modules', label: 'Practice', icon: Search },
    { href: '/learn', label: 'Learn', icon: GraduationCap },
    { href: '/mocks', label: 'Tests', icon: BookOpen },
    { href: '/tutor', label: 'Coach', icon: Sparkles },
  ];

  const isActive = (href: string) => {
    if (href === '/mocks') {
      return pathname === '/mocks';
    }
    if (href === '/practice/modules') {
      return pathname?.startsWith('/practice');
    }
    return pathname?.startsWith(href);
  };

  const segments = pathname?.split('/').filter(Boolean) || [];
  const isTestPage = pathname === '/diagnostic' || 
                     (pathname?.startsWith('/mocks/') && segments.length === 3);

  if (pathname === '/' || isTestPage) {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xl shadow-sm">
              📕
            </div>
            <span className="text-xl font-semibold">Kaksha</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    {item.label === 'Profile' ? (
                      session?.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isInstallable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallClick}
              className="h-8 gap-1.5 rounded-xl text-[10px] font-bold border-indigo-200/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2.5 shadow-sm shrink-0"
            >
              📱 Install App
            </Button>
          )}

          {session && mounted && (
            <div className="flex items-center gap-2 sm:gap-3 bg-muted/40 dark:bg-muted/15 border border-border/40 px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold shrink-0">
              {streak !== null && (
                <span className="flex items-center gap-1 text-orange-500 hover:scale-105 transition-transform" title="Current Streak">
                  🔥 {streak}
                </span>
              )}
              {xp !== null && (
                <span className={`flex items-center gap-1 text-yellow-500 transition-all duration-300 ${animateXp ? 'scale-125 text-yellow-600 dark:text-yellow-400 font-black animate-bounce' : 'hover:scale-105'}`} title="Total XP">
                  ⭐ {xp} XP
                </span>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            aria-label="Toggle Theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-yellow-500 transition-all" />
            ) : mounted ? (
              <Moon className="h-[18px] w-[18px] text-indigo-500 transition-all" />
            ) : (
              <div className="h-[18px] w-[18px]" />
            )}
          </Button>

          {session ? (
            <Link href="/settings" className="hidden md:block shrink-0">
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0 overflow-hidden border border-border/40 hover:border-primary/40 transition-colors">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {session.user?.name?.[0] || 'U'}
                  </div>
                )}
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { href: '/dashboard', label: 'Home', icon: TrendingUp },
            { href: '/practice/modules', label: 'Practice', icon: Search },
            { href: '/learn', label: 'Learn', icon: GraduationCap },
            { href: '/mocks', label: 'Test', icon: BookOpen },
            { href: '/settings', label: 'Profile', icon: UserCircle },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={`w-full flex-col h-full gap-1 rounded-xl transition-all duration-200 hover:bg-transparent ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label === 'Profile' ? (
                    session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={24}
                        height={24}
                        className={`h-6 w-6 rounded-full border-2 ${active ? 'border-primary' : 'border-transparent'}`}
                      />
                    ) : (
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {session?.user?.name?.[0] || 'U'}
                      </div>
                    )
                  ) : (
                    <Icon className={`h-[22px] w-[22px] ${active ? 'scale-110 drop-shadow-sm' : ''} transition-transform duration-200`} />
                  )}
                  <span className={`text-[10px] font-medium tracking-wide ${active ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <IosInstallPrompt open={showInstallPrompt} onOpenChange={setShowInstallPrompt} />
    </>
  );
}

