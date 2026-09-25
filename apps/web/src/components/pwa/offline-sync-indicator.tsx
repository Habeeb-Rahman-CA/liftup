'use client';

import React, { useState, useEffect } from 'react';
import { syncEngine, SyncStatus } from '@/lib/sync-engine';
import { AppNetworkError } from '@/lib/network-errors';
import {
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  X,
} from 'lucide-react';

export interface TransientNetworkMessage {
  id: string;
  type: 'offline' | 'timeout' | 'server_error' | 'unauthorized' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  isSavedLocally?: boolean;
}

const NETWORK_EVENT_NAME = 'liftup:network-state';

export function notifyNetworkState(
  errorOrEvent:
    | AppNetworkError
    | {
        type: TransientNetworkMessage['type'];
        title: string;
        description: string;
        isSavedLocally?: boolean;
      },
) {
  if (typeof window === 'undefined') return;

  let detail: TransientNetworkMessage;

  if (errorOrEvent instanceof AppNetworkError) {
    let type: TransientNetworkMessage['type'] = 'error';
    if (errorOrEvent.kind === 'OFFLINE') type = 'offline';
    else if (errorOrEvent.kind === 'TIMEOUT') type = 'timeout';
    else if (errorOrEvent.kind === 'SERVER_ERROR') type = 'server_error';
    else if (errorOrEvent.kind === 'UNAUTHORIZED') type = 'unauthorized';

    detail = {
      id: `msg_${Date.now()}_${Math.random()}`,
      type,
      title: errorOrEvent.userTitle,
      description: errorOrEvent.userMessage,
      isSavedLocally: errorOrEvent.isSavedLocally,
    };
  } else {
    detail = {
      id: `msg_${Date.now()}_${Math.random()}`,
      ...errorOrEvent,
    };
  }

  window.dispatchEvent(new CustomEvent(NETWORK_EVENT_NAME, { detail }));
}

export function OfflineSyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());
  const [showSyncedBanner, setShowSyncedBanner] = useState(false);
  const [transientMessage, setTransientMessage] = useState<TransientNetworkMessage | null>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(newStatus => {
      setStatus(newStatus);
      if (newStatus.state === 'synced') {
        setShowSyncedBanner(true);
        const timer = setTimeout(() => setShowSyncedBanner(false), 3500);
        return () => clearTimeout(timer);
      }
    });

    const handleNetworkMessage = (e: Event) => {
      const customEvent = e as CustomEvent<TransientNetworkMessage>;
      if (customEvent.detail) {
        setTransientMessage(customEvent.detail);
        const timer = setTimeout(() => setTransientMessage(null), 4500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(NETWORK_EVENT_NAME, handleNetworkMessage);

    return () => {
      unsubscribe();
      window.removeEventListener(NETWORK_EVENT_NAME, handleNetworkMessage);
    };
  }, []);

  // 1. Transient toast message (Timeout, Server Error, Explicit Warning)
  if (transientMessage && status.isOnline) {
    const getIcon = () => {
      switch (transientMessage.type) {
        case 'offline':
          return <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />;
        case 'timeout':
          return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
        case 'server_error':
          return <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />;
        case 'unauthorized':
          return <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />;
        default:
          return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      }
    };

    const getBgColor = () => {
      if (transientMessage.type === 'server_error' || transientMessage.type === 'unauthorized') {
        return 'bg-zinc-900/95 border-rose-900/60 text-zinc-100 shadow-rose-950/20';
      }
      return 'bg-zinc-900/95 border-amber-800/60 text-zinc-100 shadow-amber-950/20';
    };

    return (
      <div
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] sm:w-auto flex items-start gap-3 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300 ${getBgColor()}`}
      >
        <div className="pt-0.5">{getIcon()}</div>
        <div className="flex-1 space-y-0.5">
          <p className="text-xs font-semibold leading-tight">{transientMessage.title}</p>
          <p className="text-[11px] text-zinc-400 leading-snug">{transientMessage.description}</p>
        </div>
        <button
          onClick={() => setTransientMessage(null)}
          className="p-1 -mr-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // 2. Persistent Offline Banner (When device has no internet)
  if (!status.isOnline || status.state === 'offline') {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-600/40 text-amber-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
        <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>No internet &bull; Workout saved locally</span>
        {status.pendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-amber-800/80 text-[10px] font-bold text-amber-100">
            {status.pendingCount} queued
          </span>
        )}
      </div>
    );
  }

  // 3. Syncing in progress
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

  // 4. Just finished syncing
  if (showSyncedBanner) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-medium shadow-lg shadow-black/50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span>All offline workout data synced!</span>
      </div>
    );
  }

  // 5. Pending items exist but idle (network available)
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
