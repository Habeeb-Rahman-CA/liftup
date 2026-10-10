'use client';

import React, { useState, useEffect } from 'react';
import { Delete, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NumericKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: number | null) => void;
  initialValue?: number | null;
  title?: string;
  allowDecimal?: boolean;
  unit?: string;
}

export function NumericKeypadModal({
  isOpen,
  onClose,
  onConfirm,
  initialValue = null,
  title = 'Enter Value',
  allowDecimal = true,
  unit = 'kg',
}: NumericKeypadModalProps) {
  const [valStr, setValStr] = useState<string>(
    initialValue !== null && initialValue !== undefined ? String(initialValue) : '',
  );

  useEffect(() => {
    if (isOpen) {
      setValStr(initialValue !== null && initialValue !== undefined ? String(initialValue) : '');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleKeyPress = (char: string) => {
    if (char === '.') {
      if (!allowDecimal || valStr.includes('.')) return;
      setValStr(valStr === '' ? '0.' : valStr + '.');
      return;
    }
    setValStr(valStr + char);
  };

  const handleDelete = () => {
    setValStr(valStr.slice(0, -1));
  };

  const handleClear = () => {
    setValStr('');
  };

  const handleQuickAdd = (delta: number) => {
    const current = parseFloat(valStr) || 0;
    const next = Math.max(0, current + delta);
    setValStr(String(next));
  };

  const handleConfirm = () => {
    if (valStr === '') {
      onConfirm(null);
    } else {
      const parsed = parseFloat(valStr);
      onConfirm(isNaN(parsed) ? null : parsed);
    }
    onClose();
  };

  const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : 'C', '0'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
          <span className="font-mono text-2xl font-black text-emerald-400 tracking-tight">
            {valStr || '0'}
          </span>
          <span className="text-xs font-mono text-zinc-500 uppercase font-bold">{unit}</span>
        </div>

        {/* Quick Stepper Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAdd(-5)}
            className="py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-xs text-zinc-400 font-bold active:scale-95"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(-2.5)}
            className="py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-xs text-zinc-400 font-bold active:scale-95"
          >
            -2.5
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(2.5)}
            className="py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-xs text-emerald-400 font-bold active:scale-95"
          >
            +2.5
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(5)}
            className="py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-xs text-emerald-400 font-bold active:scale-95"
          >
            +5
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2">
          {KEYPAD_KEYS.map((k, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (k === 'C') handleClear();
                else handleKeyPress(k);
              }}
              className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-lg font-bold text-zinc-100 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
            >
              {k}
            </button>
          ))}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono text-lg font-bold text-amber-400 flex items-center justify-center transition-colors active:scale-95 shadow-sm"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Footer Confirm */}
        <Button
          type="button"
          onClick={handleConfirm}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl gap-2 active:scale-95"
        >
          <Check className="h-5 w-5" />
          <span>Save Value</span>
        </Button>
      </div>
    </div>
  );
}
