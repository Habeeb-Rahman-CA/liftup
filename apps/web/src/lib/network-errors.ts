/**
 * LiftUp Network & API Error Classification System
 * Maps raw HTTP and network conditions to user-friendly, structured states.
 */

export type NetworkErrorKind =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

export class AppNetworkError extends Error {
  public readonly kind: NetworkErrorKind;
  public readonly status?: number;
  public readonly userTitle: string;
  public readonly userMessage: string;
  public readonly isSavedLocally: boolean;

  constructor({
    kind,
    status,
    message,
    userTitle,
    userMessage,
    isSavedLocally = false,
  }: {
    kind: NetworkErrorKind;
    status?: number;
    message: string;
    userTitle: string;
    userMessage: string;
    isSavedLocally?: boolean;
  }) {
    super(message);
    this.name = 'AppNetworkError';
    this.kind = kind;
    this.status = status;
    this.userTitle = userTitle;
    this.userMessage = userMessage;
    this.isSavedLocally = isSavedLocally;
  }
}

export class OfflineError extends AppNetworkError {
  constructor(message = 'No internet connection') {
    super({
      kind: 'OFFLINE',
      message,
      userTitle: 'No internet connection',
      userMessage: 'Your workout is saved locally and will sync automatically.',
      isSavedLocally: true,
    });
  }
}

export class TimeoutError extends AppNetworkError {
  constructor(message = 'Network request timed out') {
    super({
      kind: 'TIMEOUT',
      status: 408,
      message,
      userTitle: 'Connection timeout',
      userMessage: 'Server took too long to respond. Your data is preserved locally.',
      isSavedLocally: true,
    });
  }
}

export class UnauthorizedError extends AppNetworkError {
  constructor(message = 'Your session has expired') {
    super({
      kind: 'UNAUTHORIZED',
      status: 401,
      message,
      userTitle: 'Session expired',
      userMessage: 'Please log in again to continue.',
      isSavedLocally: false,
    });
  }
}

export class ForbiddenError extends AppNetworkError {
  constructor(message = 'Access forbidden') {
    super({
      kind: 'FORBIDDEN',
      status: 403,
      message,
      userTitle: 'Access Denied',
      userMessage: 'You do not have permission to modify or access this record.',
      isSavedLocally: false,
    });
  }
}

export class NotFoundError extends AppNetworkError {
  constructor(message = 'Resource not found') {
    super({
      kind: 'NOT_FOUND',
      status: 404,
      message,
      userTitle: 'Not Found',
      userMessage: 'The requested workout, exercise, or record could not be found.',
      isSavedLocally: false,
    });
  }
}

export class RateLimitError extends AppNetworkError {
  constructor(message = 'Too many requests') {
    super({
      kind: 'RATE_LIMITED',
      status: 429,
      message,
      userTitle: 'Rate limit exceeded',
      userMessage: 'Too many requests in a short period. Please wait a moment before trying again.',
      isSavedLocally: false,
    });
  }
}

export class ServerError extends AppNetworkError {
  constructor(status = 500, message = 'Internal server error') {
    super({
      kind: 'SERVER_ERROR',
      status,
      message,
      userTitle: 'Server temporarily unavailable',
      userMessage:
        'Database or server is temporarily unreachable. Your progress is preserved locally.',
      isSavedLocally: true,
    });
  }
}

export class ValidationError extends AppNetworkError {
  constructor(message = 'Invalid request parameters', status = 400) {
    super({
      kind: 'VALIDATION_ERROR',
      status,
      message,
      userTitle: 'Invalid request',
      userMessage: message,
      isSavedLocally: false,
    });
  }
}

/**
 * Normalizes any error (raw JS error, fetch failure, or HTTP response) into an AppNetworkError
 */
export function normalizeNetworkError(err: any): AppNetworkError {
  if (err instanceof AppNetworkError) {
    return err;
  }

  // 1. Check if browser is currently offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new OfflineError();
  }

  // 2. Fetch / DNS network failures
  if (err?.name === 'TypeError' && err?.message?.toLowerCase().includes('failed to fetch')) {
    return new OfflineError();
  }

  // 3. AbortController timeout (408)
  if (
    err?.name === 'AbortError' ||
    err?.message?.toLowerCase().includes('timeout') ||
    err?.message?.toLowerCase().includes('aborted')
  ) {
    return new TimeoutError();
  }

  // 4. HTTP status based detection
  if (err?.status === 401) {
    return new UnauthorizedError(err.message);
  }

  if (err?.status === 403) {
    return new ForbiddenError(err.message);
  }

  if (err?.status === 404) {
    return new NotFoundError(err.message);
  }

  if (err?.status === 408) {
    return new TimeoutError(err.message);
  }

  if (err?.status === 429) {
    return new RateLimitError(err.message);
  }

  if (err?.status >= 500) {
    return new ServerError(err.status, err.message);
  }

  if (err?.status === 400 || err?.status === 422) {
    return new ValidationError(err.message || 'Validation failed', err.status);
  }

  return new AppNetworkError({
    kind: 'UNKNOWN',
    message: err?.message || 'An unexpected error occurred',
    userTitle: 'Action could not be completed',
    userMessage: err?.message || 'Please check your connection and try again.',
  });
}
