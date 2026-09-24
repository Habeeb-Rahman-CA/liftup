'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { sessionsApi } from '@/lib/api-client';
import type { WorkoutSessionDto, StartWorkoutSessionPayload } from '@liftup/types';

interface ActiveWorkoutContextType {
  activeSession: WorkoutSessionDto | null;
  loading: boolean;
  elapsedSeconds: number;
  formattedTime: string;
  startWorkout: (payload?: StartWorkoutSessionPayload) => Promise<WorkoutSessionDto>;
  refreshActiveSession: () => Promise<WorkoutSessionDto | null>;
  setActiveSession: React.Dispatch<React.SetStateAction<WorkoutSessionDto | null>>;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();

  const [activeSession, setActiveSession] = useState<WorkoutSessionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active session when user is logged in
  const refreshActiveSession = useCallback(async (): Promise<WorkoutSessionDto | null> => {
    if (!user) {
      setActiveSession(null);
      setLoading(false);
      return null;
    }

    try {
      const session = await sessionsApi.getActive();
      setActiveSession(session);
      return session;
    } catch {
      setActiveSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshActiveSession();
    }
  }, [authLoading, refreshActiveSession]);

  // Live timer interval calculation based on startedAt
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!activeSession || !activeSession.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeSession.startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffInSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffInSeconds);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeSession]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Start a new workout session
  const startWorkout = async (
    payload: StartWorkoutSessionPayload = {},
  ): Promise<WorkoutSessionDto> => {
    setLoading(true);
    try {
      const session = await sessionsApi.start(payload);
      setActiveSession(session);
      router.push('/workouts/active');
      return session;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeSession,
        loading,
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        startWorkout,
        refreshActiveSession,
        setActiveSession,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
}
