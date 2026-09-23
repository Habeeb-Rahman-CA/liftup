/**
 * @liftup/types - Shared TypeScript Definitions
 */

// -----------------------------------------------------------------------------
// API & SYSTEM TYPES
// -----------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  service?: string;
  timestamp: string;
  uptime?: number;
  database: {
    provider?: string;
    status?: 'connected' | 'disconnected';
    connected?: boolean;
    latencyMs?: number;
    error?: string;
  };
  version?: string;
}

// -----------------------------------------------------------------------------
// USER DOMAIN
// -----------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// WORKOUT DOMAIN ENUMS & TYPES
// -----------------------------------------------------------------------------
export type WorkoutSessionStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'REST';

export type SetType = 'WARMUP' | 'WORKING';

export interface WorkoutScheduleDto {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  days?: WorkoutDayDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDayDto {
  id: string;
  scheduleId: string;
  name: string;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseDto {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  instructions?: string | null;
  defaultSets?: number | null;
  defaultRepsMin?: number | null;
  defaultRepsMax?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionDto {
  id: string;
  userId: string;
  workoutDayId?: string | null;
  name?: string | null;
  status: WorkoutSessionStatus;
  skipReason?: string | null;
  note?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes?: number | null;
  exerciseLogs?: ExerciseLogDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseLogDto {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  exercise?: ExerciseDto;
  order: number;
  note?: string | null;
  setLogs?: SetLogDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SetLogDto {
  id: string;
  exerciseLogId: string;
  type: SetType;
  setNumber: number;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  completed: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// PAGINATION TYPES
// -----------------------------------------------------------------------------
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
