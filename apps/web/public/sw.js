/**
 * LiftUp PWA Service Worker
 * Robust offline shell caching, intelligent cache invalidation, and zero sensitive API caching.
 */

const CACHE_VERSION = 'liftup-v1.0.1';
const STATIC_CACHE = `liftup-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `liftup-runtime-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = '/offline';

const PRECACHE_ASSETS = [
  '/',
  OFFLINE_FALLBACK,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// 1. Install Event: Precache offline shell & assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// 2. Activate Event: Clean up stale caches and claim clients immediately
self.addEventListener('activate', event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[Service Worker] Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Helper: Check if request is a sensitive API or mutation
function isApiOrSensitiveRequest(url, request) {
  // Never cache non-GET requests (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return true;
  }

  const pathname = url.pathname;

  // Next.js API routes or backend API paths
  if (
    pathname.startsWith('/api') ||
    pathname.includes('/auth') ||
    (pathname.includes('/workouts') &&
      request.headers.get('accept')?.includes('application/json')) ||
    (pathname.includes('/exercises') &&
      request.headers.get('accept')?.includes('application/json')) ||
    (pathname.includes('/schedules') &&
      request.headers.get('accept')?.includes('application/json')) ||
    (pathname.includes('/meals') && request.headers.get('accept')?.includes('application/json'))
  ) {
    return true;
  }

  // Cross-origin API calls (e.g., NestJS backend on port 4000 or external API)
  if (url.origin !== self.location.origin) {
    return true;
  }

  // Requests containing authorization headers or cookies
  if (request.headers.has('authorization')) {
    return true;
  }

  return false;
}

// 3. Fetch Event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Bypass sensitive / API / non-GET requests completely (Network-Only)
  if (isApiOrSensitiveRequest(url, request)) {
    return;
  }

  // B. HTML Document Navigation: Network-First with Offline Page Fallback
  // This ensures new deployments load immediately without getting stuck with stale HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If valid response, clone and cache for offline access
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try returning cached version of this route
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fall back to dedicated offline shell
          const offlinePage = await caches.match(OFFLINE_FALLBACK);
          return (
            offlinePage ||
            new Response('Offline - No connection available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' }),
            })
          );
        }),
    );
    return;
  }

  // C. Static Next.js assets (_next/static), CSS, JS, fonts, and images: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // D. Default fallback for other requests: Network with Cache Fallback
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// 4. Message Event: Allow skipWaiting from client update prompt
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
