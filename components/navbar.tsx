'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, TrendingUp, Sparkles, FileText, UserCircle, GraduationCap } from 'lucide-react';
import Image from 'next/image';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: TrendingUp },
    { href: '/practice/bank', label: 'Practice', icon: Search },
    { href: '/learn', label: 'Learn', icon: GraduationCap },
    { href: '/mocks', label: 'Tests', icon: BookOpen },
    { href: '/tutor', label: 'Kaksha Guru', icon: Sparkles },
    { href: '/settings', label: 'Profile', icon: UserCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/mocks') {
      return pathname === '/mocks';
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

        {!session && (
          <Link href="/login" className="hidden md:block">
            <Button variant="outline">Sign In</Button>
          </Link>
        )}
      </div>
    </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { href: '/dashboard', label: 'Home', icon: TrendingUp },
            { href: '/practice/bank', label: 'Practice', icon: Search },
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
    </>
  );
}

