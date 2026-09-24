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
    message?: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  service?: string;
  version?: string;
  timestamp: string;
  uptime?: number;
  database: {
    provider?: string;
    status?: 'connected' | 'disconnected';
    connected?: boolean;
    latencyMs?: number;
    error?: string;
  };
}

// -----------------------------------------------------------------------------
// AUTH & USER DOMAIN
// -----------------------------------------------------------------------------
export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  timezone?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  timezone?: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
  timezone?: string;
}

// -----------------------------------------------------------------------------
// WORKOUT DOMAIN ENUMS & TYPES
// -----------------------------------------------------------------------------
export type WorkoutSessionStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'REST';

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
  isRestDay: boolean;
  description?: string | null;
  exercises?: WorkoutDayExerciseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDayExerciseDto {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  exercise?: ExerciseDto;
  targetSets?: number | null;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  orderIndex: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodayWorkoutDto {
  todayDayOfWeek: number;
  todayDayName: string;
  todayDateFormatted: string;
  today: WorkoutDayDto | null;
  upcoming: WorkoutDayDto | null;
  scheduleId: string;
  scheduleName: string;
}

export interface AssignExercisePayload {
  exerciseId: string;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  orderIndex?: number;
  note?: string;
}

export interface BatchAssignExercisesPayload {
  exercises: AssignExercisePayload[];
}

export interface UpdateAssignedExercisePayload {
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  orderIndex?: number;
  note?: string | null;
}

export interface UpdateDayPayload {
  name?: string;
  isRestDay?: boolean;
  description?: string | null;
}

export interface ReorderDayExercisesPayload {
  items: { id: string; orderIndex: number }[];
}

export type StandardExerciseCategory =
  'CHEST' | 'BACK' | 'SHOULDERS' | 'LEGS' | 'ARMS' | 'CORE' | 'CARDIO' | 'OTHER';

export interface ExerciseDto {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  instructions?: string | null;
  defaultSets?: number | null;
  defaultRepsMin?: number | null;
  defaultRepsMax?: number | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExercisePayload {
  name: string;
  category: string;
  description?: string;
  instructions?: string;
  defaultSets?: number;
  defaultRepsMin?: number;
  defaultRepsMax?: number;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateExercisePayload {
  name?: string;
  category?: string;
  description?: string | null;
  instructions?: string | null;
  defaultSets?: number | null;
  defaultRepsMin?: number | null;
  defaultRepsMax?: number | null;
  orderIndex?: number;
  isActive?: boolean;
}

export interface ReorderExerciseItem {
  id: string;
  orderIndex: number;
}

export interface ReorderExercisesPayload {
  items: ReorderExerciseItem[];
}

export interface ExerciseQueryParams {
  category?: string;
  search?: string;
  isActive?: boolean | string;
  sortBy?: 'orderIndex' | 'name' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
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
