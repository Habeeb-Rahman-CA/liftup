'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  X,
  Plus,
  Trash2,
  Search,
  Check,
  Flame,
  Dumbbell,
  Wheat,
  Droplet,
  Zap,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { foodsApi } from '@/lib/api-client';
import type { FoodDto, MealDto, CreateMealItemDto } from '@liftup/types';

interface StagedFoodItem {
  id: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  displayQuantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface BuildMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealToEdit?: MealDto | null;
  defaultMealName?: string;
  onSaveNewMeal?: (_mealName: string, _items: CreateMealItemDto[]) => Promise<void>;
  onSaveExistingMeal?: (_mealId: string, _items: CreateMealItemDto[]) => Promise<void>;
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'PROTEIN', label: 'Protein' },
  { id: 'CARBS', label: 'Carbs' },
  { id: 'FATS', label: 'Fats' },
  { id: 'SUPERFOODS', label: 'Super' },
];

export const BuildMealModal: React.FC<BuildMealModalProps> = ({
  isOpen,
  onClose,
  mealToEdit,
  defaultMealName = 'Meal',
  onSaveNewMeal,
  onSaveExistingMeal,
}) => {
  const [foods, setFoods] = useState<FoodDto[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Meal metadata
  const [mealName, setMealName] = useState('');

  // Current Food Selection & Quantity
  const [selectedFood, setSelectedFood] = useState<FoodDto | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState<string>('100');
  const [unit, setUnit] = useState<string>('g');

  // Staged Items (The items to add in this meal)
  const [stagedItems, setStagedItems] = useState<StagedFoodItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch food database once
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const loadFoods = async () => {
      try {
        setLoadingFoods(true);
        const list = await foodsApi.getAll();
        if (isMounted) setFoods(list);
      } catch (err) {
        console.error('Failed to load foods:', err);
      } finally {
        if (isMounted) setLoadingFoods(false);
      }
    };
    loadFoods();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync state on open/close
  useEffect(() => {
    if (isOpen) {
      if (mealToEdit) {
        setMealName(mealToEdit.name);
      } else {
        setMealName(defaultMealName);
      }
      setSelectedFood(null);
      setIsCustomMode(false);
      setCustomName('');
      setQuantity('100');
      setUnit('g');
      setStagedItems([]);
      setError(null);
      setSearchQuery('');
      setSelectedCategory('ALL');
    }
  }, [isOpen, mealToEdit, defaultMealName]);

  // Filter foods by category and search
  const filteredFoods = useMemo(() => {
    return foods.filter(food => {
      const matchCat =
        selectedCategory === 'ALL' ||
        food.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchQuery =
        !searchQuery.trim() ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        food.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchQuery;
    });
  }, [foods, selectedCategory, searchQuery]);

  const handleSelectFood = (food: FoodDto) => {
    setSelectedFood(food);
    setIsCustomMode(false);
    setCustomName('');
    const defaultQty = food.servingSize || 100;
    setQuantity(String(defaultQty));
    setUnit(food.servingUnit || 'g');
    setError(null);
  };

  const handleSelectCustom = () => {
    setSelectedFood(null);
    setIsCustomMode(true);
    setQuantity('100');
    setUnit('g');
    setError(null);
  };

  // Live macro calculation for selected item
  const currentCalculatedMacros = useMemo(() => {
    const numQty = parseFloat(quantity) || 0;
    if (!selectedFood || numQty <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const servingSize = selectedFood.servingSize || 100;
    const ratio = numQty / servingSize;

    return {
      calories: Math.round((selectedFood.calories || 0) * ratio),
      protein: Math.round((selectedFood.protein || 0) * ratio * 10) / 10,
      carbs: Math.round((selectedFood.carbs || 0) * ratio * 10) / 10,
      fat: Math.round((selectedFood.fat || 0) * ratio * 10) / 10,
    };
  }, [selectedFood, quantity]);

  // Live total macros for all staged items
  const totalMealMacros = useMemo(() => {
    return stagedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [stagedItems]);

  // Stage current item
  const handleStageCurrentItem = () => {
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    let itemName = '';
    if (selectedFood) {
      itemName = selectedFood.name;
    } else if (isCustomMode && customName.trim()) {
      itemName = customName.trim();
    } else {
      setError('Please select a food from the library');
      return;
    }

    const cleanUnit = unit.trim() || 'g';
    const displayQuantity = `${numQty}${cleanUnit} ${itemName}`;

    const newItem: StagedFoodItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      foodId: selectedFood?.id,
      name: itemName,
      quantity: numQty,
      unit: cleanUnit,
      displayQuantity,
      calories: currentCalculatedMacros.calories,
      protein: currentCalculatedMacros.protein,
      carbs: currentCalculatedMacros.carbs,
      fat: currentCalculatedMacros.fat,
    };

    setStagedItems(prev => [...prev, newItem]);
    setSelectedFood(null);
    setIsCustomMode(false);
    setCustomName('');
    setQuantity('100');
    setUnit('g');
    setError(null);
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedItems(prev => prev.filter(it => it.id !== id));
  };

  // Save meal
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMealName = mealName.trim();
    if (!finalMealName) {
      setError('Please enter a meal name');
      return;
    }

    // If there's an item configured but not added yet, add it
    let finalItems = [...stagedItems];
    if (selectedFood || (isCustomMode && customName.trim())) {
      const numQty = parseFloat(quantity);
      if (!isNaN(numQty) && numQty > 0) {
        const name = selectedFood ? selectedFood.name : customName.trim();
        const cleanUnit = unit.trim() || 'g';
        finalItems.push({
          id: 'temp-final',
          foodId: selectedFood?.id,
          name,
          quantity: numQty,
          unit: cleanUnit,
          displayQuantity: `${numQty}${cleanUnit} ${name}`,
          calories: currentCalculatedMacros.calories,
          protein: currentCalculatedMacros.protein,
          carbs: currentCalculatedMacros.carbs,
          fat: currentCalculatedMacros.fat,
        });
      }
    }

    if (finalItems.length === 0 && !mealToEdit) {
      setError('Please add at least one food item to this meal');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: CreateMealItemDto[] = finalItems.map((it, idx) => ({
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        displayQuantity: it.displayQuantity,
        orderIndex: idx + 1,
      }));

      if (mealToEdit && onSaveExistingMeal) {
        await onSaveExistingMeal(mealToEdit.id, payload);
      } else if (onSaveNewMeal) {
        await onSaveNewMeal(finalMealName, payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full flex flex-col max-h-[90vh] shadow-2xl relative my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                {mealToEdit ? 'Edit Meal' : 'Build a Meal'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {mealToEdit ? `Updating ${mealToEdit.name}` : 'Add a new meal with food library'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Compact Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Meal Name Input */}
          <div>
            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
              Meal Name
            </label>
            <Input
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              placeholder="e.g. Meal 1, Post-Workout, Breakfast"
              className="bg-zinc-900 border-zinc-800 text-xs font-semibold text-zinc-100 rounded-xl h-8.5"
            />
          </div>

          {/* Category Tabs & Food Search */}
          <div className="space-y-2 pt-1 border-t border-zinc-850">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                1. Select Food
              </span>
              <button
                type="button"
                onClick={handleSelectCustom}
                className="text-[10px] text-emerald-400 hover:underline font-mono"
              >
                + Custom Food
              </button>
            </div>

            {/* Category horizontal scroll */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border shrink-0 transition-colors ${
                    selectedCategory === tab.id
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search food library..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-6 h-8 rounded-xl bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Food Compact List */}
            <div className="border border-zinc-800 rounded-xl p-1 bg-zinc-900/40 max-h-36 overflow-y-auto space-y-1">
              {loadingFoods ? (
                <div className="py-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-emerald-500" />
                </div>
              ) : filteredFoods.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  No matching foods found.
                </div>
              ) : (
                filteredFoods.map(food => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className={`p-1.5 px-2 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                          : 'bg-zinc-900/80 border-transparent hover:border-zinc-750 text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-xs truncate block">{food.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {food.calories} kcal • {food.protein}g P / {food.servingSize}
                          {food.servingUnit}
                        </span>
                      </div>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">
                          {food.category}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Quantity & Live Macros */}
          <div className="space-y-2 pt-1 border-t border-zinc-850">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                2. Quantity {selectedFood ? `(${selectedFood.name})` : ''}
              </span>
              {selectedFood && (
                <span className="text-[10px] font-mono text-orange-400 font-bold">
                  🔥 {currentCalculatedMacros.calories} kcal
                </span>
              )}
            </div>

            {isCustomMode && (
              <Input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Custom food name..."
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl h-8 mb-1.5"
                autoFocus
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="any"
                min="0.1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 text-center rounded-xl h-8 font-mono"
              />
              <Input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Unit (g, pcs)"
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 text-center rounded-xl h-8 font-mono"
              />
            </div>

            {/* Quick Macro Pills */}
            {selectedFood && (
              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] pt-0.5">
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-rose-300">
                  <span>P: </span>
                  <span className="font-bold">{currentCalculatedMacros.protein}g</span>
                </div>
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-amber-300">
                  <span>C: </span>
                  <span className="font-bold">{currentCalculatedMacros.carbs}g</span>
                </div>
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-yellow-300">
                  <span>F: </span>
                  <span className="font-bold">{currentCalculatedMacros.fat}g</span>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleStageCurrentItem}
              disabled={!selectedFood && (!isCustomMode || !customName.trim())}
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs h-8 rounded-xl gap-1"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ Add to Meal</span>
            </Button>
          </div>

          {/* Staged Items Preview */}
          {stagedItems.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-zinc-850">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Meal Items ({stagedItems.length}):</span>
                <span className="text-emerald-400 font-bold">
                  Total: {totalMealMacros.calories} kcal • {totalMealMacros.protein}g P
                </span>
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto">
                {stagedItems.map(item => (
                  <div
                    key={item.id}
                    className="p-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-200 block truncate">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {item.quantity}
                        {item.unit} • {item.calories} kcal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStagedItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 text-xs h-8 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-4 rounded-xl font-medium gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{mealToEdit ? 'Save Meal' : 'Create Meal'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
