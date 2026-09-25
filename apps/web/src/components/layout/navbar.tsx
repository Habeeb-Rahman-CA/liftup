'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Dumbbell,
  History,
  TrendingUp,
  UtensilsCrossed,
  Layers,
} from 'lucide-react';
import { UserProfileMenu } from './user-profile-menu';

export const Navbar: React.FC = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Top navbar only displays inside the authenticated application
  if (loading || !user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950 pt-safe">
      <div className="max-w-5xl mx-auto flex h-13 sm:h-14 items-center justify-between px-3.5 sm:px-6">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center touch-manipulation">
          <Image
            src="/liftup-dark.png"
            alt="LiftUp"
            width={120}
            height={32}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* In-app Controls & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/dashboard" className="hidden sm:inline-flex">
            <Button
              variant={pathname === '/dashboard' ? 'default' : 'outline'}
              size="sm"
              className={
                pathname === '/dashboard'
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </Button>
          </Link>

          <Link href="/workouts" className="hidden sm:inline-flex">
            <Button
              variant={pathname.startsWith('/workouts') ? 'default' : 'outline'}
              size="sm"
              className={
                pathname.startsWith('/workouts')
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
              Workout
            </Button>
          </Link>

          <Link href="/exercises" className="hidden sm:inline-flex">
            <Button
              variant={
                pathname.startsWith('/exercises') || pathname.startsWith('/foods')
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              className={
                pathname.startsWith('/exercises') || pathname.startsWith('/foods')
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Library
            </Button>
          </Link>

          <Link href="/meals" className="hidden sm:inline-flex">
            <Button
              variant={pathname.startsWith('/meals') ? 'default' : 'outline'}
              size="sm"
              className={
                pathname.startsWith('/meals')
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
              Meals
            </Button>
          </Link>

          <Link href="/progress" className="hidden sm:inline-flex">
            <Button
              variant={pathname === '/progress' ? 'default' : 'outline'}
              size="sm"
              className={
                pathname === '/progress'
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Progress
            </Button>
          </Link>

          {/* History Icon Button (On Left of User Profile in Topbar) */}
          <Link
            href="/history"
            className="flex items-center"
            title="History & Logs"
            aria-label="History and logs"
          >
            <button
              type="button"
              className={`h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full flex items-center justify-center transition-all border select-none ${
                pathname === '/history'
                  ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow-inner'
                  : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 hover:border-zinc-700'
              }`}
            >
              <History className="h-4 w-4" />
            </button>
          </Link>

          {/* User Profile Section (Avatar with Popover Menu) */}
          <div className="pl-1 sm:pl-1.5 sm:border-l sm:border-zinc-800">
            <UserProfileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
};
