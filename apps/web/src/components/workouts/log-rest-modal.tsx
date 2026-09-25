'use client';

import React, { useState } from 'react';
import { BedDouble, X, Loader2, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LogRestModalProps {
  isOpen: boolean;
  dayTitle?: string;
  workoutDayId?: string;
  onClose: () => void;
  onLogRest: (data: { note?: string; workoutDayId?: string }) => Promise<void>;
}

export function LogRestModal({
  isOpen,
  dayTitle = 'Rest Day',
  workoutDayId,
  onClose,
  onLogRest,
}: LogRestModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onLogRest({
        note: note.trim() || undefined,
        workoutDayId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log rest day');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-400">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Log Rest Day</h2>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">{dayTitle}</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-3">
            <HeartPulse className="h-5 w-5 text-purple-400 shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              Log a dedicated rest and recovery day to keep your training consistency and history
              complete.
            </p>
          </div>

          {/* Recovery Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-zinc-400">
              Recovery Activity / Note (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Light walk, mobility work, 8 hours sleep"
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
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-zinc-100 font-bold text-xs h-10 rounded-xl gap-1.5 shadow-md shadow-purple-950/40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <span>Log Rest Day</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
