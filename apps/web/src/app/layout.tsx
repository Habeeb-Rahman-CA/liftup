import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ActiveWorkoutProvider } from '@/context/active-workout-context';
import { Navbar } from '@/components/layout/navbar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ActiveWorkoutBar } from '@/components/layout/active-workout-bar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'LiftUp - Workout & Strength Tracking',
  description: 'Minimalist strength & workout tracking mobile PWA and web platform.',
  applicationName: 'LiftUp',
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
          </ActiveWorkoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
