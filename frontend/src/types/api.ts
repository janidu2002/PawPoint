/** Shared API envelope and error shapes. */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  /** Field-level messages, keyed by field name. */
  errors?: Record<string, string>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}