/**
 * @liftup/types - Shared TypeScript Definitions
 */

// Generic API Response wrapper
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

// Health check status
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

// User & Auth representations
export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// Pagination parameters and meta
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
