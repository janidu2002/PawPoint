/** Authenticated user. The password hash is never sent to the client. */

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  /** Frontend-only: checked against `password` before submitting. */
  confirmPassword: string;
}

/** Field-level validation errors keyed by form field. */
export type FormErrors<T> = Partial<Record<keyof T, string>>;