'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Plus, Edit2, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/auth-context';
import { mealsApi } from '@/lib/api-client';
import { EditMealItemModal } from './components/edit-meal-item-modal';
import { CreateMealPlanModal } from './components/create-meal-plan-modal';
import { BuildMealModal } from './components/build-meal-modal';
import type {
  MealPlanDto,
  MealDto,
  MealItemDto,
  CreateMealItemDto,
  UpdateMealItemDto,
  CreateMealPlanDto,
} from '@liftup/types';

export default function MealsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState<MealPlanDto[]>([]);

  // Modals state
  const [buildMealModalOpen, setBuildMealModalOpen] = useState(false);
  const [mealToEdit, setMealToEdit] = useState<MealDto | null>(null);
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [targetMeal, setTargetMeal] = useState<{ id: string; name: string } | null>(null);
  const [itemToEdit, setItemToEdit] = useState<MealItemDto | null>(null);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);

  // Custom UI Delete confirmation dialog states
  const [deletePlanTarget, setDeletePlanTarget] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const [deleteItemTarget, setDeleteItemTarget] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load Plans Data
  const loadPlansData = useCallback(async () => {
    try {
      const res = await mealsApi.getPlans();
      setPlansList(res);
    } catch (err) {
      console.error('Failed to load meal plans:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadPlansData().finally(() => {
        setLoading(false);
      });
    }
  }, [user, loadPlansData]);

  // Meal Plan Handlers
  const handleActivatePlan = async (planId: string) => {
    try {
      await mealsApi.activatePlan(planId);
      await loadPlansData();
    } catch (err) {
      console.error('Failed to activate plan:', err);
    }
  };

  const handleSaveMealItem = async (data: CreateMealItemDto | UpdateMealItemDto) => {
    if (!targetMeal) return;
    if (itemToEdit) {
      await mealsApi.updateItem(itemToEdit.id, data as UpdateMealItemDto);
    } else {
      await mealsApi.addItem(targetMeal.id, data as CreateMealItemDto);
    }
    await loadPlansData();
  };

  const handleSaveNewMeal = async (mealName: string, items: CreateMealItemDto[]) => {
    if (!activePlan) return;
    const createdMeal = await mealsApi.addMeal(activePlan.id, { name: mealName });
    if (items.length > 0) {
      await mealsApi.addBatchItems(createdMeal.id, items);
    }
    await loadPlansData();
  };

  const handleSaveExistingMeal = async (mealId: string, items: CreateMealItemDto[]) => {
    if (items.length > 0) {
      await mealsApi.addBatchItems(mealId, items);
    }
    await loadPlansData();
  };

  const handleRequestDeleteItem = (item: { id: string; name: string }) => {
    setDeleteItemTarget(item);
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItemTarget) return;
    setIsDeletingItem(true);
    try {
      await mealsApi.deleteItem(deleteItemTarget.id);
      setDeleteItemTarget(null);
      await loadPlansData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleCreatePlan = async (data: CreateMealPlanDto) => {
    await mealsApi.createPlan(data);
    await loadPlansData();
  };

  const handleRequestDeletePlan = (plan: { id: string; name: string }) => {
    const target = plansList.find(p => p.id === plan.id);
    if (target?.isActive) return;
    setDeletePlanTarget(plan);
  };

  const handleConfirmDeletePlan = async () => {
    if (!deletePlanTarget) return;
    setIsDeletingPlan(true);
    try {
      await mealsApi.deletePlan(deletePlanTarget.id);
      setDeletePlanTarget(null);
      await loadPlansData();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    } finally {
      setIsDeletingPlan(false);
    }
  };

  if (authLoading || (loading && plansList.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-zinc-400">Loading meal plans...</p>
        </div>
      </div>
    );
  }

  const activePlan = plansList.find(p => p.isActive);

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Meal Plans
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Build and manage your daily meal routines and food targets.
          </p>
        </div>
      </div>

      {/* Active Plan Card Header */}
      {activePlan ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-100">{activePlan.name}</h2>
                <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px] font-bold">
                  Active Plan
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {activePlan.description || 'Daily food items & target quantities'}
              </p>
            </div>
          </div>

          {/* Meals & Items Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {activePlan.meals.map(meal => (
              <div
                key={meal.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-400" />
                      {meal.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMealToEdit(meal);
                        setBuildMealModalOpen(true);
                      }}
                      className="h-7 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg px-2 gap-1"
                      title="Edit Meal & Add Foods"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                  </div>

                  {/* Items Strip */}
                  <div className="space-y-1.5">
                    {meal.items.map(item => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-200 block truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {item.displayQuantity || `${item.quantity || ''}${item.unit || ''}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTargetMeal({ id: meal.id, name: meal.name });
                              setItemToEdit(item);
                              setEditItemModalOpen(true);
                            }}
                            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
                            title="Edit quantity"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRequestDeleteItem({ id: item.id, name: item.name })
                            }
                            className="h-6 w-6 p-0 text-zinc-500 hover:text-rose-400"
                            title="Remove item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {meal.items.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-2">No food items added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Meal Button below last meal */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMealToEdit(null);
              setBuildMealModalOpen(true);
            }}
            className="w-full py-5 rounded-2xl border-dashed border-zinc-800 hover:border-emerald-700/80 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all group font-medium text-xs sm:text-sm"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-800/80 transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Add Meal to Plan</span>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-8 text-center space-y-3">
          <Sparkles className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-zinc-100">No Active Meal Plan</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create a custom meal plan or select one from your saved plans below to begin tracking.
          </p>
          <Button
            size="sm"
            onClick={() => setCreatePlanModalOpen(true)}
            className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-4 rounded-xl font-medium gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Meal Plan</span>
          </Button>
        </div>
      )}

      {/* Saved Plans List */}
      {plansList.length > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300">
            Your Saved Plans ({plansList.length})
          </h3>
          <div className="space-y-2">
            {plansList.map(plan => (
              <div
                key={plan.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-200 truncate">
                      {plan.name}
                    </span>
                    {plan.isActive && (
                      <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[9px] font-bold shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500 block truncate">
                    {plan.meals.length} Meals • {plan.description || 'Custom nutrition plan'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!plan.isActive ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivatePlan(plan.id)}
                        className="border-zinc-800 text-emerald-400 hover:text-emerald-300 hover:bg-zinc-850 text-xs h-7 px-2.5 rounded-lg"
                      >
                        Set Active
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRequestDeletePlan({ id: plan.id, name: plan.name })}
                        className="text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 h-7 w-7 p-0 rounded-lg transition-colors"
                        title="Delete meal plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build a Meal Modal (Multi-Item Food Library Driven Minimalist Modal) */}
      <BuildMealModal
        isOpen={buildMealModalOpen}
        onClose={() => {
          setBuildMealModalOpen(false);
          setMealToEdit(null);
        }}
        mealToEdit={mealToEdit}
        defaultMealName={`Meal ${(activePlan?.meals.length || 0) + 1}`}
        onSaveNewMeal={handleSaveNewMeal}
        onSaveExistingMeal={handleSaveExistingMeal}
      />

      {/* Edit Single Item Modal */}
      <EditMealItemModal
        isOpen={editItemModalOpen}
        mealName={targetMeal?.name || 'Meal'}
        itemToEdit={itemToEdit}
        onClose={() => {
          setEditItemModalOpen(false);
          setItemToEdit(null);
          setTargetMeal(null);
        }}
        onSave={handleSaveMealItem}
      />

      {/* Create Meal Plan Modal */}
      <CreateMealPlanModal
        isOpen={createPlanModalOpen}
        onClose={() => setCreatePlanModalOpen(false)}
        onCreate={handleCreatePlan}
      />

      {/* Delete Plan Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletePlanTarget}
        title="Delete Meal Plan?"
        description={
          deletePlanTarget ? (
            <div className="space-y-2 text-xs sm:text-sm text-zinc-300">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-zinc-100">
                  &quot;{deletePlanTarget.name}&quot;
                </span>
                ?
              </p>
              <p className="text-[11px] text-zinc-400">
                This will delete the plan template and its meals. Historical nutrition logs and
                checkmarks will remain intact.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Delete Plan"
        cancelLabel="Keep Plan"
        variant="danger"
        isLoading={isDeletingPlan}
        onConfirm={handleConfirmDeletePlan}
        onClose={() => {
          if (!isDeletingPlan) setDeletePlanTarget(null);
        }}
      />

      {/* Delete Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteItemTarget}
        title="Remove Food Item?"
        description={
          deleteItemTarget ? (
            <p className="text-xs sm:text-sm text-zinc-300">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-zinc-100">
                &quot;{deleteItemTarget.name}&quot;
              </span>{' '}
              from this meal?
            </p>
          ) : null
        }
        confirmLabel="Remove Item"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingItem}
        onConfirm={handleConfirmDeleteItem}
        onClose={() => {
          if (!isDeletingItem) setDeleteItemTarget(null);
        }}
      />

      {/* Floating Action Button (FAB) at Bottom Right - Create Plan */}
      <button
        type="button"
        onClick={() => setCreatePlanModalOpen(true)}
        aria-label="Create new plan"
        className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 h-13 w-13 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 flex items-center justify-center transition-transform active:scale-95 touch-manipulation cursor-pointer shadow-none"
        title="Create New Plan"
      >
        <Plus className="h-6 w-6" />
      </button>
    </main>
  );
}
