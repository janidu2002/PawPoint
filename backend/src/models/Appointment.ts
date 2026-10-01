import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

import {
  APPOINTMENT_STATUSES,
  BLOCKING_STATUSES,
  PET_TYPES,
  type AppointmentStatus,
  type PetType,
} from "../types/appointment";

/**
 * A booked consultation slot.
 *
 * Pet details are denormalised onto the appointment rather than modelled as a
 * separate Pet, matching `frontend/src/types/appointment.ts`: a booking is the
 * only place they are ever needed.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Shape guard only. `2026-02-30` matches here, so the controller performs the
 *  real calendar check before a date reaches this model. */
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-([01]\d|2[0-3]|3[01])$/;

export interface IAppointment {
  userId: Types.ObjectId;
  doctorId: Types.ObjectId;
  petName: string;
  petType: PetType;
  petBreed: string;
  /** ISO calendar date, "YYYY-MM-DD". Stored as a string so it reads back
   *  identically regardless of the server's timezone. */
  appointmentDate: string;
  /** 24-hour "HH:mm". */
  appointmentTime: string;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentDocument = HydratedDocument<IAppointment>;

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    petName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    petType: {
      type: String,
      required: true,
      enum: PET_TYPES,
    },
    petBreed: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    appointmentDate: {
      type: String,
      required: true,
      match: [DATE_PATTERN, "Appointment date must be YYYY-MM-DD"],
    },
    appointmentTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Appointment time must be HH:mm"],
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      required: true,
      enum: APPOINTMENT_STATUSES,
      // A booking always starts as Pending; an admin confirms it later.
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Serves the availability query, which always filters by doctor and date and
// then needs to test status.
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });

/**
 * Exported so the global error handler can tell this conflict apart from a
 * duplicate email when Mongo reports a 11000, which carries no other context.
 */
export const SLOT_CONFLICT_INDEX = "appointment_slot_blocking_unique";

/**
 * The real double-booking guard.
 *
 * A check-then-insert in the controller would still let two concurrent requests
 * claim the same slot, so the uniqueness is enforced here instead. Only blocking
 * statuses participate, which is why this cannot be a plain unique index: a
 * cancelled booking must leave the slot rebookable.
 */
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    name: SLOT_CONFLICT_INDEX,
    partialFilterExpression: { status: { $in: BLOCKING_STATUSES } },
  }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointment>("Appointment", appointmentSchema);

export default Appointment;
