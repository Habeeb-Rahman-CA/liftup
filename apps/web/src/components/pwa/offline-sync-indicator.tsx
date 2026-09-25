'use client';

import React, { useState, useEffect } from 'react';
import { syncEngine, SyncStatus } from '@/lib/sync-engine';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function OfflineSyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());
  const [showSyncedBanner, setShowSyncedBanner] = useState(false);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(newStatus => {
      setStatus(newStatus);
      if (newStatus.state === 'synced') {
        setShowSyncedBanner(true);
        const timer = setTimeout(() => setShowSyncedBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Offline Banner / Status Pill
  if (!status.isOnline || status.state === 'offline') {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-600/40 text-amber-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
        <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>Offline Mode &bull; Workout saved locally</span>
        {status.pendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-800/80 text-[10px] font-bold text-amber-100">
            {status.pendingCount} queued
          </span>
        )}
      </div>
    );
  }

  // 2. Syncing in progress
  if (status.state === 'syncing') {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-600/40 text-emerald-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
        <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
        <span>
          Syncing {status.pendingCount} offline update{status.pendingCount > 1 ? 's' : ''}...
        </span>
      </div>
    );
  }

  // 3. Just finished syncing
  if (showSyncedBanner) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span>All offline workout data synced!</span>
      </div>
    );
  }

  // 4. Pending items exist but idle (network available)
  if (status.pendingCount > 0) {
    return (
      <div
        onClick={() => syncEngine.processQueue()}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md cursor-pointer hover:bg-zinc-800 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
        <span>
          {status.pendingCount} offline change{status.pendingCount > 1 ? 's' : ''} pending
        </span>
        <span className="text-emerald-400 text-[11px] underline">Sync</span>
      </div>
    );
  }

  return null;
}
