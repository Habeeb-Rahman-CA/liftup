'use client';

import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    const requestLock = async () => {
      try {
        sentinelRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinelRef.current?.release().catch(() => {});
    };
  }, [enabled]);
}
