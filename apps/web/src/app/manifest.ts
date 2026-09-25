import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LiftUp - Workout & Strength Tracker',
    short_name: 'LiftUp',
    description: 'Personal fitness and workout progression tracking application.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait',
    categories: ['fitness', 'health', 'sports', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
