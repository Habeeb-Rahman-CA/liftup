import { getCookie, deleteCookie } from 'cookies-next';
import type {
  ExerciseDto,
  CreateExercisePayload,
  UpdateExercisePayload,
  ReorderExercisesPayload,
  ExerciseQueryParams,
  WorkoutScheduleDto,
  WorkoutDayDto,
  WorkoutDayExerciseDto,
  TodayWorkoutDto,
  AssignExercisePayload,
  BatchAssignExercisesPayload,
  UpdateAssignedExercisePayload,
  UpdateDayPayload,
  ReorderDayExercisesPayload,
  WorkoutSessionDto,
  ExerciseLogDto,
  SetLogDto,
  StartWorkoutSessionPayload,
  UpdateWorkoutSessionPayload,
  CompleteWorkoutSessionPayload,
  AddExerciseToSessionPayload,
  CreateSetLogPayload,
  UpdateSetLogPayload,
  PreviousExercisePerformanceDto,
  ExerciseHistoryItemDto,
  PaginatedResult,
} from '@liftup/types';

export const TOKEN_COOKIE_KEY = 'liftup_access_token';
export const REFRESH_COOKIE_KEY = 'liftup_refresh_token';

export function handleSessionExpired() {
  try {
    deleteCookie(TOKEN_COOKIE_KEY, { path: '/' });
    deleteCookie(REFRESH_COOKIE_KEY, { path: '/' });
  } catch {
    // Ignore cookie delete errors
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('liftup:session-expired'));
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
      window.location.href = '/login?reason=session_expired';
    }
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getCookie(TOKEN_COOKIE_KEY) as string | undefined;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(init?.headers || {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    handleSessionExpired();
    throw new Error('Your session has expired. Please log in again to continue.');
  }

  return res;
}

export const exercisesApi = {
  async getAll(params?: ExerciseQueryParams): Promise<ExerciseDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') {
      searchParams.set('category', params.category);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      searchParams.set('isActive', String(params.isActive));
    }
    if (params?.sortBy) {
      searchParams.set('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      searchParams.set('sortOrder', params.sortOrder);
    }

    const qs = searchParams.toString();
    const url = `/api/v1/exercises${qs ? `?${qs}` : ''}`;

    const res = await fetchWithAuth(url, { cache: 'no-store' });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch exercises');
    }

    const data = await res.json();
    return data.data || data;
  },

  async getCategories(): Promise<{ category: string; count: number; activeCount: number }[]> {
    const res = await fetchWithAuth('/api/v1/exercises/categories', { cache: 'no-store' });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch exercise categories');
    }

    const data = await res.json();
    return data.data || data;
  },

  async getById(id: string): Promise<ExerciseDto> {
    const res = await fetchWithAuth(`/api/v1/exercises/${id}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch exercise');
    }

    const data = await res.json();
    return data.data || data;
  },

  async create(payload: CreateExercisePayload): Promise<ExerciseDto> {
    const res = await fetchWithAuth('/api/v1/exercises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create exercise');
    }

    const data = await res.json();
    return data.data || data;
  },

  async update(id: string, payload: UpdateExercisePayload): Promise<ExerciseDto> {
    const res = await fetchWithAuth(`/api/v1/exercises/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update exercise');
    }

    const data = await res.json();
    return data.data || data;
  },

  async toggleActive(id: string): Promise<ExerciseDto> {
    const res = await fetchWithAuth(`/api/v1/exercises/${id}/toggle-active`, {
      method: 'PATCH',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to toggle exercise status');
    }

    const data = await res.json();
    return data.data || data;
  },

  async reorder(
    payload: ReorderExercisesPayload,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetchWithAuth('/api/v1/exercises/reorder', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reorder exercises');
    }

    const data = await res.json();
    return data.data || data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`/api/v1/exercises/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete exercise');
    }

    const data = await res.json();
    return data.data || data;
  },
};

export const schedulesApi = {
  async getActiveSchedule(): Promise<WorkoutScheduleDto> {
    const res = await fetchWithAuth('/api/v1/schedules/active', { cache: 'no-store' });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch weekly schedule');
    }

    const data = await res.json();
    return data.data || data;
  },

  async getTodayWorkout(): Promise<TodayWorkoutDto> {
    const res = await fetchWithAuth('/api/v1/schedules/today', { cache: 'no-store' });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch today's workout");
    }

    const data = await res.json();
    return data.data || data;
  },

  async updateDay(dayId: string, payload: UpdateDayPayload): Promise<WorkoutDayDto> {
    const res = await fetchWithAuth(`/api/v1/schedules/days/${dayId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update workout day');
    }

    const data = await res.json();
    return data.data || data;
  },

  async assignExercise(
    dayId: string,
    payload: AssignExercisePayload,
  ): Promise<WorkoutDayExerciseDto> {
    const res = await fetchWithAuth(`/api/v1/schedules/days/${dayId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign exercise to workout day');
    }

    const data = await res.json();
    return data.data || data;
  },

  async batchAssignExercises(
    dayId: string,
    payload: BatchAssignExercisesPayload,
  ): Promise<WorkoutDayExerciseDto[]> {
    const res = await fetchWithAuth(`/api/v1/schedules/days/${dayId}/batch-exercises`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign exercises to workout day');
    }

    const data = await res.json();
    return data.data || data;
  },

  async updateAssignedExercise(
    assignedId: string,
    payload: UpdateAssignedExercisePayload,
  ): Promise<WorkoutDayExerciseDto> {
    const res = await fetchWithAuth(`/api/v1/schedules/assigned-exercises/${assignedId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update assigned exercise');
    }

    const data = await res.json();
    return data.data || data;
  },

  async removeAssignedExercise(assignedId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`/api/v1/schedules/assigned-exercises/${assignedId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to remove assigned exercise');
    }

    const data = await res.json();
    return data.data || data;
  },

  async reorderDayExercises(
    dayId: string,
    payload: ReorderDayExercisesPayload,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const res = await fetchWithAuth(`/api/v1/schedules/days/${dayId}/reorder`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reorder exercises');
    }

    const data = await res.json();
    return data.data || data;
  },

  async resetToDefault(): Promise<WorkoutScheduleDto> {
    const res = await fetchWithAuth('/api/v1/schedules/reset-default', {
      method: 'POST',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to reset schedule to default');
    }

    const data = await res.json();
    return data.data || data;
  },
};

export const sessionsApi = {
  async getActive(): Promise<WorkoutSessionDto | null> {
    const res = await fetchWithAuth('/api/v1/sessions/active');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to check active workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async start(payload: StartWorkoutSessionPayload): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth('/api/v1/sessions/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to start workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async getById(id: string): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async getHistory(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<WorkoutSessionDto>> {
    const res = await fetchWithAuth(`/api/v1/sessions/history?page=${page}&limit=${limit}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load workout history');
    }
    const data = await res.json();
    return data.data || data;
  },

  async getPreviousPerformance(exerciseId: string): Promise<PreviousExercisePerformanceDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/previous-performance/${exerciseId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load previous exercise performance');
    }
    const data = await res.json();
    return data.data || data;
  },

  async getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryItemDto[]> {
    const res = await fetchWithAuth(`/api/v1/sessions/exercise-history/${exerciseId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load exercise history records');
    }
    const data = await res.json();
    return data.data || data;
  },

  async update(id: string, payload: UpdateWorkoutSessionPayload): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async complete(id: string, payload: CompleteWorkoutSessionPayload): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to complete workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async cancel(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`/api/v1/sessions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel workout session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async addExercise(
    sessionId: string,
    payload: AddExerciseToSessionPayload,
  ): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/${sessionId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add exercise to session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async removeExercise(sessionId: string, exerciseLogId: string): Promise<WorkoutSessionDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/${sessionId}/exercises/${exerciseLogId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to remove exercise from session');
    }
    const data = await res.json();
    return data.data || data;
  },

  async createSet(exerciseLogId: string, payload: CreateSetLogPayload): Promise<SetLogDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/exercise-logs/${exerciseLogId}/sets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add set');
    }
    const data = await res.json();
    return data.data || data;
  },

  async updateSet(setId: string, payload: UpdateSetLogPayload): Promise<SetLogDto> {
    const res = await fetchWithAuth(`/api/v1/sessions/sets/${setId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update set');
    }
    const data = await res.json();
    return data.data || data;
  },

  async deleteSet(setId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchWithAuth(`/api/v1/sessions/sets/${setId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to remove set');
    }
    const data = await res.json();
    return data.data || data;
  },
};
