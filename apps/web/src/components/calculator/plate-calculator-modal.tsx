'use client';

import React, { useState } from 'react';
import { Calculator, X, Scale, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
  initialWeight?: number;
}

const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-600 border-red-500 text-white',
  20: 'bg-blue-600 border-blue-500 text-white',
  15: 'bg-amber-500 border-amber-400 text-zinc-950',
  10: 'bg-emerald-600 border-emerald-500 text-white',
  5: 'bg-zinc-200 border-zinc-100 text-zinc-950',
  2.5: 'bg-zinc-700 border-zinc-600 text-zinc-100',
  1.25: 'bg-zinc-800 border-zinc-700 text-zinc-300',
};

const PLATE_HEIGHTS: Record<number, string> = {
  25: 'h-24 sm:h-28',
  20: 'h-22 sm:h-24',
  15: 'h-20 sm:h-22',
  10: 'h-16 sm:h-18',
  5: 'h-14 sm:h-16',
  2.5: 'h-12 sm:h-14',
  1.25: 'h-10 sm:h-12',
};

export function PlateCalculatorModal({
  isOpen,
  onClose,
  onApplyWeight,
  initialWeight = 60,
}: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [barWeight, setBarWeight] = useState<number>(20);

  if (!isOpen) return null;

  // Calculate plates per side
  const calculatePlates = () => {
    let weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);
    const result: { weight: number; count: number }[] = [];

    for (const plate of AVAILABLE_PLATES_KG) {
      const count = Math.floor(weightPerSide / plate);
      if (count > 0) {
        result.push({ weight: plate, count });
        weightPerSide -= count * plate;
      }
    }

    const totalCalculated = barWeight + result.reduce((acc, p) => acc + p.weight * p.count, 0) * 2;
    const remainder = Math.max(0, targetWeight - totalCalculated);

    return { plates: result, totalCalculated, remainder };
  };

  const { plates, totalCalculated, remainder } = calculatePlates();

  const PRESETS = [40, 60, 80, 100, 120, 140, 160, 180, 200];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
          <div className="flex items-center gap-2 text-emerald-400">
            <Calculator className="h-5 w-5" />
            <h3 className="font-bold text-base text-zinc-100">Barbell Plate Calculator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Weight Inputs & Bar Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-xs font-mono font-medium text-zinc-400 block mb-1">
                TARGET TOTAL (KG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="2.5"
                  min="0"
                  value={targetWeight || ''}
                  onChange={e => setTargetWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-3 font-mono font-bold text-xl text-zinc-100 text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-zinc-400 block mb-1">
                BAR WEIGHT
              </label>
              <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBarWeight(20)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    barWeight === 20
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  20kg
                </button>
                <button
                  type="button"
                  onClick={() => setBarWeight(15)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    barWeight === 15
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  15kg
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold block">
              QUICK TARGET PRESETS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(weight => (
                <button
                  key={weight}
                  type="button"
                  onClick={() => setTargetWeight(weight)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                    targetWeight === weight
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {weight}kg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Barbell Display */}
        <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800/80 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">PER SIDE BREAKDOWN</span>
            <span className="text-emerald-400 font-bold">
              {plates.length > 0
                ? `${((totalCalculated - barWeight) / 2).toFixed(1)}kg / side`
                : 'No plates needed'}
            </span>
          </div>

          {/* Visual Bar Sleeve */}
          <div className="flex items-center justify-center h-32 bg-zinc-950 rounded-xl border border-zinc-800/60 overflow-x-auto px-4 relative">
            {/* Barbell sleeve rod */}
            <div className="absolute inset-x-0 h-4 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 shadow-inner z-0" />

            {/* Collar */}
            <div className="h-20 w-3 bg-zinc-400 rounded-sm shadow-md z-10 mr-1 border border-zinc-300" />

            {/* Plates on Bar */}
            <div className="flex items-center gap-1 z-10">
              {plates.flatMap((p, pIdx) =>
                Array.from({ length: p.count }).map((_, cIdx) => (
                  <div
                    key={`${pIdx}-${cIdx}`}
                    className={`w-5 sm:w-6 ${PLATE_HEIGHTS[p.weight]} ${
                      PLATE_COLORS[p.weight]
                    } rounded-md border flex items-center justify-center font-mono font-black text-[10px] shadow-lg transform hover:scale-105 transition-transform`}
                  >
                    <span className="-rotate-90">{p.weight}</span>
                  </div>
                )),
              )}

              {plates.length === 0 && (
                <span className="text-xs text-zinc-600 font-mono z-10 px-4 bg-zinc-950/80 rounded py-1">
                  Empty Bar ({barWeight}kg)
                </span>
              )}
            </div>
          </div>

          {/* Text Plate Summary */}
          {plates.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {plates.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-zinc-200"
                >
                  {p.count}× <span className="text-emerald-400">{p.weight}kg</span>
                </span>
              ))}
            </div>
          )}

          {remainder > 0 && (
            <p className="text-[11px] font-mono text-amber-400 text-center">
              ⚠️ {remainder.toFixed(2)}kg remaining (cannot be matched cleanly with standard plates)
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </Button>

          {onApplyWeight && (
            <Button
              type="button"
              onClick={() => {
                onApplyWeight(targetWeight);
                onClose();
              }}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 font-bold gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Apply {targetWeight}kg</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
