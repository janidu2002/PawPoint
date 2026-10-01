import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

import { WEEKDAYS, type Weekday } from "../types/doctor";

/**
 * A veterinarian working at PawPoint.
 *
 * Field-for-field mirror of `frontend/src/types/doctor.ts` - the two type sets
 * are written by hand, so this model is the backend half of that contract.
 */

/** 24-hour "HH:mm". Rejected at the schema layer so bad data never reaches a
 *  booking screen that would be unable to parse it. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface IDoctor {
  name: string;
  specialization: string;
  qualification: string;
  phoneNumber: string;
  availableDays: Weekday[];
  startTime: string;
  endTime: string;
  consultationFee: number;
  description: string;
  /** Publicly reachable image URL, or null until image upload exists. */
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorDocument = HydratedDocument<IDoctor>;

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    availableDays: {
      // An enum, so a typo like "Satday" is rejected rather than quietly
      // producing a doctor who can never be booked.
      type: [String],
      required: true,
      enum: WEEKDAYS,
      validate: {
        validator: (days: string[]) => days.length > 0,
        message: "Select at least one available day",
      },
    },
    startTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Start time must be HH:mm"],
    },
    endTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "End time must be HH:mm"],
    },
    consultationFee: {
      type: Number,
      required: true,
      min: [0, "Consultation fee cannot be negative"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor ?? mongoose.model<IDoctor>("Doctor", doctorSchema);

export default Doctor;
