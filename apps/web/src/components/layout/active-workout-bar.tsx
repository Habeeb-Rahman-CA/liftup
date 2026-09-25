'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveWorkout } from '@/context/active-workout-context';
import { Dumbbell, ChevronRight, Play } from 'lucide-react';

export function ActiveWorkoutBar() {
  const pathname = usePathname();
  const { activeSession, formattedTime } = useActiveWorkout();

  // Do not show on the active workout page itself or on auth pages
  if (!activeSession) return null;
  if (
    pathname === '/workouts/active' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-bar-offset sm:bottom-4 left-0 right-0 z-40 max-w-lg mx-auto px-3 sm:px-4 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
      <Link
        href="/workouts/active"
        className="pointer-events-auto flex items-center justify-between p-3 rounded-2xl bg-zinc-900/95 border border-emerald-500/50 shadow-xl shadow-black/80 backdrop-blur-md hover:border-emerald-400 transition-all group"
      >
        {/* Left: Indicator & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 shrink-0">
            <Dumbbell className="h-4 w-4 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <p className="font-semibold text-xs text-zinc-100 truncate">
                {activeSession.name || 'Active Workout'}
              </p>
            </div>
            <p className="text-[11px] font-mono text-emerald-400 mt-0.5">{formattedTime} elapsed</p>
          </div>
        </div>

        {/* Right: Resume CTA */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 text-emerald-100 border border-emerald-700 text-xs font-semibold group-hover:bg-emerald-800 transition-colors shrink-0">
          <span>Resume</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}
