'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overscroll-none touch-none"
      onClick={e => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 touch-auto"
        role="alertdialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                variant === 'danger'
                  ? 'bg-red-950/70 border-red-900/80 text-red-400'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">{title}</h2>
              <p className="text-[11px] text-zinc-400">Please review before proceeding</p>
            </div>
          </div>
          <button
            disabled={isLoading}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 text-xs text-zinc-300 leading-relaxed space-y-2">
          {description}
        </div>

        {/* Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs h-9 px-3.5 rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`text-xs h-9 px-4 rounded-xl font-medium gap-1.5 transition-colors ${
              variant === 'danger'
                ? 'bg-red-950 hover:bg-red-900 text-red-200 border border-red-800'
                : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {variant === 'danger' && <Trash2 className="h-3.5 w-3.5" />}
                <span>{confirmLabel}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
