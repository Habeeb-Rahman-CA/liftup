import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ActiveWorkoutProvider } from '@/context/active-workout-context';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ActiveWorkoutBar } from '@/components/layout/active-workout-bar';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { OfflineSyncIndicator } from '@/components/pwa/offline-sync-indicator';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://liftup.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'LiftUp - Workout & Strength Tracking',
    template: '%s | LiftUp',
  },
  description:
    'Minimalist strength & workout tracking mobile PWA. Log workouts, progressive overload benchmarks, and daily nutrition.',
  applicationName: 'LiftUp',
  keywords: [
    'workout tracker',
    'gym log',
    'progressive overload',
    'strength training',
    'workout routines',
    'meal planning',
    'nutrition tracker',
    'PWA workout app',
  ],
  authors: [{ name: 'LiftUp' }],
  creator: 'LiftUp',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'LiftUp',
    title: 'LiftUp - Workout & Strength Tracking',
    description:
      'Minimalist strength & workout tracking mobile PWA. Log workouts, progressive overload benchmarks, and daily nutrition.',
    images: [
      {
        url: '/hajime-hero-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'LiftUp - Minimalist Workout Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiftUp - Workout & Strength Tracking',
    description:
      'Minimalist strength & workout tracking mobile PWA. Log workouts, progressive overload benchmarks, and daily nutrition.',
    images: ['/hajime-hero-bg.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LiftUp',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-950 selection:text-emerald-300">
        <AuthProvider>
          <ActiveWorkoutProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <ActiveWorkoutBar />
            <BottomNav />
            <ServiceWorkerRegister />
            <OfflineSyncIndicator />
          </ActiveWorkoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
