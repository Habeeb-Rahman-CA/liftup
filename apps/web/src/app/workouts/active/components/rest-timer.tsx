'use client';

import React, { useState, useEffect } from 'react';
import { Timer, X, Plus, Minus, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestTimerProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RestTimer({ initialSeconds = 90, isOpen, onClose }: RestTimerProps) {
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  // Reset when opened with a new duration
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(targetSeconds);
      setIsRunning(true);
    }
  }, [isOpen, targetSeconds]);

  // Countdown effect
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    if (secondsRemaining <= 0) {
      // Beep or vibrate if supported
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // ignore
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, secondsRemaining]);

  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / targetSeconds) * 100));

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const adjustTime = (delta: number) => {
    setSecondsRemaining(prev => Math.max(10, prev + delta));
    setTargetSeconds(prev => Math.max(10, prev + delta));
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex flex-col bg-zinc-950/95 border border-emerald-600/70 rounded-2xl p-3.5 shadow-2xl shadow-black backdrop-blur-md w-64 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Timer className="h-4 w-4 animate-spin-slow" />
            <span>Rest Timer</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            title="Close Rest Timer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex items-baseline justify-between">
          <span
            className={`font-mono text-2xl font-bold tracking-tight ${
              secondsRemaining === 0
                ? 'text-emerald-400 animate-pulse'
                : secondsRemaining <= 10
                  ? 'text-amber-400'
                  : 'text-zinc-100'
            }`}
          >
            {formatMinSec(secondsRemaining)}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustTime(-15)}
              className="px-1.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-zinc-800"
              title="-15 seconds"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => adjustTime(30)}
              className="px-1.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-[10px] font-mono border border-zinc-800"
              title="+30 seconds"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => {
                setSecondsRemaining(targetSeconds);
                setIsRunning(true);
              }}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining === 0
                ? 'bg-emerald-400'
                : secondsRemaining <= 10
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
