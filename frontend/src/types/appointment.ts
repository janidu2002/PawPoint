import type { Doctor } from './doctor';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

/**
 * Pending and Confirmed appointments block a doctor's slot.
 * Used by the UI to explain why a time is unavailable.
 */
export const BLOCKING_STATUSES: AppointmentStatus[] = ['Pending', 'Confirmed'];

export type PetType = 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Other';

export interface Appointment {
  id: string;
  /** Always taken from the JWT on the backend, never from the client. */
  userId: string;
  doctorId: string;
  /** Populated when the backend joins the Doctor reference. */
  doctor?: Pick<Doctor, 'id' | 'name' | 'specialization' | 'image'>;
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