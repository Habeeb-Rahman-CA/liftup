'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, HeartPulse, Scale, Lock, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8 py-6 sm:py-10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/liftup-dark.png"
              alt="LiftUp"
              width={110}
              height={30}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link href="/register">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-xs h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back to Register
            </Button>
          </Link>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-medium">
            <FileText className="h-3.5 w-3.5" />
            Legal Documentation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Terms of Service & Health Disclaimer
          </h1>
          <p className="text-xs text-zinc-500">
            Effective Date: September 24, 2026 • Version 1.0.0
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <Scale className="h-4 w-4" />
              <h2>1. Agreement to Terms</h2>
            </div>
            <p className="text-xs text-zinc-400">
              By creating an account, accessing, or using the LiftUp platform (the
              &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not
              agree with any part of these terms, you may not register or utilize the Service.
            </p>
          </div>

          {/* Section 2 */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <HeartPulse className="h-4 w-4" />
              <h2>2. Physical Health & Medical Exercise Disclaimer</h2>
            </div>
            <p className="text-xs text-zinc-400">
              LiftUp is purely a software utility designed for digital workout logging, progressive
              overload tracking, and routine management. LiftUp does not provide medical advice,
              diagnosis, physical therapy, or certified coaching.
            </p>
            <ul className="text-xs text-zinc-400 list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong>Consult a Physician:</strong> Always seek the guidance of a qualified
                medical doctor before beginning any resistance training, heavy weightlifting, or
                high-intensity exercise regimen.
              </li>
              <li>
                <strong>Listen to Your Body:</strong> If you experience dizziness, nausea, chest
                pain, shortness of breath, or sharp joint pain while exercising, cease activity
                immediately and seek medical attention.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <Shield className="h-4 w-4" />
              <h2>3. Assumption of Risk & Liability Waiver</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Weight training, barbell exercise, and athletic conditioning involve inherent physical
              risks, including muscle strains, fractures, or severe injury. By utilizing LiftUp:
            </p>
            <p className="text-xs text-zinc-400">
              You explicitly acknowledge and agree that you perform all exercises, warmups, and
              working sets at your own voluntary risk. You agree to hold LiftUp, its creators, and
              affiliates harmless from any physical injuries, equipment failures, or damages arising
              from your exercise sessions.
            </p>
          </div>

          {/* Section 4 */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <Lock className="h-4 w-4" />
              <h2>4. User Data Ownership & Privacy</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Your workout history, set records, kilograms lifted, and progression data are your
              personal property. LiftUp safeguards your authentication credentials using
              industry-standard cryptographic hashing and secure JWT tokens.
            </p>
            <p className="text-xs text-zinc-400">
              We do not sell, rent, or trade your workout logs or personal health information to
              third-party advertisers or data brokers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <FileText className="h-4 w-4" />
              <h2>5. Account Security & Responsibilities</h2>
            </div>
            <p className="text-xs text-zinc-400">
              You are responsible for maintaining the confidentiality of your account password and
              are solely responsible for all activities occurring under your credentials. You agree
              to immediately notify LiftUp if you discover any unauthorized access to your account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} LiftUp. All rights reserved. Built for strength progression.
        </div>
      </div>
    </div>
  );
}
