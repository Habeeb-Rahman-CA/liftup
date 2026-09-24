'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading && user) {
    return (
      <div className="flex-1 min-h-[100dvh] flex items-center justify-center p-8 bg-zinc-950">
        <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-end bg-zinc-950 overflow-hidden">
      {/* Background Visual with Dark Minimalist Gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bg.jpg"
          alt="LiftUp Background"
          fill
          priority
          className="object-cover object-center opacity-75 sm:opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40" />
      </div>

      {/* Bottom Content Sheet */}
      <div className="relative z-10 p-6 sm:p-10 pb-10 sm:pb-12 max-w-lg mx-auto w-full space-y-6">
        <div className="space-y-2.5">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100 leading-tight">
            Track your strength.
            <br />
            <span className="text-emerald-400">Elevate your progress!</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Minimalist, distraction-free progression tracking for strength training, routines, and
            daily workout logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-semibold h-13 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
