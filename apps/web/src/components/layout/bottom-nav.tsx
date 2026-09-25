'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { LayoutDashboard, Dumbbell, TrendingUp, UtensilsCrossed, Layers } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (_path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
    match: path => path === '/dashboard',
  },
  {
    label: 'Workout',
    href: '/workouts',
    icon: Dumbbell,
    match: path => path.startsWith('/workouts'),
  },
  {
    label: 'Library',
    href: '/exercises',
    icon: Layers,
    match: path => path.startsWith('/exercises') || path.startsWith('/foods'),
  },
  {
    label: 'Meals',
    href: '/meals',
    icon: UtensilsCrossed,
    match: path => path.startsWith('/meals'),
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    match: path => path === '/progress',
  },
];

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-lg pb-safe"
    >
      <div className="flex items-center justify-between h-14 max-w-md mx-auto px-3">
        {NAV_ITEMS.map(item => {
          const isActive = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center h-10 px-2.5 rounded-xl select-none touch-manipulation transition-colors duration-250 ease-out ${
                isActive
                  ? 'bg-zinc-900 border border-zinc-750 text-emerald-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-250 ease-out" />

              {/* Smooth Grid-Accordion Expansion for Label */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isActive ? '1fr' : '0fr',
                  transition:
                    'grid-template-columns 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out',
                  opacity: isActive ? 1 : 0,
                }}
              >
                <div className="overflow-hidden whitespace-nowrap">
                  <span className="text-xs font-semibold text-zinc-100 pl-1.5 block">
                    {item.label}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
