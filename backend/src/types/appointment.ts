/**
 * Appointment contracts.
 *
 * Mirrored by `frontend/src/types/appointment.ts`. Written by hand on both sides
 * for the same reason as the doctor contracts - the shapes are small enough that
 * a shared contract would cost more build complexity than it saves.
 */

export const APPOINTMENT_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Pending and Confirmed appointments hold a doctor's slot. Completing or
 * cancelling one releases the time back into the availability grid.
 */
export const BLOCKING_STATUSES: AppointmentStatus[] = ["Pending", "Confirmed"];

export const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Other"] as const;

export type PetType = (typeof PET_TYPES)[number];

/**
 * Length of one bookable slot, in minutes.
 *
 * A slot is only offered when it finishes by the doctor's `endTime`, so a
 * 09:00-17:00 clinic on 15-minute slots has a last start of 16:45 rather than
 * 17:00.
 */
export const SLOT_MINUTES = 15;

/**
 * Request body for POST /api/appointments, which arrives in the next phase.
 *
 * `userId` is deliberately absent: the controller takes it from the JWT so a
 * client can never book on someone else's behalf.
 */
export interface AppointmentInput {
  doctorId: string;
  petName: string;
  petType: PetType;
  petBreed: string;
  /** ISO calendar date, "YYYY-MM-DD". */
  appointmentDate: string;
  /** 24-hour "HH:mm". */
  appointmentTime: string;
  reason: string;
}
