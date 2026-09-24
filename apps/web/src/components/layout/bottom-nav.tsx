'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { LayoutDashboard, Dumbbell, User, Calendar, History } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Bottom navigation is only for authenticated in-app navigation
  if (loading || !user) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 pb-safe"
    >
      <div className="flex items-stretch justify-around h-14 max-w-md mx-auto px-1">
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            pathname === '/dashboard' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        <Link
          href="/workouts"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            pathname === '/workouts' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] font-medium">Schedule</span>
        </Link>

        <Link
          href="/exercises"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            pathname === '/exercises' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-[10px] font-medium">Exercises</span>
        </Link>

        <Link
          href="/history"
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            pathname === '/history' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <History className="h-5 w-5" />
          <span className="text-[10px] font-medium">History</span>
        </Link>
      </div>
    </nav>
  );
};
