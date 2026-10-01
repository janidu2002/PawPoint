/** A veterinarian working at the single PawPoint clinic. */

export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  phoneNumber: string;
  availableDays: Weekday[];
  /** 24-hour "HH:mm". */
  startTime: string;
  endTime: string;
  consultationFee: number;
  description: string;
  /** Publicly reachable image URL, or null when none was uploaded. */
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating or updating a doctor. The image is set via upload. */
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
}