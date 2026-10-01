import axios, { AxiosError } from 'axios';
import type * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { ApiErrorBody, ApiResponse } from '@/types/api';
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  AppointmentStatusFilter,
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
  multipart?: boolean;
}

/** For 204 responses, where the contract is "no body" rather than "empty data". */
const requestEmpty = async (path: string, options: RequestOptions = {}): Promise<void> => {
  await request<undefined>(path, { ...options, method: options.method ?? 'DELETE' });
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, token, multipart = false } = options;

  if (!API_URL) {
    throw new ApiError(
      0,
      'EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and point it at the backend.',
    );
  }

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  if (multipart && Platform.OS !== 'web') headers['Content-Type'] = 'multipart/form-data';
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: ApiResponse<T> | undefined;
  let status = 0;
  try {
    const response = await axios.request<ApiResponse<T>>({
      url: `${API_URL}${path}`,
      method,
      headers,
      data: body,
      validateStatus: () => true,
    });
    status = response.status;
    payload = response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      status = error.response.status;
      payload = error.response.data as ApiResponse<T>;
    } else {
      throw new ApiError(0, 'Cannot reach the PawPoint server. Check your connection and try again.');
    }
  }

  if (status < 200 || status >= 300) {
    const errorBody = payload as ApiErrorBody | undefined;
    throw new ApiError(status, errorBody?.message ?? `Request failed (${status}).`, errorBody?.errors);
  }

  // 204 carries no envelope by design, so there is nothing to unwrap.
  if (status === 204) return undefined as T;

  if (!payload?.success) {
    throw new ApiError(status, payload?.message ?? 'Request failed.');
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

  async uploadImage(id: string, asset: ImagePicker.ImagePickerAsset, token: string): Promise<Doctor> {
    const body = new FormData();
    const name = asset.fileName ?? `doctor-image.${asset.mimeType === 'image/png' ? 'png' : 'jpg'}`;
    if (Platform.OS === 'web') {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      body.append('image', blob, name);
    } else {
      body.append('image', {
        uri: asset.uri,
        name,
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
    }
    return request<Doctor>(`/doctors/${id}/image`, {
      method: 'PUT',
      body,
      token,
      multipart: true,
    });
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

  get(id: string, token: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}`, { token });
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

  update(id: string, input: AppointmentInput, token: string): Promise<Appointment> {
    return request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: input,
      token,
    });
  },

  remove(id: string, token: string): Promise<void> {
    return requestEmpty(`/appointments/${id}`, { token });
  },

  /**
   * The clinic-wide queue, soonest first. Admin only; the server throws 403
   * otherwise.
   *
   * `All` means no filter, so the query parameter is omitted rather than sent as
   * the string "All", which the server would reject.
   */
  adminList(token: string, status: AppointmentStatusFilter = 'All'): Promise<Appointment[]> {
    const query = status === 'All' ? '' : `?status=${encodeURIComponent(status)}`;
    return request<Appointment[]>(`/appointments/admin${query}`, { token });
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
