import type { Doctor, Weekday } from './doctor';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

/**
 * Pending and Confirmed appointments block a doctor's slot.
 * Used by the UI to explain why a time is unavailable.
 */
export const BLOCKING_STATUSES: AppointmentStatus[] = ['Pending', 'Confirmed'];

export type PetType = 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Other';

/**
 * What the clinic queue can be narrowed to. `All` is a client-side sentinel, not
 * an appointment status - the backend receives no `status` query at all for it.
 */
export type AppointmentStatusFilter = AppointmentStatus | 'All';

export interface Appointment {
  id: string;
  /** Always taken from the JWT on the backend, never from the client. */
  userId: string;
  doctorId: string;
  /** Populated when the backend joins the Doctor reference. */
  doctor?: Pick<Doctor, 'id' | 'name' | 'specialization' | 'image'>;
  /** Admin queue only. Name alone - the queue is not a contact directory. */
  owner?: { id: string; name: string };
  petName: string;
  petType: PetType;
  petBreed: string;
  /** ISO date string, "YYYY-MM-DD". */
  appointmentDate: string;
  /** 24-hour "HH:mm". */
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentInput {
  doctorId: string;
  petName: string;
  petType: PetType;
  petBreed: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
}

/** One bookable time for a given doctor on a given date. */
export interface Slot {
  /** 24-hour "HH:mm". */
  time: string;
  /**
   * False when another pet already holds the slot. The server deliberately
   * reports only this, never who booked it.
   */
  available: boolean;
}

/** `GET /api/doctors/:id/availability?date=YYYY-MM-DD` */
export interface Availability {
  doctorId: string;
  date: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  /** Empty when the vet does not work that weekday. */
  slots: Slot[];
}

/** Payload for PATCH /api/appointments/:id/status. Admin only. */
export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
}