'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TermsModal } from '@/components/terms/terms-modal';
import { User, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register: registerUser, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [timezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service to register.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        timezone,
      });
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
          <p className="text-xs sm:text-sm text-zinc-400">Enter your registration information</p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto py-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-900/60 bg-zinc-900 text-red-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="pl-10 pr-4 h-12 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-700 text-sm transition-colors"
            />
          </div>
        </div>

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
              autoComplete="new-password"
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="h-5 w-5 rounded-md border-zinc-700 bg-zinc-900 text-emerald-600 focus:ring-emerald-800 accent-emerald-600 cursor-pointer touch-manipulation"
          />
          <label htmlFor="terms" className="text-zinc-400 select-none cursor-pointer">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              Terms of Services
            </button>
          </label>
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
                <span>Creating account...</span>
              </div>
            ) : (
              'Register'
            )}
          </Button>
        </div>
      </form>

      {/* Bottom Footer Link */}
      <div className="pb-6 sm:pb-8 text-center text-xs text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 ml-1"
        >
          Sign in
        </Link>
      </div>

      {/* Terms & Conditions Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreeTerms(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
}
