'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Flame,
  Scale,
  Sparkles,
  UtensilsCrossed,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/auth-context';
import { foodsApi } from '@/lib/api-client';
import { FoodDetailModal } from './components/food-detail-modal';
import { CreateFoodModal } from './components/create-food-modal';
import type { FoodDto, FoodCategoryStatsDto, CreateFoodDto, UpdateFoodDto } from '@liftup/types';

export default function FoodLibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [foods, setFoods] = useState<FoodDto[]>([]);
  const [categories, setCategories] = useState<FoodCategoryStatsDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<
    'orderIndex' | 'name' | 'calories' | 'protein' | 'carbs' | 'fat'
  >('orderIndex');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals & Dialogs
  const [selectedFood, setSelectedFood] = useState<FoodDto | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [foodToEdit, setFoodToEdit] = useState<FoodDto | null>(null);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<FoodDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [foodsData, catsData] = await Promise.all([
        foodsApi.getAll({
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
          sortBy,
          sortOrder,
        }),
        foodsApi.getCategories(),
      ]);

      setFoods(foodsData);
      setCategories(catsData);
    } catch (err: any) {
      console.error('Failed to load food library:', err);
      showToast(err.message || 'Failed to load food library', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Cycle Sorting with proper asc/desc direction for macros
  const cycleSort = () => {
    const cycleMap: Record<
      string,
      {
        sortBy: 'orderIndex' | 'name' | 'protein' | 'calories' | 'carbs' | 'fat';
        sortOrder: 'asc' | 'desc';
      }
    > = {
      orderIndex: { sortBy: 'name', sortOrder: 'asc' },
      name: { sortBy: 'protein', sortOrder: 'desc' },
      protein: { sortBy: 'calories', sortOrder: 'desc' },
      calories: { sortBy: 'carbs', sortOrder: 'desc' },
      carbs: { sortBy: 'fat', sortOrder: 'desc' },
      fat: { sortBy: 'orderIndex', sortOrder: 'asc' },
    };

    const next = cycleMap[sortBy] || { sortBy: 'orderIndex', sortOrder: 'asc' };
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'name':
        return 'Name (A-Z)';
      case 'protein':
        return 'Highest Protein';
      case 'calories':
        return 'Highest Calories';
      case 'carbs':
        return 'Highest Carbs';
      case 'fat':
        return 'Highest Fats';
      default:
        return 'Default Order';
    }
  };

  // Category Color Map
  const getCategoryTheme = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'PROTEIN':
        return {
          pill: 'bg-red-950/80 border-red-800 text-red-300',
          badge: 'bg-red-950 text-red-300 border-red-800/80',
          dot: 'bg-red-400',
        };
      case 'CARBS':
        return {
          pill: 'bg-amber-950/80 border-amber-800 text-amber-300',
          badge: 'bg-amber-950 text-amber-300 border-amber-800/80',
          dot: 'bg-amber-400',
        };
      case 'FATS':
        return {
          pill: 'bg-blue-950/80 border-blue-800 text-blue-300',
          badge: 'bg-blue-950 text-blue-300 border-blue-800/80',
          dot: 'bg-blue-400',
        };
      case 'SUPERFOODS':
        return {
          pill: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800/80',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          pill: 'bg-zinc-900 border-zinc-800 text-zinc-300',
          badge: 'bg-zinc-900 text-zinc-300 border-zinc-800',
          dot: 'bg-zinc-400',
        };
    }
  };

  const handleSaveFood = async (data: CreateFoodDto | UpdateFoodDto) => {
    if (foodToEdit) {
      await foodsApi.update(foodToEdit.id, data as UpdateFoodDto);
      showToast(`Updated "${data.name || foodToEdit.name}"`);
    } else {
      await foodsApi.create(data as CreateFoodDto);
      showToast(`Added "${data.name}" to food library`);
    }
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await foodsApi.delete(deleteTarget.id);
      showToast(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      setDetailModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete food item', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalFoodCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.count, 0);
  }, [categories]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-zinc-400">Loading food library...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-zinc-900 border-emerald-800 text-emerald-300'
              : 'bg-zinc-900 border-red-900 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Food Library
            </h1>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
              {totalFoodCount || foods.length} Foods
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Explore nutritional macros, superfoods, and clean dietary building blocks.
          </p>
        </div>
      </div>

      {/* Search & Sort Toolbar - Single Row */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search foods, macros, benefits, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-7 h-9 rounded-xl bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Single-Click Sort Toggle matching Exercise Library style */}
        <button
          type="button"
          onClick={cycleSort}
          className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors select-none ${
            sortBy !== 'orderIndex'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
          }`}
          title="Click to cycle sort"
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-zinc-400 text-[11px]">Sort:</span>
          <span className="font-semibold text-zinc-200">
            {sortBy === 'orderIndex'
              ? 'Default'
              : sortBy === 'name'
                ? 'A-Z'
                : sortBy === 'protein'
                  ? 'Protein'
                  : sortBy === 'calories'
                    ? 'Calories'
                    : sortBy === 'carbs'
                      ? 'Carbs'
                      : 'Fats'}
          </span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`h-8 px-3 rounded-xl border font-medium flex items-center gap-1.5 shrink-0 transition-all select-none ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300 shadow-sm'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <span>All Foods</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
            {totalFoodCount}
          </span>
        </button>

        {['PROTEIN', 'CARBS', 'FATS', 'SUPERFOODS'].map(cat => {
          const stats = categories.find(c => c.category.toUpperCase() === cat);
          const isSelected = selectedCategory === cat;
          const theme = getCategoryTheme(cat);

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`h-8 px-3 rounded-xl border font-medium flex items-center gap-1.5 shrink-0 transition-all select-none ${
                isSelected
                  ? `${theme.pill} shadow-sm font-semibold`
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
              <span>{cat}</span>
              {stats && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
                  {stats.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Food Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p className="text-xs text-zinc-500 font-mono">Filtering catalog...</p>
        </div>
      ) : foods.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
          <Apple className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">No foods found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `No food items matching "${searchQuery}". Try a different keyword or category.`
              : 'No foods currently available in this category.'}
          </p>
          {searchQuery && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="border-zinc-800 text-emerald-400 text-xs mt-2"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {foods.map(food => {
            const theme = getCategoryTheme(food.category);
            const calories = food.calories ?? 0;
            const protein = food.protein ?? 0;
            const carbs = food.carbs ?? 0;
            const fat = food.fat ?? 0;

            return (
              <div
                key={food.id}
                onClick={() => {
                  setSelectedFood(food);
                  setDetailModalOpen(true);
                }}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 flex flex-col justify-between space-y-3 cursor-pointer hover:border-zinc-700 hover:bg-zinc-850/60 transition-all group active:scale-[0.99] shadow-sm relative overflow-hidden"
              >
                <div>
                  {/* Top Category & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      className={`text-[9px] font-bold uppercase tracking-wider ${theme.badge}`}
                    >
                      {food.category}
                    </Badge>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Per {food.servingSize || 100}
                      {food.servingUnit || 'g'}
                    </span>
                  </div>

                  {/* Food Name & Highlights */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-emerald-300 transition-colors">
                      {food.name}
                    </h3>
                    {food.isCustom && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  {food.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {food.description}
                    </p>
                  )}

                  {/* Superfood benefit preview badge */}
                  {food.benefits && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300/90 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-xl">
                      <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{food.benefits}</span>
                    </div>
                  )}
                </div>

                {/* Macro Chips Bar */}
                <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-4 gap-1 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800/60">
                    <span className="text-[9px] text-zinc-500 block">KCAL</span>
                    <span className="text-xs font-bold text-zinc-200">{calories}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-red-950/30 border border-red-900/40">
                    <span className="text-[9px] text-red-400 block">PRO</span>
                    <span className="text-xs font-bold text-red-300">{protein}g</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-900/40">
                    <span className="text-[9px] text-amber-400 block">CARB</span>
                    <span className="text-xs font-bold text-amber-300">{carbs}g</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
                    <span className="text-[9px] text-blue-400 block">FAT</span>
                    <span className="text-xs font-bold text-blue-300">{fat}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        isOpen={detailModalOpen}
        food={selectedFood}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedFood(null);
        }}
        onEdit={food => {
          setDetailModalOpen(false);
          setFoodToEdit(food);
          setCreateModalOpen(true);
        }}
        onDelete={food => {
          setDeleteTarget(food);
        }}
      />

      {/* Create / Edit Custom Food Modal */}
      <CreateFoodModal
        isOpen={createModalOpen}
        foodToEdit={foodToEdit}
        onClose={() => {
          setCreateModalOpen(false);
          setFoodToEdit(null);
        }}
        onSave={handleSaveFood}
      />

      {/* Delete Food Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Food Item?"
        description={
          deleteTarget ? (
            <p className="text-xs sm:text-sm text-zinc-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-zinc-100">&quot;{deleteTarget.name}&quot;</span>?
            </p>
          ) : null
        }
        confirmLabel="Delete Food"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />

      {/* Floating Action Button (FAB) at Bottom Right */}
      <button
        type="button"
        onClick={() => {
          setFoodToEdit(null);
          setCreateModalOpen(true);
        }}
        aria-label="Add custom food item"
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 h-13 w-13 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 flex items-center justify-center transition-transform active:scale-95 touch-manipulation cursor-pointer shadow-none"
      >
        <Plus className="h-6 w-6" />
      </button>
    </main>
  );
}
