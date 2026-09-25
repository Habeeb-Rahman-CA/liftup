'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check if there is already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }

        // Check for updates periodically and on visibility change
        const checkForUpdates = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(err => {
              console.debug('[SW] Background update check:', err);
            });
          }
        };

        document.addEventListener('visibilitychange', checkForUpdates);

        // Listen for incoming new service worker versions
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                setWaitingWorker(installingWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      } catch (error) {
        console.error('[SW] Service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] sm:w-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/95 border border-emerald-700/80 shadow-2xl shadow-black/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-100 truncate">New Version Available</p>
          <p className="text-[11px] text-zinc-400 truncate">Tap update to apply latest features</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={isUpdating}
          onClick={handleUpdate}
          className="h-8 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{isUpdating ? 'Updating...' : 'Update'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUpdatePrompt(false)}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Dismiss update prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
