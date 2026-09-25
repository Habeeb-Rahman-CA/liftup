'use client';

import React from 'react';
import { WifiOff, RotateCcw, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex-1 min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6 bg-zinc-950 text-zinc-100">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Offline Icon Illustration */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-black/40">
          <WifiOff className="h-9 w-9 text-emerald-400" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            You're currently offline
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
            LiftUp cached your app shell so you can keep logging sets. When your connection returns,
            syncing will resume automatically.
          </p>
        </div>

        {/* Offline Gym Tip Banner */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Dumbbell className="h-4 w-4" />
            <span>Active Workout Safe</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your current workout and logged sets are stored securely in local device storage and
            will not be lost.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-3">
          <Button
            onClick={handleReload}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-950/40"
          >
            <RotateCcw className="h-4 w-4" />
            Try Reconnecting
          </Button>
        </div>
      </div>
    </div>
  );
}
