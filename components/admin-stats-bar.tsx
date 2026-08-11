'use client';

import { useEffect, useState } from 'react';
import { Users, Zap, TrendingUp, UserPlus } from 'lucide-react';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  attemptsToday: number;
  newUsersToday: number;
}

export function AdminStatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: 'Online Now',
      value: stats?.onlineUsers ?? '—',
      icon: <Zap className="h-4 w-4" />,
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/20',
      pulse: true,
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      pulse: false,
    },
    {
      label: 'Attempts Today',
      value: stats?.attemptsToday ?? '—',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20',
      pulse: false,
    },
    {
      label: 'New Users Today',
      value: stats?.newUsersToday ?? '—',
      icon: <UserPlus className="h-4 w-4" />,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      pulse: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${card.bg}`}
        >
          <div className={`${card.color} ${card.pulse ? 'animate-pulse' : ''}`}>
            {card.icon}
          </div>
          <div>
            <div className={`text-xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
