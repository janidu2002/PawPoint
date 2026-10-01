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
 * Request body for POST /api/appointments.
 *
 * `userId` is deliberately absent: the controller takes it from the JWT so a
 * client can never book on someone else's behalf. `status` is absent for the
 * same reason - every booking starts as Pending.
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

/** The slice of a Doctor an appointment needs to be recognisable in a list. */
export interface DoctorSummaryDto {
  id: string;
  name: string;
  specialization: string;
  image: string | null;
}

/**
 * The slice of a User an admin needs to recognise who booked an appointment.
 *
 * Name only. The clinic queue is a scheduling surface, not a way to look up
 * people's contact details, so the email that `UserDto` carries stays out of it.
 */
export interface OwnerSummaryDto {
  id: string;
  name: string;
}

/** An appointment as sent to the client. */
export interface AppointmentDto {
  id: string;
  userId: string;
  doctorId: string;
  /** Present whenever the controller populates the reference. */
  doctor?: DoctorSummaryDto;
  /** Admin queue only - the owner's own list already knows who they are. */
  owner?: OwnerSummaryDto;
  petName: string;
  petType: PetType;
  petBreed: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Which status each appointment may move to.
 *
 * Enforced server-side so a bad request cannot skip a step - jumping straight
 * from Pending to Completed would silently skip the clinic confirming the slot.
 * Completed and Cancelled are absent because neither can change afterwards.
 */
export const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

