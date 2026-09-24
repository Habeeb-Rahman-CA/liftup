'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Dumbbell, Calendar } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loading } = useAuth();
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

        {/* In-app Controls */}
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
              variant={pathname === '/workouts' ? 'default' : 'outline'}
              size="sm"
              className={
                pathname === '/workouts'
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Schedule
            </Button>
          </Link>

          <Link href="/exercises" className="hidden sm:inline-flex">
            <Button
              variant={pathname === '/exercises' ? 'default' : 'outline'}
              size="sm"
              className={
                pathname === '/exercises'
                  ? 'bg-emerald-900 border border-emerald-700 text-emerald-200 hover:bg-emerald-800 h-8 text-xs'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-8 text-xs'
              }
            >
              <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
              Exercises
            </Button>
          </Link>
          <div className="flex items-center gap-1.5 px-1.5 sm:px-2 sm:border-l sm:border-zinc-800 text-xs text-zinc-400">
            <span className="truncate max-w-[120px] sm:max-w-none">
              {user.name || user.email.split('@')[0]}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 h-8 px-2 text-xs"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
