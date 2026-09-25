import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://liftup.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/terms'],
        disallow: [
          '/dashboard',
          '/workouts',
          '/meals',
          '/history',
          '/progress',
          '/exercises',
          '/foods',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
