'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed,
  CheckCircle2,
  Circle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Award,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/context/auth-context';
import { mealsApi } from '@/lib/api-client';
import { EditMealItemModal } from './components/edit-meal-item-modal';
import { CreateMealPlanModal } from './components/create-meal-plan-modal';
import type {
  TodayMealsResponseDto,
  MealPlanDto,
  MealDto,
  MealItemDto,
  MealHistoryResponseDto,
  CreateMealItemDto,
  UpdateMealItemDto,
  CreateMealPlanDto,
} from '@liftup/types';

type MealsTab = 'TODAY' | 'PLANS' | 'HISTORY';

export default function MealsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<MealsTab>('TODAY');
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<TodayMealsResponseDto | null>(null);
  const [plansList, setPlansList] = useState<MealPlanDto[]>([]);
  const [historyData, setHistoryData] = useState<MealHistoryResponseDto | null>(null);

  // Modals state
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

  // Daily note local state
  const [dayNote, setDayNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // History expanded days
  const [expandedHistoryDays, setExpandedHistoryDays] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load Today Data
  const loadTodayData = useCallback(async () => {
    try {
      const res = await mealsApi.getToday();
      setTodayData(res);
      setDayNote(res.todayLog?.note || '');
    } catch (err) {
      console.error('Failed to load today meals:', err);
    }
  }, []);

  // Load Plans Data
  const loadPlansData = useCallback(async () => {
    try {
      const res = await mealsApi.getPlans();
      setPlansList(res);
    } catch (err) {
      console.error('Failed to load meal plans:', err);
    }
  }, []);

  // Load History Data
  const loadHistoryData = useCallback(async () => {
    try {
      const res = await mealsApi.getHistory(30);
      setHistoryData(res);
    } catch (err) {
      console.error('Failed to load meal history:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadTodayData(), loadPlansData(), loadHistoryData()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, loadTodayData, loadPlansData, loadHistoryData]);

  // Handlers for Today's meals toggling
  const handleToggleMeal = async (mealLogId: string) => {
    try {
      const res = await mealsApi.toggleMeal(mealLogId);
      setTodayData(res);
      loadHistoryData();
    } catch (err) {
      console.error('Failed to toggle meal:', err);
    }
  };

  const handleToggleItem = async (itemLogId: string) => {
    try {
      const res = await mealsApi.toggleItem(itemLogId);
      setTodayData(res);
      loadHistoryData();
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleSaveDayNote = async () => {
    if (!todayData?.todayLog) return;
    setSavingNote(true);
    try {
      const res = await mealsApi.updateDayNote(todayData.todayLog.date, dayNote);
      setTodayData(res);
    } catch (err) {
      console.error('Failed to save nutrition note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Meal Plan Handlers
  const handleActivatePlan = async (planId: string) => {
    try {
      await mealsApi.activatePlan(planId);
      await Promise.all([loadTodayData(), loadPlansData()]);
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
    await Promise.all([loadTodayData(), loadPlansData()]);
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
      await Promise.all([loadTodayData(), loadPlansData()]);
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleCreatePlan = async (data: CreateMealPlanDto) => {
    await mealsApi.createPlan(data);
    await Promise.all([loadTodayData(), loadPlansData()]);
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
      await Promise.all([loadTodayData(), loadPlansData()]);
    } catch (err) {
      console.error('Failed to delete plan:', err);
    } finally {
      setIsDeletingPlan(false);
    }
  };

  const toggleHistoryDayExpand = (dayId: string) => {
    setExpandedHistoryDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  if (authLoading || (loading && !todayData)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[65vh] p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-zinc-400">Loading meals...</p>
        </div>
      </div>
    );
  }

  const activePlan = plansList.find(p => p.isActive) || todayData?.activePlan;
  const todaySummary = todayData?.summary;
  const isAllCompleted =
    todaySummary &&
    todaySummary.totalMeals > 0 &&
    todaySummary.completedMeals === todaySummary.totalMeals;

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Nutrition &amp; Meals
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track daily meals, food quantities, completion status, and meal plans.
          </p>
        </div>

        <Link href="/foods">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs h-8 px-3 rounded-xl font-medium gap-1.5 self-start sm:self-auto"
          >
            <Apple className="h-3.5 w-3.5 text-emerald-400" />
            <span>Food Library</span>
          </Button>
        </Link>
      </div>

      {/* Navigation Tabs (3 in a single row without horizontal scroll) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('TODAY')}
          className={`py-2 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'TODAY'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Today</span>
          {todaySummary && todaySummary.totalMeals > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                isAllCompleted ? 'bg-emerald-800 text-emerald-100' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {todaySummary.completedMeals}/{todaySummary.totalMeals}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PLANS')}
          className={`py-2 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'PLANS'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Meal Plan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`py-2 text-xs font-mono font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">History</span>
          {historyData?.summary.perfectDaysCount ? (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-800/80 shrink-0">
              {historyData.summary.perfectDaysCount}★
            </span>
          ) : null}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TODAY'S MEALS CHECKLIST */}
      {/* ========================================================================= */}
      {activeTab === 'TODAY' && todayData && (
        <div className="space-y-4">
          {/* Progress Strip Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                  {todayData.todayLog.dateFormatted || 'Today'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                  <span>Daily Meal Progress</span>
                  {isAllCompleted && (
                    <Badge className="bg-emerald-950 text-emerald-300 border-emerald-700 text-[10px] font-medium gap-1">
                      <Award className="h-3 w-3 text-emerald-400" />
                      100% Target Reached
                    </Badge>
                  )}
                </h2>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                  {todaySummary?.completionRate || 0}%
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {todaySummary?.completedMeals} of {todaySummary?.totalMeals} Meals
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${todaySummary?.completionRate || 0}%` }}
              />
            </div>
          </div>

          {/* Meals List */}
          <div className="space-y-3">
            {todayData.todayLog.mealLogs.map(meal => {
              const completedCount = meal.itemLogs.filter(i => i.completed).length;
              const totalItems = meal.itemLogs.length;

              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border transition-all ${
                    meal.completed
                      ? 'bg-zinc-900/90 border-emerald-900/70'
                      : 'bg-zinc-900 border-zinc-800'
                  } p-4 sm:p-5 space-y-3`}
                >
                  {/* Meal Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMeal(meal.id)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors shrink-0 ${
                          meal.completed
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                        title={
                          meal.completed ? 'Mark as incomplete' : 'Mark entire meal as completed'
                        }
                      >
                        {meal.completed ? (
                          <CheckCircle2 className="h-4.5 w-4.5 fill-emerald-950" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`text-base font-bold truncate ${
                              meal.completed ? 'text-emerald-200 line-through' : 'text-zinc-100'
                            }`}
                          >
                            {meal.name}
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {completedCount}/{totalItems} items
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleMeal(meal.id)}
                      className={`text-xs h-7 px-2.5 rounded-lg font-medium gap-1 shrink-0 ${
                        meal.completed
                          ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80'
                          : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {meal.completed ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Done</span>
                        </>
                      ) : (
                        <span>Mark Done</span>
                      )}
                    </Button>
                  </div>

                  {/* Food Items Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {meal.itemLogs.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-2 ${
                          item.completed
                            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                            : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border shrink-0 ${
                              item.completed
                                ? 'bg-emerald-900 border-emerald-600 text-emerald-100'
                                : 'bg-zinc-900 border-zinc-700 text-transparent'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <span
                            className={`text-xs font-medium truncate ${
                              item.completed ? 'line-through text-zinc-400' : 'text-zinc-200'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>

                        {item.displayQuantity && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
                            {item.displayQuantity}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Nutrition Note Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                Today&apos;s Nutrition Notes
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={savingNote}
                onClick={handleSaveDayNote}
                className="border-zinc-800 text-emerald-400 text-xs h-7 px-2.5 rounded-lg"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
            <Input
              value={dayNote}
              onChange={e => setDayNote(e.target.value)}
              placeholder="e.g. Drank 3L water, added an extra egg in meal 1..."
              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl h-9"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEAL PLAN MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'PLANS' && (
        <div className="space-y-4">
          {/* Active Plan Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-zinc-100">
                  {activePlan?.name || 'Standard 4-Meal Plan'}
                </h2>
                {activePlan && (
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px] font-bold">
                    Active Plan
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {activePlan?.description || 'Daily food items & target quantities'}
              </p>
            </div>
          </div>

          {/* Meals & Items Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {activePlan?.meals.map(meal => (
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
                        setTargetMeal({ id: meal.id, name: meal.name });
                        setItemToEdit(null);
                        setEditItemModalOpen(true);
                      }}
                      className="h-7 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 rounded-lg px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
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
                            onClick={() =>
                              handleRequestDeletePlan({ id: plan.id, name: plan.name })
                            }
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MEAL HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {/* Summary Stats Overview Cards: 3 in a row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Logged Days</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                {historyData?.summary.totalLoggedDays || 0}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">100% Days</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                {historyData?.summary.perfectDaysCount || 0}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Adherence</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {historyData?.summary.overallCompletionRate || 0}%
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-3">
            {historyData?.items.map(day => {
              const isExpanded = !!expandedHistoryDays[day.id];
              const isPerfect = day.totalMeals > 0 && day.completedMeals === day.totalMeals;

              return (
                <div
                  key={day.id}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden"
                >
                  <div
                    onClick={() => toggleHistoryDayExpand(day.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
                          isPerfect
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <UtensilsCrossed className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-100">
                            {day.dateFormatted}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{day.date}</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 block mt-0.5">
                          {day.completedMeals}/{day.totalMeals} Meals Completed (
                          {day.completionPercentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {day.note && (
                        <span className="hidden sm:inline text-xs text-zinc-400 max-w-xs truncate italic">
                          &ldquo;{day.note}&rdquo;
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800/80 space-y-3 bg-zinc-950/40">
                      {day.note && (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2 mt-3">
                          <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-semibold text-zinc-200">Note:</strong>{' '}
                            {day.note}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {day.mealLogs.map(meal => (
                          <div
                            key={meal.id}
                            className={`p-2.5 rounded-xl border ${
                              meal.completed
                                ? 'bg-zinc-900 border-emerald-800/60'
                                : 'bg-zinc-950/80 border-zinc-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-xs font-bold ${
                                  meal.completed ? 'text-emerald-300' : 'text-zinc-200'
                                }`}
                              >
                                {meal.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-mono ${
                                  meal.completed
                                    ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                                    : 'border-zinc-800 text-zinc-500'
                                }`}
                              >
                                {meal.completed ? 'Completed' : 'Skipped'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {meal.itemLogs.map(it => (
                                <span
                                  key={it.id}
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                    it.completed
                                      ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  {it.name} {it.displayQuantity ? `(${it.displayQuantity})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(!historyData?.items || historyData.items.length === 0) && (
              <div className="p-8 text-center text-zinc-500 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-xs">No meal history logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Add Meal Item Modal */}
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

      {/* Floating Action Button (FAB) at Bottom Right */}
      {activeTab === 'PLANS' && (
        <button
          type="button"
          onClick={() => setCreatePlanModalOpen(true)}
          aria-label="Create new meal plan"
          className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 h-13 w-13 rounded-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 flex items-center justify-center transition-transform active:scale-95 touch-manipulation cursor-pointer shadow-none"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </main>
  );
}
