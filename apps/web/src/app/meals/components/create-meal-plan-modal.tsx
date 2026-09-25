'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UtensilsCrossed, X, Plus, Trash2 } from 'lucide-react';
import type { CreateMealPlanDto } from '@liftup/types';

interface CreateMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateMealPlanDto) => Promise<void>;
}

export const CreateMealPlanModal: React.FC<CreateMealPlanModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState<
    { name: string; time?: string; items: { name: string; quantity?: number; unit?: string }[] }[]
  >([
    { name: 'Meal 1', items: [{ name: '', quantity: undefined, unit: '' }] },
    { name: 'Meal 2', items: [{ name: '', quantity: undefined, unit: '' }] },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMeal = () => {
    setMeals(prev => [
      ...prev,
      { name: `Meal ${prev.length + 1}`, items: [{ name: '', quantity: undefined, unit: '' }] },
    ]);
  };

  const handleRemoveMeal = (mealIndex: number) => {
    setMeals(prev => prev.filter((_, i) => i !== mealIndex));
  };

  const handleAddItem = (mealIndex: number) => {
    setMeals(prev =>
      prev.map((m, i) =>
        i === mealIndex
          ? { ...m, items: [...m.items, { name: '', quantity: undefined, unit: '' }] }
          : m,
      ),
    );
  };

  const handleRemoveItem = (mealIndex: number, itemIndex: number) => {
    setMeals(prev =>
      prev.map((m, i) =>
        i === mealIndex ? { ...m, items: m.items.filter((_, j) => j !== itemIndex) } : m,
      ),
    );
  };

  const handleMealNameChange = (mealIndex: number, val: string) => {
    setMeals(prev => prev.map((m, i) => (i === mealIndex ? { ...m, name: val } : m)));
  };

  const handleItemChange = (
    mealIndex: number,
    itemIndex: number,
    field: 'name' | 'quantity' | 'unit',
    val: any,
  ) => {
    setMeals(prev =>
      prev.map((m, i) =>
        i === mealIndex
          ? {
              ...m,
              items: m.items.map((it, j) => (j === itemIndex ? { ...it, [field]: val } : it)),
            }
          : m,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a meal plan name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedMeals = meals
        .filter(m => m.name.trim())
        .map((m, mIdx) => ({
          name: m.name.trim(),
          orderIndex: mIdx + 1,
          time: m.time,
          items: m.items
            .filter(it => it.name.trim())
            .map((it, itIdx) => ({
              name: it.name.trim(),
              quantity: it.quantity ? Number(it.quantity) : undefined,
              unit: it.unit?.trim() || undefined,
              orderIndex: itIdx + 1,
            })),
        }));

      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        meals: formattedMeals,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create meal plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative my-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Create Meal Plan</h3>
              <p className="text-xs text-zinc-400">Configure daily meals & food items</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Plan Name *
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cutting Nutrition Plan, High Protein 4-Meal"
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Description (Optional)
            </label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Standard diet split for active training days"
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
            />
          </div>

          {/* Meals Setup */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300">
                Meals in this Plan ({meals.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMeal}
                className="h-7 border-zinc-800 text-emerald-400 text-xs rounded-lg px-2 gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Meal</span>
              </Button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {meals.map((meal, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={meal.name}
                      onChange={e => handleMealNameChange(mIdx, e.target.value)}
                      placeholder={`Meal ${mIdx + 1}`}
                      className="bg-zinc-900 border-zinc-700 text-xs font-semibold text-zinc-100 rounded-lg h-7 w-36"
                    />
                    {meals.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMeal(mIdx)}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Items in Meal */}
                  <div className="space-y-1.5">
                    {meal.items.map((item, itIdx) => (
                      <div key={itIdx} className="flex items-center gap-1.5">
                        <Input
                          value={item.name}
                          onChange={e => handleItemChange(mIdx, itIdx, 'name', e.target.value)}
                          placeholder="Food item (e.g. Chicken)"
                          className="bg-zinc-900 border-zinc-800 text-[11px] text-zinc-200 rounded-lg h-7 flex-1"
                        />
                        <Input
                          type="number"
                          step="any"
                          value={item.quantity || ''}
                          onChange={e => handleItemChange(mIdx, itIdx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="bg-zinc-900 border-zinc-800 text-[11px] text-zinc-200 rounded-lg h-7 w-16 text-center"
                        />
                        <Input
                          value={item.unit || ''}
                          onChange={e => handleItemChange(mIdx, itIdx, 'unit', e.target.value)}
                          placeholder="Unit"
                          className="bg-zinc-900 border-zinc-800 text-[11px] text-zinc-200 rounded-lg h-7 w-16 text-center"
                        />
                        {meal.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(mIdx, itIdx)}
                            className="h-7 w-7 p-0 text-zinc-600 hover:text-rose-400"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddItem(mIdx)}
                      className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 pt-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add food item</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-zinc-800 text-zinc-400 text-xs h-8 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-4 rounded-xl font-medium"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
