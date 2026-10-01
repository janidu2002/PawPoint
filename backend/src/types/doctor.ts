/**
 * Doctor contracts.
 *
 * Mirrored by `frontend/src/types/doctor.ts`. Written by hand on both sides -
 * the shapes are small enough that a shared contract would cost more build
 * complexity than it saves.
 */

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** A doctor as sent to the client. */
export interface DoctorDto {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  phoneNumber: string;
  availableDays: Weekday[];
  startTime: string;
  endTime: string;
  consultationFee: number;
  description: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for POST /api/doctors and PUT /api/doctors/:id.
 *
 * `image` is accepted but optional: upload arrives in a later phase, so the
 * frontend sends null and the UI falls back to an initials avatar.
 */
export interface DoctorInput {
  name: string;
  specialization: string;
  qualification: string;
  phoneNumber: string;
  availableDays: Weekday[];
  startTime: string;
  endTime: string;
  consultationFee: number;
  description: string;
  image?: string | null;
}
