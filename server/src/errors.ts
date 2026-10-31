import type { Response } from 'express';
import type { FieldErrors } from './validation.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_TAKEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'SIMULATED_FAILURE'
  | 'INTERNAL';

// Every non-2xx response goes through here, so the error shape in docs/API.md lives in one place.
export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  fields?: FieldErrors,
): void {
  // When fields is undefined, JSON.stringify leaves the key out entirely.
  res.status(status).json({ error: { code, message, fields } });
}
