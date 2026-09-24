'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Shield,
  HeartPulse,
  Scale,
  Lock,
  FileText,
  Check,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80">
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Terms of Service & Health Waiver
              </h2>
              <p className="text-[11px] text-zinc-400">
                Official Legal Documentation • Version 1.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close terms modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content (All Legal Documentation Included) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Scale className="h-3.5 w-3.5 shrink-0" />
              <h3>1. Agreement & Acceptance of Terms</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              By creating an account, accessing, or using the LiftUp platform (&quot;Service&quot;),
              you enter into a legally binding agreement to comply with and be bound by these Terms
              of Service. If you disagree with any portion of these provisions, you must not
              register or use this platform.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <HeartPulse className="h-3.5 w-3.5 shrink-0" />
              <h3>2. Physical Health & Medical Disclaimer</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              LiftUp is purely an electronic tool designed for tracking strength training sets,
              volume, and progressive overload. LiftUp does not provide medical advice, diagnosis,
              certified physical therapy, or personal fitness coaching.
            </p>
            <ul className="text-zinc-400 text-[11px] list-disc list-inside space-y-1 pl-1">
              <li>
                <strong className="text-zinc-300">Physician Consultation:</strong> Consult a
                qualified medical practitioner before undertaking any high-intensity weightlifting
                or resistance regimen.
              </li>
              <li>
                <strong className="text-zinc-300">Emergency Stop:</strong> If you experience chest
                tightness, irregular heartbeat, shortness of breath, dizziness, or sharp pain during
                exercise, halt activity immediately and seek medical attention.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <h3>3. Assumption of Risk & Liability Release</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Heavy barbell lifting, dumbbell exercises, and athletic training carry inherent risks
              of physical injury, including sprains, tears, fractures, or severe disability.
            </p>
            <p className="text-zinc-400 text-[11px]">
              You acknowledge that all workouts logged and performed are done entirely at your own
              voluntary risk. You release LiftUp, its developers, and affiliates from any liability,
              injury claims, or damages resulting from your physical activities.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <h3>4. Data Ownership & Privacy Safeguards</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Your workout history, weight lifted, and progression routines belong exclusively to
              you. Your passwords and authentication tokens are secured with industry-standard
              cryptographic hashing.
            </p>
            <p className="text-zinc-400 text-[11px]">
              We do not sell, rent, or distribute your personal exercise data to third-party
              brokers, advertisers, or insurers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <h3>5. Account Security & Acceptable Use</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              You are responsible for safeguarding your login credentials and for all actions taken
              under your account. You agree not to attempt unauthorized access, reverse-engineering,
              or automated extraction of service systems.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 p-3.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <h3>6. Modifications to Service</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              We reserve the right to enhance, update, or modify application features to maintain
              service performance and security. Continued use following any policy revisions
              constitutes agreement to updated terms.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs h-9 px-3.5 rounded-xl"
          >
            Close
          </Button>
          {onAccept && (
            <Button
              type="button"
              onClick={onAccept}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl font-medium gap-1.5 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />I Accept Terms
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
