'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Zap, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA / standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const dismissedStorage = localStorage.getItem('liftup_pwa_install_dismissed');
    if (dismissedStorage) {
      setIsDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('liftup_pwa_install_dismissed', 'true');
  };

  if (isStandalone || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl bg-zinc-900/95 border border-emerald-500/30 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                Install LiftUp App
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                Track workouts offline with zero lag & keep display awake in gym.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-emerald-950 font-semibold text-xs h-9 rounded-xl gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 h-9 px-3 rounded-xl"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
