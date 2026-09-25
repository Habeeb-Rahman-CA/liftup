'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useActiveWorkout } from '@/context/active-workout-context';
import { sessionsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ExerciseSessionCard } from './components/exercise-session-card';
import { FinishWorkoutModal } from './components/finish-workout-modal';
import { AddSessionExerciseModal } from './components/add-session-exercise-modal';
import { RestTimer } from './components/rest-timer';
import { SkipWorkoutModal } from '@/components/workouts/skip-workout-modal';
import {
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Edit2,
  FileText,
  Dumbbell,
  Timer,
  Flame,
  AlertCircle,
} from 'lucide-react';
import type { WorkoutSessionDto, SetLogDto, SetType } from '@liftup/types';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    activeSession,
    formattedTime,
    elapsedSeconds,
    refreshActiveSession,
    setActiveSession,
    loading: activeLoading,
  } = useActiveWorkout();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [restTimerOpen, setRestTimerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Sync session title
  useEffect(() => {
    if (activeSession) {
      setSessionTitle(activeSession.name || 'Workout Session');
    }
  }, [activeSession]);

  // Handle Session Title Edit Save
  const handleSaveTitle = async () => {
    if (!activeSession || !sessionTitle.trim()) return;
    try {
      const updated = await sessionsApi.update(activeSession.id, { name: sessionTitle.trim() });
      setActiveSession(updated);
      setIsEditingTitle(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update workout name');
    }
  };

  // Add Exercise to Session
  const handleAddExercise = async (exerciseId: string) => {
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.addExercise(activeSession.id, { exerciseId });
      setActiveSession(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to add exercise');
    }
  };

  // Remove Exercise from Session
  const handleRemoveExercise = async (exerciseLogId: string) => {
    if (!activeSession) return;
    try {
      const updated = await sessionsApi.removeExercise(activeSession.id, exerciseLogId);
      setActiveSession(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to remove exercise');
    }
  };

  // Add Set to Exercise Log
  const handleAddSet = async (exerciseLogId: string, type: SetType = 'WORKING') => {
    if (!activeSession) return;
    try {
      const newSet = await sessionsApi.createSet(exerciseLogId, { type });
      // Optimistically update local session
      setActiveSession(prev => {
        if (!prev || !prev.exerciseLogs) return prev;
        return {
          ...prev,
          exerciseLogs: prev.exerciseLogs.map(log => {
            if (log.id !== exerciseLogId) return log;
            return {
              ...log,
              setLogs: [...(log.setLogs || []), newSet],
            };
          }),
        };
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add set');
    }
  };

  // Update Set Log
  const handleUpdateSet = async (setId: string, payload: Partial<SetLogDto>) => {
    if (!activeSession) return;

    // Optimistically update local state immediately
    setActiveSession(prev => {
      if (!prev || !prev.exerciseLogs) return prev;
      return {
        ...prev,
        exerciseLogs: prev.exerciseLogs.map(log => ({
          ...log,
          setLogs: (log.setLogs || []).map(s => {
            if (s.id !== setId) return s;
            return { ...s, ...payload };
          }),
        })),
      };
    });

    try {
      await sessionsApi.updateSet(setId, payload);
    } catch (err: any) {
      setError(err.message || 'Failed to update set');
      await refreshActiveSession();
    }
  };

  // Delete Set Log
  const handleDeleteSet = async (setId: string) => {
    if (!activeSession) return;

    // Optimistically remove from state
    setActiveSession(prev => {
      if (!prev || !prev.exerciseLogs) return prev;
      return {
        ...prev,
        exerciseLogs: prev.exerciseLogs.map(log => ({
          ...log,
          setLogs: (log.setLogs || []).filter(s => s.id !== setId),
        })),
      };
    });

    try {
      await sessionsApi.deleteSet(setId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete set');
      await refreshActiveSession();
    }
  };

  // Trigger Rest Timer on set completion
  const handleSetCompleted = () => {
    setRestTimerOpen(true);
  };

  // Finish Workout
  const handleFinishWorkout = async (note: string, durationMinutes: number) => {
    if (!activeSession) return;
    setIsFinishing(true);
    setError(null);
    try {
      await sessionsApi.complete(activeSession.id, { note, durationMinutes });
      setActiveSession(null);
      setFinishModalOpen(false);
      router.push('/dashboard?completed=true');
    } catch (err: any) {
      setError(err.message || 'Failed to finish workout');
      setIsFinishing(false);
    }
  };

  // Cancel / Discard Workout
  const handleCancelWorkout = async () => {
    if (!activeSession) return;
    setIsCancelling(true);
    try {
      await sessionsApi.cancel(activeSession.id);
      setActiveSession(null);
      setCancelConfirmOpen(false);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel workout');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSkipActiveWorkout = async (data: { skipReason: string; note?: string }) => {
    if (!activeSession) return;
    await sessionsApi.skip({
      sessionId: activeSession.id,
      skipReason: data.skipReason,
      note: data.note,
    });
    setActiveSession(null);
    router.push('/history');
  };

  if (activeLoading || authLoading) {
    return (
      <div className="flex-1 min-h-[80vh] flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-zinc-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          <span>Loading workout session...</span>
        </div>
      </div>
    );
  }

  // If no active session is found
  if (!activeSession) {
    return (
      <main className="max-w-md mx-auto w-full px-4 py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500">
          <Dumbbell className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-100">No Active Workout</h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            You don&apos;t have an in-progress workout session right now.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-semibold h-10 rounded-xl text-xs"
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/workouts')}
            className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 h-10 rounded-xl text-xs"
          >
            View Workout Schedule
          </Button>
        </div>
      </main>
    );
  }

  const totalCompletedSets =
    activeSession.exerciseLogs?.reduce(
      (acc, ex) => acc + (ex.setLogs?.filter(s => s.completed).length || 0),
      0,
    ) || 0;

  return (
    <main className="max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 pb-36 space-y-4">
      {/* --------------------------------------------------------------------- */}
      {/* STICKY TOP APP BAR: Session Name, Live Timer, Finish & Discard CTA    */}
      {/* --------------------------------------------------------------------- */}
      <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between gap-2 shadow-lg">
        {/* Back navigation button */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title="Return to dashboard (workout keeps running in background)"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Center: Title & Timer */}
        <div className="text-center min-w-0 flex-1 px-1">
          {isEditingTitle ? (
            <div className="flex items-center justify-center gap-1.5">
              <Input
                type="text"
                value={sessionTitle}
                onChange={e => setSessionTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="h-7 text-xs bg-zinc-900 border-zinc-700 text-center font-bold text-zinc-100 max-w-[200px]"
              />
              <Button
                size="sm"
                onClick={handleSaveTitle}
                className="h-7 px-2 text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100"
              >
                Save
              </Button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group cursor-pointer inline-flex items-center gap-1.5 justify-center max-w-full"
            >
              <h2 className="text-xs sm:text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
                {activeSession.name || 'Workout Session'}
              </h2>
              <Edit2 className="h-3 w-3 text-zinc-500 group-hover:text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{formattedTime}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-normal">{totalCompletedSets} sets logged</span>
          </div>
        </div>

        {/* Right Actions: Skip, Discard & Finish */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSkipModalOpen(true)}
            className="h-8 px-2 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-zinc-900 text-xs font-mono gap-1"
            title="Skip / Abort with reason"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Skip</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCancelConfirmOpen(true)}
            className="h-8 w-8 p-0 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900"
            title="Discard Workout"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setFinishModalOpen(true)}
            className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-semibold text-xs h-8 px-3 rounded-xl gap-1.5 shadow-md shadow-emerald-950/80"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Finish</span>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-900/80 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* EXERCISE LOGS LIST                                                    */}
      {/* --------------------------------------------------------------------- */}
      {activeSession.exerciseLogs?.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 mx-auto">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-200">No Exercises in Session</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Add movements from your exercise library to begin logging sets and weights.
            </p>
          </div>
          <Button
            onClick={() => setAddExerciseModalOpen(true)}
            className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-9 px-4 rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Exercise</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSession.exerciseLogs?.map((log, index) => (
            <ExerciseSessionCard
              key={log.id}
              log={log}
              index={index}
              onUpdateSet={handleUpdateSet}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onRemoveExercise={handleRemoveExercise}
              onSetCompleted={handleSetCompleted}
            />
          ))}

          {/* Add Another Exercise Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddExerciseModalOpen(true)}
            className="w-full border-dashed border-zinc-800 hover:border-emerald-700 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-emerald-300 h-12 rounded-2xl text-xs font-medium gap-2 transition-all touch-manipulation active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>Add Another Exercise</span>
          </Button>

          {/* Big Prominent Finish Workout CTA Card (Effortless Single-Thumb Tap at Bottom) */}
          <div className="pt-2 pb-6">
            <button
              type="button"
              onClick={() => setFinishModalOpen(true)}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 hover:from-emerald-900 hover:to-emerald-900 border border-emerald-700 text-emerald-100 shadow-xl shadow-emerald-950/80 flex items-center justify-between gap-3 transition-all touch-manipulation active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800/80 border border-emerald-600 text-emerald-100 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-sm sm:text-base text-zinc-100">
                    Complete &amp; Save Workout
                  </p>
                  <p className="text-xs text-emerald-300/80 font-mono">
                    {totalCompletedSets} sets logged • {formattedTime}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold bg-emerald-800/90 border border-emerald-600 px-3 py-1.5 rounded-xl shrink-0">
                Finish ✓
              </span>
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODALS & DIALOGS                                                      */}
      {/* --------------------------------------------------------------------- */}
      {/* Add Exercise Modal */}
      <AddSessionExerciseModal
        isOpen={addExerciseModalOpen}
        onClose={() => setAddExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
      />

      {/* Finish Workout Summary Modal */}
      <FinishWorkoutModal
        isOpen={finishModalOpen}
        session={activeSession}
        elapsedSeconds={elapsedSeconds}
        isSubmitting={isFinishing}
        onClose={() => setFinishModalOpen(false)}
        onFinish={handleFinishWorkout}
      />

      {/* Cancel Workout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        title="Discard Workout Session?"
        variant="danger"
        confirmLabel="Discard Workout"
        isLoading={isCancelling}
        onConfirm={handleCancelWorkout}
        onClose={() => setCancelConfirmOpen(false)}
        description={
          <div>
            Are you sure you want to discard this workout? All logged sets and progress in this
            session will be permanently deleted.
          </div>
        }
      />

      {/* Floating Rest Timer */}
      <RestTimer
        isOpen={restTimerOpen}
        onClose={() => setRestTimerOpen(false)}
        initialSeconds={90}
      />

      {/* Skip Workout Modal */}
      <SkipWorkoutModal
        isOpen={skipModalOpen}
        workoutTitle={activeSession.name || 'Workout Session'}
        sessionId={activeSession.id}
        onClose={() => setSkipModalOpen(false)}
        onSkip={handleSkipActiveWorkout}
      />
    </main>
  );
}
