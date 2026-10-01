import type { ApiErrorBody, ApiResponse } from '@/types/api';
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  Availability,
} from '@/types/appointment';
import type { Doctor, DoctorInput } from '@/types/doctor';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/user';

/**
 * The one place the app talks HTTP.
 *
 * Screens never see a raw response or a status code: `request` unwraps the
 * `{ success, message, data }` envelope and converts anything non-2xx into an
 * `ApiError`, so feature code can just try/catch.
 */

/** Base URL including the `/api` prefix, e.g. http://192.168.1.34:5000/api */
const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * A failed request, carrying the server's message and any per-field messages so
 * a form can render them next to the relevant input.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** For 204 responses, where the contract is "no body" rather than "empty data". */
const requestEmpty = async (path: string, options: RequestOptions = {}): Promise<void> => {
  await request<undefined>(path, { ...options, method: options.method ?? 'DELETE' });
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, token } = options;

  if (!API_URL) {
    throw new ApiError(
      0,
      'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and point it at the backend.',
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch rejects when the server is unreachable: wrong host, phone not on the
    // same network, or the backend not running. No response body exists here,
    // so this message has to stand on its own.
    throw new ApiError(0, 'Cannot reach the PawPoint server. Check your connection and try again.');
  }

  const raw = await response.text();

  // A proxy or a crash can return HTML or nothing at all; JSON.parse would throw
  // and mask the real status code.
  let payload: ApiResponse<T> | undefined;
  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      throw new ApiError(response.status, `Unexpected response from the server (${response.status}).`);
    }
  }

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | undefined;
    throw new ApiError(
      response.status,
      errorBody?.message ?? `Request failed (${response.status}).`,
      errorBody?.errors,
    );
  }

  // 204 carries no envelope by design, so there is nothing to unwrap.
  if (response.status === 204) return undefined as T;

  if (!payload?.success) {
    throw new ApiError(response.status, payload?.message ?? 'Request failed.');
  }

  // `data` is optional in the envelope but mandatory for the endpoints we call.
  return payload.data as T;
};

export const authApi = {
  register(input: RegisterInput): Promise<AuthResponse> {
    // confirmPassword is a client-side concern; the server never sees it.
    const { name, email, password } = input;
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  login(input: LoginInput): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: input });
  },

  /** Validates a stored token and returns the owning user. */
  me(token: string): Promise<User> {
    return request<User>('/auth/me', { token });
  },
};

/**
 * Doctors.
 *
 * Browsing needs a session but not admin rights; writes throw 403 for a regular
 * user, which the admin screens surface rather than preventing.
 */
export const doctorsApi = {
  list(token: string): Promise<Doctor[]> {
    return request<Doctor[]>('/doctors', { token });
  },

  get(id: string, token: string): Promise<Doctor> {
    return request<Doctor>(`/doctors/${id}`, { token });
  },

  /**
   * Concrete bookable times for one date. `date` is "YYYY-MM-DD"; the server
   * rejects a past date with 400 and an unknown doctor with 404.
   */
  getAvailability(id: string, date: string, token: string): Promise<Availability> {
    return request<Availability>(
      `/doctors/${id}/availability?date=${encodeURIComponent(date)}`,
      { token },
    );
  },

  /** Admin only. */
  create(input: DoctorInput, token: string): Promise<Doctor> {
    return request<Doctor>('/doctors', { method: 'POST', body: input, token });
  },

  /**
   * Admin only. Full replacement: every field must be present, matching the
   * server's PUT semantics.
   */
  update(id: string, input: DoctorInput, token: string): Promise<Doctor> {
    return request<Doctor>(`/doctors/${id}`, { method: 'PUT', body: input, token });
  },

  /** Admin only. Resolves once the server confirms with 204. */
  remove(id: string, token: string): Promise<void> {
    return requestEmpty(`/doctors/${id}`, { token });
  },
};

/**
 * Appointments.
 *
 * Booking is open to any signed-in user; the server takes the owner from the
 * token, so there is no userId to send. Status changes are admin-only and throw
 * 403 for everyone else.
 */
export const appointmentsApi = {
  /** The caller's own bookings, oldest first. The server scopes by token. */
  list(token: string): Promise<Appointment[]> {
    return request<Appointment[]>('/appointments', { token });
  },

  /** Creates a Pending appointment. Throws ApiError 409 if the slot was just taken. */
  create(input: AppointmentInput, token: string): Promise<Appointment> {
    return request<Appointment>('/appointments', { method: 'POST', body: input, token });
  },

  /**
   * The owner withdraws their own request. Throws ApiError 409 once the clinic
   * has confirmed it, which is the point to stop offering the action.
   */
  cancel(id: string, token: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}/cancel`, { method: 'POST', token });
  },

  /** Admin only. The server rejects a transition the current status forbids. */
  setStatus(id: string, status: AppointmentStatus, token: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: { status },
      token,
    });
  },
};

export { API_URL };
