import { AxiosError } from 'axios';

/**
 * Extract a human-readable error message from whatever we throw/catch in the
 * app. Priority order:
 *   1. NestJS-shaped `{ message: string | string[] }` from Axios response
 *   2. Axios's own `message` (network errors, aborted requests, etc.)
 *   3. Native Error.message
 *   4. Provided fallback
 *
 * Array messages (class-validator / Zod) are joined with ', ' so the toast
 * shows every failing field at once.
 */
export function getErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string | string[] }
      | undefined;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
