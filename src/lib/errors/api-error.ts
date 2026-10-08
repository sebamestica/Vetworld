export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'INTERNAL_ERROR';

export class ApiError extends Error {
  constructor(public readonly status: 400 | 404 | 405 | 500, public readonly code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
