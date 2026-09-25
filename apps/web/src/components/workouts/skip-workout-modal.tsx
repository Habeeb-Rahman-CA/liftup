'use client';

import React, { useState } from 'react';
import {
  Moon,
  Thermometer,
  Briefcase,
  HeartPulse,
  MoreHorizontal,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SkipReasonType } from '@liftup/types';

interface SkipWorkoutModalProps {
  isOpen: boolean;
  workoutTitle?: string;
  workoutDayId?: string;
  sessionId?: string;
  onClose: () => void;
  onSkip: (data: {
    skipReason: string;
    note?: string;
    workoutDayId?: string;
    sessionId?: string;
  }) => Promise<void>;
}

const SKIP_REASONS: {
  id: SkipReasonType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'Lack of sleep',
    label: 'Lack of sleep',
    icon: Moon,
    description: 'Under-rested, low energy or insufficient sleep',
  },
  {
    id: 'Feeling unwell',
    label: 'Feeling unwell',
    icon: Thermometer,
    description: 'Sick, fatigued, or fighting off symptoms',
  },
  {
    id: 'Busy',
    label: 'Busy',
    icon: Briefcase,
    description: 'Work, travel, or unexpected commitments',
  },
  {
    id: 'Recovery',
    label: 'Recovery',
    icon: HeartPulse,
    description: 'Muscles or joints need extra recovery time',
  },
  {
    id: 'Other',
    label: 'Other',
    icon: MoreHorizontal,
    description: 'Custom reason or personal circumstances',
  },
];

export function SkipWorkoutModal({
  isOpen,
  workoutTitle = 'Workout Session',
  workoutDayId,
  sessionId,
  onClose,
  onSkip,
}: SkipWorkoutModalProps) {
  const [selectedReason, setSelectedReason] = useState<SkipReasonType>('Lack of sleep');
  const [customReason, setCustomReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const finalReason =
      selectedReason === 'Other' && customReason.trim() ? customReason.trim() : selectedReason;

    try {
      await onSkip({
        skipReason: finalReason,
        note: note.trim() || undefined,
        workoutDayId,
        sessionId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to skip workout session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-safe bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col modal-safe-bounds animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Skip Workout</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">{workoutTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Prompt: Why? */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
              Why?
            </label>

            <div className="space-y-1.5">
              {SKIP_REASONS.map(reason => {
                const isSelected = selectedReason === reason.id;
                const IconComponent = reason.icon;

                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left select-none ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-600/80 text-amber-200 shadow-sm'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? 'bg-amber-900/60 border-amber-700 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{reason.label}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {reason.description}
                        </p>
                      </div>
                    </div>

                    {/* Radio bullet indicator */}
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                        isSelected ? 'border-amber-400 bg-amber-500' : 'border-zinc-700 bg-zinc-950'
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-zinc-950" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Custom Reason Input if 'Other' selected */}
          {selectedReason === 'Other' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-mono text-zinc-400">Specify Reason</label>
              <Input
                type="text"
                placeholder="e.g. Travel / Gym closed / Injury"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                className="h-9 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl placeholder:text-zinc-600"
                autoFocus
              />
            </div>
          )}

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-zinc-400">Note (Optional)</label>
            <Input
              type="text"
              placeholder="Add an optional note..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="h-10 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl placeholder:text-zinc-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs h-10 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs h-10 rounded-xl gap-1.5 shadow-md shadow-amber-950/40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Skipping...</span>
                </>
              ) : (
                <span>Skip Workout</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
