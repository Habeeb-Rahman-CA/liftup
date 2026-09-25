'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useActiveWorkout } from '@/context/active-workout-context';
import { schedulesApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AssignExerciseModal } from './components/assign-exercise-modal';
import { EditAssignedExerciseModal } from './components/edit-assigned-exercise-modal';
import { EditDayModal } from './components/edit-day-modal';
import {
  CalendarDays,
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Settings,
  ChevronDown,
  ChevronUp,
  BedDouble,
  Play,
} from 'lucide-react';
import type {
  WorkoutScheduleDto,
  WorkoutDayDto,
  WorkoutDayExerciseDto,
  AssignExercisePayload,
  UpdateAssignedExercisePayload,
  UpdateDayPayload,
} from '@liftup/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeSession, startWorkout } = useActiveWorkout();

  // State
  const [schedule, setSchedule] = useState<WorkoutScheduleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All workdays closed by default
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Modals state
  const [assignModalDay, setAssignModalDay] = useState<WorkoutDayDto | null>(null);
  const [editDayModalDay, setEditDayModalDay] = useState<WorkoutDayDto | null>(null);
  const [editAssignedModalItem, setEditAssignedModalItem] = useState<{
    item: WorkoutDayExerciseDto;
    dayName: string;
  } | null>(null);

  // Delete Confirmation
  const [deleteAssignedConfirm, setDeleteAssignedConfirm] = useState<{
    id: string;
    name: string;
    dayName: string;
  } | null>(null);
  const [isDeletingAssigned, setIsDeletingAssigned] = useState(false);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load Schedule Data
  const loadData = useCallback(async () => {
    setError(null);
    try {
      const scheduleRes = await schedulesApi.getActiveSchedule();
      setSchedule(scheduleRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load workout schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Toggle Day Expansion
  const toggleDayExpansion = (dayId: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  // Handlers for Day modifications
  const handleSaveDay = async (dayId: string, payload: UpdateDayPayload) => {
    await schedulesApi.updateDay(dayId, payload);
    await loadData();
  };

  // Handlers for Exercise Assignments
  const handleAssignExercises = async (payloads: AssignExercisePayload[]) => {
    if (!assignModalDay) return;
    await schedulesApi.batchAssignExercises(assignModalDay.id, { exercises: payloads });
    // Expand the day we just assigned to
    setExpandedDays(prev => ({ ...prev, [assignModalDay.id]: true }));
    await loadData();
  };

  const handleSaveAssignedExercise = async (
    assignedId: string,
    payload: UpdateAssignedExercisePayload,
  ) => {
    await schedulesApi.updateAssignedExercise(assignedId, payload);
    await loadData();
  };

  const handleConfirmDeleteAssigned = async () => {
    if (!deleteAssignedConfirm) return;
    const target = deleteAssignedConfirm;
    try {
      setIsDeletingAssigned(true);
      await schedulesApi.removeAssignedExercise(target.id);

      // Optimistically update local schedule state immediately
      setSchedule(prev => {
        if (!prev || !prev.days) return prev;
        return {
          ...prev,
          days: prev.days.map(day => ({
            ...day,
            exercises: (day.exercises || []).filter(ex => ex.id !== target.id),
          })),
        };
      });

      setDeleteAssignedConfirm(null);
      setIsDeletingAssigned(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove exercise');
      setIsDeletingAssigned(false);
    }
  };

  // Reorder exercises up/down within day
  const handleMoveExercise = async (
    day: WorkoutDayDto,
    index: number,
    direction: 'up' | 'down',
  ) => {
    const exercises = [...(day.exercises || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    // Swap
    const temp = exercises[index];
    exercises[index] = exercises[targetIndex];
    exercises[targetIndex] = temp;

    const payload = {
      items: exercises.map((item, idx) => ({
        id: item.id,
        orderIndex: idx + 1,
      })),
    };

    await schedulesApi.reorderDayExercises(day.id, payload);
    await loadData();
  };

  // Compute total weekly stats
  const weeklyStats = useMemo(() => {
    if (!schedule?.days) return { workoutDays: 0, restDays: 0, totalExercises: 0 };
    let workoutDays = 0;
    let restDays = 0;
    let totalExercises = 0;

    schedule.days.forEach(d => {
      if (d.isRestDay) {
        restDays++;
      } else {
        workoutDays++;
      }
      totalExercises += d.exercises?.length || 0;
    });

    return { workoutDays, restDays, totalExercises };
  }, [schedule]);

  if (authLoading || (loading && !schedule)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading workout schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-3.5 sm:p-8 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-32 sm:pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Workout Schedule
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            7-day split routines, exercise assignments, rest days, and target sets &amp; reps.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-900/80 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            Dismiss
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7-DAY SCHEDULE CARDS (Monday to Sunday, All Closed by Default)        */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-2.5">
        {schedule?.days?.map(day => {
          const isExpanded = !!expandedDays[day.id];
          const exerciseCount = day.exercises?.length || 0;
          const dayTitle = DAY_NAMES[day.dayOfWeek];

          return (
            <div
              key={day.id}
              id={`day-card-${day.id}`}
              className="rounded-2xl border transition-all duration-150 overflow-hidden bg-zinc-900 border-zinc-800/90 hover:border-zinc-700"
            >
              {/* Day Header - Click to toggle expansion */}
              <div
                onClick={() => toggleDayExpansion(day.id)}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Day Badge / Indicator */}
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-col items-center justify-center rounded-xl border text-center shrink-0 bg-zinc-950 border-zinc-800 text-zinc-300 font-medium">
                    <span className="text-[11px] font-mono uppercase tracking-tight">
                      {dayTitle.slice(0, 3)}
                    </span>
                  </div>

                  {/* Deliverable Format: Day -> Routine Title -> Exercise count */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-400">{dayTitle}</span>
                      {day.isRestDay ? (
                        <Badge
                          variant="outline"
                          className="border-zinc-800 bg-zinc-950 text-zinc-500 text-[9px] font-normal px-1.5 py-0"
                        >
                          Rest Day
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-900/60 bg-emerald-950/40 text-emerald-400 text-[9px] font-normal px-1.5 py-0"
                        >
                          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-zinc-100 truncate mt-0.5">
                      {day.name}
                    </h3>
                  </div>
                </div>

                {/* Right side controls */}
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Configure Day Settings */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditDayModalDay(day)}
                    className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-7 sm:h-8 w-7 sm:w-8 p-0 rounded-lg"
                    title="Configure routine settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>

                  {/* Expand/Collapse Chevron */}
                  <button
                    type="button"
                    onClick={() => toggleDayExpansion(day.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Exercise List Body */}
              {isExpanded && (
                <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-3 sm:p-4 space-y-3 animate-in fade-in duration-150">
                  {day.description && (
                    <p className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                      {day.description}
                    </p>
                  )}

                  {/* Rest Day Message or Exercise Section */}
                  {day.isRestDay ? (
                    <div className="py-6 px-4 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/60 border border-zinc-700/60 mx-auto text-zinc-400">
                        <BedDouble className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-xs text-zinc-200">
                          Rest &amp; Recovery Day
                        </p>
                        <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                          Take time to recover, hydrate, and rest your muscles. You can adjust
                          routine settings via the gear icon above.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Exercise List Header & Actions */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">
                          Exercises ({exerciseCount})
                        </span>
                        <div className="flex items-center gap-1.5">
                          {exerciseCount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => startWorkout({ workoutDayId: day.id, name: day.name })}
                              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-7 px-2.5 rounded-lg gap-1 font-medium shadow-sm"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Start Workout</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssignModalDay(day)}
                            className="border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-300 text-xs h-7 px-2.5 rounded-lg gap-1"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Add Exercise</span>
                          </Button>
                        </div>
                      </div>

                      {/* Exercise List Content */}
                      {exerciseCount === 0 ? (
                        <div className="p-4 text-center rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-zinc-500 text-xs space-y-1">
                          <Dumbbell className="h-5 w-5 mx-auto text-zinc-600 mb-1" />
                          <p className="font-medium text-zinc-400">
                            No exercises assigned yet for {day.name}
                          </p>
                          <p className="text-[10px]">
                            Click &quot;Add Exercise&quot; above to assign movements from your
                            library.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {day.exercises?.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors gap-2"
                            >
                              {/* Left: Reorder index and Exercise info */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                                <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono text-[10px] shrink-0">
                                  {idx + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs text-zinc-100 truncate">
                                    {item.exercise?.name || 'Catalog Exercise'}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                    {item.exercise?.category && (
                                      <span className="uppercase tracking-wider font-mono text-[9px] text-zinc-400 font-medium shrink-0">
                                        {item.exercise.category}
                                      </span>
                                    )}
                                    {item.exercise?.category && item.note && (
                                      <span className="text-zinc-600">•</span>
                                    )}
                                    {item.note && (
                                      <span className="text-emerald-400 truncate">
                                        Cue: {item.note}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Target metrics and action buttons */}
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <span className="text-[11px] font-mono text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-900/80 px-2 py-0.5 rounded-md">
                                  {item.targetSets || 3} sets × {item.targetRepsMin || 8}-
                                  {item.targetRepsMax || 12}
                                </span>

                                {/* Move Up/Down Controls */}
                                <div className="hidden sm:flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveExercise(day, idx, 'up')}
                                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === exerciseCount - 1}
                                    onClick={() => handleMoveExercise(day, idx, 'down')}
                                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                {/* Edit item modal */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditAssignedModalItem({
                                      item,
                                      dayName: day.name,
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                                  title="Edit target sets & reps"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                {/* Remove item */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDeletingAssigned(false);
                                    setDeleteAssignedConfirm({
                                      id: item.id,
                                      name: item.exercise?.name || 'Exercise',
                                      dayName: day.name,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                  title="Remove from workout day"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODALS & DIALOGS                                                      */}
      {/* --------------------------------------------------------------------- */}
      {/* Assign Exercise Modal */}
      {assignModalDay && (
        <AssignExerciseModal
          isOpen={!!assignModalDay}
          dayName={assignModalDay.name}
          dayOfWeek={assignModalDay.dayOfWeek}
          onClose={() => setAssignModalDay(null)}
          onAssign={handleAssignExercises}
        />
      )}

      {/* Edit Assigned Exercise Modal */}
      {editAssignedModalItem && (
        <EditAssignedExerciseModal
          isOpen={!!editAssignedModalItem}
          assignedExercise={editAssignedModalItem.item}
          dayName={editAssignedModalItem.dayName}
          onClose={() => setEditAssignedModalItem(null)}
          onSave={handleSaveAssignedExercise}
        />
      )}

      {/* Edit Day Modal */}
      {editDayModalDay && (
        <EditDayModal
          isOpen={!!editDayModalDay}
          day={editDayModalDay}
          dayName={DAY_NAMES[editDayModalDay.dayOfWeek]}
          onClose={() => setEditDayModalDay(null)}
          onSave={handleSaveDay}
        />
      )}

      {/* Confirm Delete Assigned Exercise Dialog */}
      <ConfirmDialog
        isOpen={!!deleteAssignedConfirm}
        title="Remove Exercise from Day?"
        variant="danger"
        confirmLabel="Remove"
        isLoading={isDeletingAssigned}
        onConfirm={handleConfirmDeleteAssigned}
        onClose={() => {
          setDeleteAssignedConfirm(null);
          setIsDeletingAssigned(false);
        }}
        description={
          <div>
            Are you sure you want to remove{' '}
            <strong className="text-zinc-100 font-semibold">{deleteAssignedConfirm?.name}</strong>{' '}
            from <strong className="text-emerald-400">{deleteAssignedConfirm?.dayName}</strong>?
            This will not delete the exercise from the master library.
          </div>
        }
      />
    </main>
  );
}
