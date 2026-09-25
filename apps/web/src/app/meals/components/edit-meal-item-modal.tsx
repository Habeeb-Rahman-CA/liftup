'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Utensils, X, Plus, Check } from 'lucide-react';
import type { MealItemDto, CreateMealItemDto, UpdateMealItemDto } from '@liftup/types';

interface EditMealItemModalProps {
  isOpen: boolean;
  mealName: string;
  itemToEdit?: MealItemDto | null;
  onClose: () => void;
  onSave: (data: CreateMealItemDto | UpdateMealItemDto) => Promise<void>;
}

export const EditMealItemModal: React.FC<EditMealItemModalProps> = ({
  isOpen,
  mealName,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [displayQuantity, setDisplayQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setQuantity(
        itemToEdit.quantity !== null && itemToEdit.quantity !== undefined
          ? String(itemToEdit.quantity)
          : '',
      );
      setUnit(itemToEdit.unit || '');
      setDisplayQuantity(itemToEdit.displayQuantity || '');
    } else {
      setName('');
      setQuantity('');
      setUnit('');
      setDisplayQuantity('');
    }
    setError(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a food item name');
      return;
    }

    setLoading(true);
    setError(null);

    const parsedQty = quantity ? parseFloat(quantity) : undefined;
    const formattedDisplay =
      displayQuantity.trim() ||
      (parsedQty && unit.trim() ? `${parsedQty}${unit.trim()} ${name.trim()}` : undefined);

    try {
      await onSave({
        name: name.trim(),
        quantity: parsedQty,
        unit: unit.trim() || undefined,
        displayQuantity: formattedDisplay,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save food item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {itemToEdit ? 'Edit Food Item' : 'Add Food Item'}
              </h3>
              <p className="text-xs text-zinc-400">{mealName}</p>
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Food Item Name *
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chicken Breast, Whole Egg, Oats"
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Quantity
              </label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 150, 4, 40"
                className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Unit
              </label>
              <Input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. g, pcs, Rotis"
                className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Custom Display Text (Optional)
            </label>
            <Input
              value={displayQuantity}
              onChange={e => setDisplayQuantity(e.target.value)}
              placeholder="e.g. 150g Chicken Breast, 4 Whole Egg"
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
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
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-3 rounded-xl font-medium"
            >
              {loading ? (
                'Saving...'
              ) : itemToEdit ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Item
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
