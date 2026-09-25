'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FoodDto, CreateFoodDto, UpdateFoodDto } from '@liftup/types';

interface CreateFoodModalProps {
  isOpen: boolean;
  foodToEdit?: FoodDto | null;
  onClose: () => void;
  onSave: (data: CreateFoodDto | UpdateFoodDto) => Promise<void>;
}

export function CreateFoodModal({ isOpen, foodToEdit, onClose, onSave }: CreateFoodModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PROTEIN');
  const [description, setDescription] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [benefits, setBenefits] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (foodToEdit) {
      setName(foodToEdit.name || '');
      setCategory(foodToEdit.category || 'PROTEIN');
      setDescription(foodToEdit.description || '');
      setServingSize(foodToEdit.servingSize ? String(foodToEdit.servingSize) : '100');
      setServingUnit(foodToEdit.servingUnit || 'g');
      setCalories(
        foodToEdit.calories !== null && foodToEdit.calories !== undefined
          ? String(foodToEdit.calories)
          : '',
      );
      setProtein(
        foodToEdit.protein !== null && foodToEdit.protein !== undefined
          ? String(foodToEdit.protein)
          : '',
      );
      setCarbs(
        foodToEdit.carbs !== null && foodToEdit.carbs !== undefined ? String(foodToEdit.carbs) : '',
      );
      setFat(foodToEdit.fat !== null && foodToEdit.fat !== undefined ? String(foodToEdit.fat) : '');
      setFiber(
        foodToEdit.fiber !== null && foodToEdit.fiber !== undefined ? String(foodToEdit.fiber) : '',
      );
      setBenefits(foodToEdit.benefits || '');
      setNotes(foodToEdit.notes || '');
    } else {
      setName('');
      setCategory('PROTEIN');
      setDescription('');
      setServingSize('100');
      setServingUnit('g');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('');
      setBenefits('');
      setNotes('');
    }
    setError(null);
  }, [foodToEdit, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Food name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: CreateFoodDto = {
        name: name.trim(),
        category: category.trim().toUpperCase(),
        description: description.trim() || undefined,
        servingSize: servingSize ? parseFloat(servingSize) : 100,
        servingUnit: servingUnit.trim() || 'g',
        calories: calories ? parseFloat(calories) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        fiber: fiber ? parseFloat(fiber) : undefined,
        benefits: benefits.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save food item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overscroll-none touch-none animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 touch-auto"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
              <Apple className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                {foodToEdit ? 'Edit Food Item' : 'Add Custom Food'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {foodToEdit
                  ? 'Update nutritional macros and details'
                  : 'Add a new food to your library'}
              </p>
            </div>
          </div>
          <button
            disabled={saving}
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-900 text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Food Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Food Name *</label>
                <Input
                  type="text"
                  placeholder="e.g. Grilled Chicken Breast"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-9 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="PROTEIN">PROTEIN</option>
                  <option value="CARBS">CARBS</option>
                  <option value="FATS">FATS</option>
                  <option value="SUPERFOODS">SUPERFOODS</option>
                </select>
              </div>
            </div>

            {/* Serving Size & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Serving Size</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="100"
                  value={servingSize}
                  onChange={e => setServingSize(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-9 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Serving Unit</label>
                <Input
                  type="text"
                  placeholder="g, ml, pcs, etc."
                  value={servingUnit}
                  onChange={e => setServingUnit(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Macros Breakdown (Per Serving) */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-zinc-300 block">
                Macronutrient Profile (Per Serving)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-mono">Calories (kcal)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 165"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-red-400 font-mono">Protein (g)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 31"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-amber-400 font-mono">Carbs (g)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 0"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-blue-400 font-mono">Fats (g)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.6"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="w-1/2 pr-1.5">
                <label className="text-[10px] text-zinc-400 font-mono">Dietary Fiber (g)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 2.5"
                  value={fiber}
                  onChange={e => setFiber(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs h-8 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Description</label>
              <Textarea
                rows={2}
                placeholder="Brief summary of the food..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs rounded-xl"
              />
            </div>

            {/* Superfood & Health Benefits */}
            <div className="space-y-1.5">
              <label className="font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Superfood & Health Benefits</span>
              </label>
              <Textarea
                rows={2}
                placeholder="e.g. High in antioxidants, nitric oxide booster, rich in micronutrients..."
                value={benefits}
                onChange={e => setBenefits(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs rounded-xl"
              />
            </div>

            {/* Notes & Culinary Tips */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-300">Preparation & Culinary Notes</label>
              <Input
                type="text"
                placeholder="e.g. Best weighed raw, steam lightly..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-9 rounded-xl"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-zinc-800 bg-zinc-900/60 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={onClose}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs h-8 px-3 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-4 rounded-xl font-medium gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{foodToEdit ? 'Save Changes' : 'Add to Library'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
