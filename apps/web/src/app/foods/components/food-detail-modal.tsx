'use client';

import React, { useEffect } from 'react';
import { X, Sparkles, Flame, Scale, FileText, Edit2, Trash2, Apple, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FoodDto } from '@liftup/types';

interface FoodDetailModalProps {
  isOpen: boolean;
  food: FoodDto | null;
  onClose: () => void;
  onEdit?: (food: FoodDto) => void;
  onDelete?: (food: FoodDto) => void;
}

export function FoodDetailModal({ isOpen, food, onClose, onEdit, onDelete }: FoodDetailModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen || !food) return null;

  const getCategoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'PROTEIN':
        return 'bg-red-950/80 text-red-300 border-red-800/80';
      case 'CARBS':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'FATS':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'SUPERFOODS':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      default:
        return 'bg-zinc-900 text-zinc-300 border-zinc-700';
    }
  };

  const calories = food.calories ?? 0;
  const protein = food.protein ?? 0;
  const carbs = food.carbs ?? 0;
  const fat = food.fat ?? 0;
  const fiber = food.fiber ?? 0;

  const totalMacroGrams = protein + carbs + fat;
  const proteinPercent = totalMacroGrams > 0 ? Math.round((protein / totalMacroGrams) * 100) : 0;
  const carbsPercent = totalMacroGrams > 0 ? Math.round((carbs / totalMacroGrams) * 100) : 0;
  const fatPercent = totalMacroGrams > 0 ? Math.round((fat / totalMacroGrams) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                className={`text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(food.category)}`}
              >
                {food.category}
              </Badge>
              {food.isCustom && (
                <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] font-bold">
                  Custom
                </Badge>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 truncate">
              {food.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
              <Scale className="h-3 w-3 text-zinc-500" />
              <span>
                Per {food.servingSize || 100}
                {food.servingUnit || 'g'} serving
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {food.isCustom && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(food)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
                title="Edit food item"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {food.isCustom && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(food)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg"
                title="Delete food item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-sm">
          {/* Main Macro Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {/* Calories */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-0.5">
                Calories
              </span>
              <span className="text-base sm:text-lg font-bold text-zinc-100 font-mono">
                {calories}
              </span>
              <span className="text-[9px] text-zinc-500">kcal</span>
            </div>

            {/* Protein */}
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-0.5">
                Protein
              </span>
              <span className="text-base sm:text-lg font-bold text-red-300 font-mono">
                {protein}g
              </span>
              <span className="text-[9px] text-red-400/70">{proteinPercent}%</span>
            </div>

            {/* Carbs */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-0.5">
                Carbs
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-300 font-mono">
                {carbs}g
              </span>
              <span className="text-[9px] text-amber-400/70">{carbsPercent}%</span>
            </div>

            {/* Fat */}
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-0.5">
                Fats
              </span>
              <span className="text-base sm:text-lg font-bold text-blue-300 font-mono">{fat}g</span>
              <span className="text-[9px] text-blue-400/70">{fatPercent}%</span>
            </div>
          </div>

          {/* Macro Ratio Visual Bar */}
          {totalMacroGrams > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Macronutrient Ratio</span>
                <span>Fiber: {fiber}g</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex bg-zinc-900 border border-zinc-800">
                {proteinPercent > 0 && (
                  <div
                    style={{ width: `${proteinPercent}%` }}
                    className="bg-red-500 h-full"
                    title={`Protein: ${proteinPercent}%`}
                  />
                )}
                {carbsPercent > 0 && (
                  <div
                    style={{ width: `${carbsPercent}%` }}
                    className="bg-amber-500 h-full"
                    title={`Carbs: ${carbsPercent}%`}
                  />
                )}
                {fatPercent > 0 && (
                  <div
                    style={{ width: `${fatPercent}%` }}
                    className="bg-blue-500 h-full"
                    title={`Fats: ${fatPercent}%`}
                  />
                )}
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Protein ({proteinPercent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Carbs ({carbsPercent}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Fats ({fatPercent}%)
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          {food.description && (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Info className="h-3.5 w-3.5 text-emerald-400" />
                <span>Overview</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{food.description}</p>
            </div>
          )}

          {/* Superfood & Health Benefits */}
          {food.benefits && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/60 to-zinc-900 border border-emerald-900/70 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Superfood & Health Benefits</span>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
                {food.benefits}
              </p>
            </div>
          )}

          {/* Notes & Culinary Tips */}
          {food.notes && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                <span>Preparation & Culinary Notes</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">{food.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end shrink-0">
          <Button
            size="sm"
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs h-8 px-4 rounded-xl"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
