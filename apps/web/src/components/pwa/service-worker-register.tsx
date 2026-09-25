'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

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
                console.log('[SW] New version available; will activate on reload or claim.');
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

  return null;
}
