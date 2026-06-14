import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../../shared/interfaces/api-error.interface';

/**
 * Extracts all human-readable messages from an API error, flattening
 * multiple field arrays into a single list:
 *
 *   { errors: { email: ['msg1', 'msg2'], name: ['msg3'] } }
 *   → ['msg1', 'msg2', 'msg3']
 *
 * Accepts a raw HttpErrorResponse or any error whose `cause` is one
 * (e.g. CreateEventError). Returns [] when no messages can be found.
 */
export function extractApiMessages(err: unknown): string[] {
  const httpErr =
    err instanceof HttpErrorResponse
      ? err
      : (err as { cause?: unknown })?.cause instanceof HttpErrorResponse
        ? (err as { cause: HttpErrorResponse }).cause
        : null;

  if (!httpErr) return [];

  const body = httpErr.error as ApiErrorResponse | null;
  if (!body) return [];

  if (body.errors && Object.keys(body.errors).length) {
    return Object.values(body.errors).flat();
  }

  return body.message ? [body.message] : [];
}
