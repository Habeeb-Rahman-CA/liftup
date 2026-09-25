'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, Clock } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSessionExpired = searchParams?.get('reason') === 'session_expired';

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('liftup_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access errors if blocked
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });

      try {
        if (rememberMe) {
          localStorage.setItem('liftup_remembered_email', email.trim());
        } else {
          localStorage.removeItem('liftup_remembered_email');
        }
      } catch {
        // Ignore localStorage errors
      }

      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-[100dvh] flex flex-col justify-between p-5 sm:p-8 max-w-md mx-auto w-full bg-zinc-950">
      {/* Top Header Logo & Heading */}
      <div className="pt-6 sm:pt-8 text-center space-y-4">
        <div className="flex justify-center">
          <Image
            src="/liftup-dark.png"
            alt="LiftUp"
            width={180}
            height={100}
            priority
            className="h-40 sm:h-16 w-auto object-contain"
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Start your Journey
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Enter valid email & password to continue
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto py-6">
        {/* Session Expired Alert Banner */}
        {isSessionExpired && !error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-800/80 bg-zinc-900 text-amber-300 text-xs animate-in fade-in">
            <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Session Expired</p>
              <p className="text-amber-300/90 text-[11px] mt-0.5">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          </div>
        )}

        {/* Regular Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-900/60 bg-zinc-900 text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10 pr-4 h-12 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-700 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="Enter Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-700 text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-zinc-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-5 w-5 rounded-md border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-800 accent-emerald-600 cursor-pointer touch-manipulation"
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => alert('Password reset is not configured yet for this demo.')}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-semibold h-12 rounded-xl text-base transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              'Log In'
            )}
          </Button>
        </div>
      </form>

      {/* Bottom Footer Link */}
      <div className="pb-6 sm:pb-8 text-center text-xs text-zinc-400">
        Haven&apos;t any account?{' '}
        <Link
          href="/register"
          className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 ml-1"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-[100dvh] flex items-center justify-center bg-zinc-950">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
