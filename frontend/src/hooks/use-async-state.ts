import { ApiError } from '@/lib/api';

/**
 * Shape shared by every data-fetching hook.
 *
 * `data` stays mounted through a refetch so returning to a screen does not flash
 * an empty state, which is why `isLoading` is separate from `data`.
 */
export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** Re-runs the fetch, for pull-to-refresh and after a write. */
  refetch: () => Promise<void>;
}

/** Turns anything thrown by `request` into a message worth showing a user. */
export const messageFor = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
