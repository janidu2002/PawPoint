/**
 * Auth-related contracts.
 *
 * These describe what the API accepts and returns. They are written by hand
 * and mirrored by `frontend/src/types/` - the shapes are small enough that a
 * single shared source of truth would cost more build complexity than it saves.
 */

/** JWT payload. `sub` is the user's id. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** A user as sent to the client. The password hash is never included. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

/** Returned by /register and /login. */
export interface AuthResult {
  token: string;
  user: UserDto;
}

/** Request body for POST /api/auth/register. */
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

/** Request body for POST /api/auth/login. */
export interface LoginDto {
  email: string;
  password: string;
}

/** Standard response envelope, mirrored by frontend/src/types/api.ts. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
